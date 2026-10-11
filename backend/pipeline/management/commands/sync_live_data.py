import os
import json
import urllib.request
import urllib.parse
from datetime import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from aqi_data.models import Station, AQICategory, ObservationHourly, AQIHourly
from weather.models import WeatherHourly
from pipeline.models import IngestLog

DELHI_LAT = 28.6139
DELHI_LON = 77.2090

def get_aqi_category_id(aqi_value):
    if aqi_value is None:
        return None
    try:
        val = int(aqi_value)
    except (ValueError, TypeError):
        return None
    if val <= 50:
        return 1
    elif val <= 100:
        return 2
    elif val <= 200:
        return 3
    elif val <= 300:
        return 4
    elif val <= 400:
        return 5
    else:
        return 6

class Command(BaseCommand):
    help = "Sync live stations, air quality readings (WAQI), and weather observations (OpenWeather) into AWS RDS"

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, default=25, help='Max stations to fetch detailed readings for')
        parser.add_argument('--dry-run', action='store_true', help='Test API calls without writing to database')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        limit = options['limit']

        waqi_key = os.environ.get("WAQI_API_KEY", "").strip()
        owm_key = os.environ.get("OPENWEATHER_API_KEY", "").strip()

        self.stdout.write(self.style.NOTICE("==> Starting Live Data Ingestion Pipeline..."))
        if not waqi_key:
            self.stdout.write(self.style.WARNING("WAQI_API_KEY not found in environment!"))
        if not owm_key:
            self.stdout.write(self.style.WARNING("OPENWEATHER_API_KEY not found in environment!"))

        start_time = timezone.now()
        stations_synced = 0
        obs_synced = 0
        weather_synced = 0
        errors = []

        # -------------------------------------------------------------
        # 1. FETCH STATIONS & AIR QUALITY VIA WAQI
        # -------------------------------------------------------------
        if waqi_key:
            self.stdout.write("--> Connecting to WAQI API...")
            try:
                search_url = f"https://api.waqi.info/search/?keyword=delhi&token={waqi_key}"
                req = urllib.request.Request(search_url, headers={'User-Agent': 'Vayumitra/2.0'})
                with urllib.request.urlopen(req, timeout=15) as resp:
                    search_data = json.loads(resp.read().decode('utf-8'))

                if search_data.get("status") == "ok":
                    station_items = search_data.get("data", [])
                    self.stdout.write(f"    Found {len(station_items)} stations in Delhi region.")

                    for item in station_items[:limit]:
                        try:
                            uid = item.get("uid")
                            if not uid:
                                continue
                            station_id = f"site_{uid}"
                            name = item.get("station", {}).get("name", f"Station {uid}")
                            geo = item.get("station", {}).get("geo", [DELHI_LAT, DELHI_LON])
                            lat = float(geo[0]) if len(geo) > 0 else DELHI_LAT
                            lon = float(geo[1]) if len(geo) > 1 else DELHI_LON
                            
                            # Keep lat/lon within valid bounds
                            lat = max(-90.0, min(90.0, lat))
                            lon = max(-180.0, min(180.0, lon))

                            locality = name.split(",")[0].strip()

                            if not dry_run:
                                station, _ = Station.objects.update_or_create(
                                    station_id=station_id,
                                    defaults={
                                        "name": name,
                                        "locality": locality,
                                        "city": "Delhi",
                                        "lat": lat,
                                        "lon": lon,
                                        "is_active": True,
                                    }
                                )
                            stations_synced += 1

                            # Fetch detailed feed for this station
                            feed_url = f"https://api.waqi.info/feed/@{uid}/?token={waqi_key}"
                            feed_req = urllib.request.Request(feed_url, headers={'User-Agent': 'Vayumitra/2.0'})
                            with urllib.request.urlopen(feed_req, timeout=10) as feed_resp:
                                feed_json = json.loads(feed_resp.read().decode('utf-8'))

                            if feed_json.get("status") == "ok":
                                data = feed_json.get("data", {})
                                aqi_raw = data.get("aqi")
                                aqi_val = int(aqi_raw) if (aqi_raw is not None and str(aqi_raw).isdigit()) else None
                                dominant = data.get("dominentpol", "pm25")
                                cat_id = get_aqi_category_id(aqi_val)

                                iaqi = data.get("iaqi", {})
                                pm25 = iaqi.get("pm25", {}).get("v")
                                pm10 = iaqi.get("pm10", {}).get("v")
                                no2 = iaqi.get("no2", {}).get("v")
                                so2 = iaqi.get("so2", {}).get("v")
                                co = iaqi.get("co", {}).get("v")
                                o3 = iaqi.get("o3", {}).get("v")
                                nh3 = iaqi.get("nh3", {}).get("v")

                                time_info = data.get("time", {})
                                ts_str = time_info.get("iso")
                                if ts_str:
                                    try:
                                        ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                                    except Exception:
                                        ts = timezone.now()
                                else:
                                    ts = timezone.now()

                                # Truncate minutes to hour level
                                ts = ts.replace(minute=0, second=0, microsecond=0)

                                if not dry_run:
                                    # Upsert ObservationHourly
                                    ObservationHourly.objects.update_or_create(
                                        station=station,
                                        ts=ts,
                                        defaults={
                                            "pm25": pm25,
                                            "pm10": pm10,
                                            "no2": no2,
                                            "so2": so2,
                                            "co": co,
                                            "o3": o3,
                                            "nh3": nh3,
                                            "qc_flag": "ok",
                                            "source": "WAQI",
                                        }
                                    )

                                    # Upsert AQIHourly
                                    cat_obj = AQICategory.objects.filter(cat=cat_id).first() if cat_id else None
                                    AQIHourly.objects.update_or_create(
                                        station=station,
                                        ts=ts,
                                        defaults={
                                            "aqi": aqi_val,
                                            "dominant": dominant,
                                            "cat": cat_obj,
                                        }
                                    )
                                obs_synced += 1

                        except Exception as e:
                            errors.append(f"Station {item.get('uid')} error: {str(e)}")

                    self.stdout.write(self.style.SUCCESS(f"    Synced {stations_synced} stations and {obs_synced} AQI observations."))
                else:
                    errors.append(f"WAQI response status: {search_data.get('status')}")

            except Exception as e:
                errors.append(f"WAQI Fetch Failed: {str(e)}")
                self.stdout.write(self.style.ERROR(f"    WAQI Error: {e}"))

        # -------------------------------------------------------------
        # 2. FETCH CURRENT WEATHER VIA OPENWEATHER
        # -------------------------------------------------------------
        if owm_key:
            self.stdout.write("--> Connecting to OpenWeather API...")
            try:
                owm_url = f"https://api.openweathermap.org/data/2.5/weather?lat={DELHI_LAT}&lon={DELHI_LON}&appid={owm_key}&units=metric"
                req = urllib.request.Request(owm_url, headers={'User-Agent': 'Vayumitra/2.0'})
                with urllib.request.urlopen(req, timeout=15) as resp:
                    weather_json = json.loads(resp.read().decode('utf-8'))

                main = weather_json.get("main", {})
                wind = weather_json.get("wind", {})
                rain = weather_json.get("rain", {})

                temp_c = main.get("temp")
                rh_pct = main.get("humidity")
                pressure_hpa = main.get("pressure")
                wind_speed_kmh = round(float(wind.get("speed", 0)) * 3.6, 2)
                wind_dir_deg = wind.get("deg")
                precip_mm = rain.get("1h", 0.0)

                ts = timezone.now().replace(minute=0, second=0, microsecond=0)

                self.stdout.write(f"    Delhi Weather: {temp_c}°C, Humidity: {rh_pct}%, Wind: {wind_speed_kmh} km/h")

                if not dry_run:
                    # Associate current weather with all active stations
                    active_stations = Station.objects.filter(is_active=True)
                    for station in active_stations:
                        WeatherHourly.objects.update_or_create(
                            station=station,
                            ts=ts,
                            defaults={
                                "temp_c": temp_c,
                                "rh_pct": rh_pct,
                                "wind_speed_kmh": wind_speed_kmh,
                                "wind_dir_deg": wind_dir_deg,
                                "pressure_hpa": pressure_hpa,
                                "precip_mm": precip_mm,
                            }
                        )
                        weather_synced += 1

                self.stdout.write(self.style.SUCCESS(f"    Synced weather records for {weather_synced} stations."))

            except Exception as e:
                errors.append(f"OpenWeather Fetch Failed: {str(e)}")
                self.stdout.write(self.style.ERROR(f"    OpenWeather Error: {e}"))

        # -------------------------------------------------------------
        # 3. WRITE INGEST LOG
        # -------------------------------------------------------------
        finished_time = timezone.now()
        total_rows = obs_synced + weather_synced
        status = "ok" if not errors else ("partial" if total_rows > 0 else "failed")
        detail = f"Stations: {stations_synced}, AQI obs: {obs_synced}, Weather obs: {weather_synced}."
        if errors:
            detail += " Errors: " + "; ".join(errors[:3])

        if not dry_run:
            IngestLog.objects.create(
                job="sync_live_data",
                started_at=start_time,
                finished_at=finished_time,
                status=status if status in ['running', 'ok', 'failed'] else 'ok',
                rows_written=total_rows,
                detail=detail
            )

        self.stdout.write(self.style.SUCCESS(f"==> Pipeline complete! Status: {status}, Total records written: {total_rows}"))
