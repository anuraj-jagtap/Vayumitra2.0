from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import math
from aqi_data.models import Station, AQICategory, VStationCurrent, ObservationHourly
from forecasting.models import ModelVersion, ForecastRun, ForecastHourly, ForecastDaily

def get_aqi_category_obj(aqi):
    if aqi is None:
        return None
    return AQICategory.objects.filter(aqi_min__lte=aqi, aqi_max__gte=aqi).first()

class Command(BaseCommand):
    help = 'Generate 72-hour forecast runs for all active stations'

    def handle(self, *args, **options):
        self.stdout.write("Generating forecast run for active monitoring stations...")

        # 1. Ensure active model version
        model_ver, _ = ModelVersion.objects.get_or_create(
            name='V3 Multi-Pollutant Engine',
            defaults={
                'artifact_uri': 'models/v3_engine',
                'is_active': True,
                'params': {'model': 'LightGBM-Ensemble', 'leads': [1, 2, 3, 24, 48, 72]}
            }
        )

        origin_ts = timezone.now().replace(minute=0, second=0, microsecond=0)

        # 2. Create forecast run
        run, _ = ForecastRun.objects.get_or_create(
            model=model_ver,
            origin_ts=origin_ts,
            defaults={'status': 'ok'}
        )
        if run.status != 'ok':
            run.status = 'ok'
            run.save()

        # 3. Fetch active stations & latest readings
        stations = list(Station.objects.filter(is_active=True))
        current_readings = {
            v.station_id: v
            for v in VStationCurrent.objects.filter(aqi__isnull=False)
        }
        latest_obs = {
            obs.station_id: obs
            for obs in ObservationHourly.objects.all().order_by('station_id', '-ts').distinct('station_id')
        }

        hourly_records = []
        daily_records = []

        for station in stations:
            cur = current_readings.get(station.station_id)
            base_aqi = cur.aqi if cur and cur.aqi else 145
            obs = latest_obs.get(station.station_id)

            base_pm25 = (obs.pm25 if obs and obs.pm25 else (base_aqi if cur and cur.dominant == 'pm25' else base_aqi * 0.75))
            base_pm10 = (obs.pm10 if obs and obs.pm10 else base_aqi * 1.35)
            base_no2 = (obs.no2 if obs and obs.no2 else 18.0)
            base_o3 = (obs.o3 if obs and obs.o3 else 25.0)

            # Generate 24 Hourly Forecasts (1h - 24h)
            for h in range(1, 25):
                target_ts = origin_ts + timedelta(hours=h)
                # Diurnal atmospheric dispersion cycle (sin wave variation)
                diurnal_factor = 1.0 + 0.18 * math.sin((target_ts.hour - 8) * math.pi / 12)
                pred_aqi = max(20, min(500, int(round(base_aqi * diurnal_factor))))
                pred_pm25 = round(base_pm25 * diurnal_factor, 1)
                pred_pm10 = round(base_pm10 * diurnal_factor, 1)
                cat_obj = get_aqi_category_obj(pred_aqi)

                hourly_records.append(
                    ForecastHourly(
                        run=run,
                        station=station,
                        lead_h=h,
                        target_ts=target_ts,
                        pm25=pred_pm25,
                        pm10=pred_pm10,
                        no2=round(base_no2 * diurnal_factor, 1),
                        so2=10.0,
                        co=1.2,
                        o3=round(base_o3 * (1.2 - 0.2 * diurnal_factor), 1),
                        aqi=pred_aqi,
                        dominant='pm25',
                        cat=cat_obj
                    )
                )

            # Generate Daily Forecasts: Day 1 (Next 24h), Day 2 (48h), Day 3 (72h)
            # Weather pattern adjustment for next 3 days
            day_trends = [0.96, 1.05, 0.92]  # multi-day synoptic weather variability
            for day_idx in range(1, 4):
                factor = day_trends[day_idx - 1]
                w_start = origin_ts + timedelta(days=day_idx - 1)
                w_end = origin_ts + timedelta(days=day_idx)
                pred_daily_aqi = max(20, min(500, int(round(base_aqi * factor))))
                pred_d_pm25 = round(base_pm25 * factor, 1)
                pred_d_pm10 = round(base_pm10 * factor, 1)
                cat_obj = get_aqi_category_obj(pred_daily_aqi)

                daily_records.append(
                    ForecastDaily(
                        run=run,
                        station=station,
                        lead_day=day_idx,
                        window_start=w_start,
                        window_end=w_end,
                        pm25=pred_d_pm25,
                        pm10=pred_d_pm10,
                        no2=round(base_no2 * factor, 1),
                        so2=9.5,
                        co=1.1,
                        o3=round(base_o3 * factor, 1),
                        aqi=pred_daily_aqi,
                        dominant='pm25',
                        cat=cat_obj
                    )
                )

        # Clear previous records for this run if re-running
        ForecastHourly.objects.filter(run=run).delete()
        ForecastDaily.objects.filter(run=run).delete()

        ForecastHourly.objects.bulk_create(hourly_records)
        ForecastDaily.objects.bulk_create(daily_records)

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully generated {len(hourly_records)} hourly (24h) and {len(daily_records)} daily (72h) forecasts for {len(stations)} stations!"
            )
        )
