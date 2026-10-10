from django.db import models
from aqi_data.models import Station

class WeatherHourly(models.Model):
    id = models.BigAutoField(primary_key=True)
    station = models.ForeignKey(Station, on_delete=models.CASCADE, db_column='station_id')
    ts = models.DateTimeField()
    temp_c = models.FloatField(null=True, blank=True)
    rh_pct = models.FloatField(null=True, blank=True)
    wind_speed_kmh = models.FloatField(null=True, blank=True)
    wind_dir_deg = models.FloatField(null=True, blank=True)
    pressure_hpa = models.FloatField(null=True, blank=True)
    precip_mm = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'weather_hourly'
        constraints = [
            models.UniqueConstraint(fields=['station', 'ts'], name='weather_hourly_pkey_uniq')
        ]

class WeatherForecast(models.Model):
    id = models.BigAutoField(primary_key=True)
    station = models.ForeignKey(Station, on_delete=models.CASCADE, db_column='station_id')
    issued_at = models.DateTimeField()
    ts = models.DateTimeField()
    temp_c = models.FloatField(null=True, blank=True)
    rh_pct = models.FloatField(null=True, blank=True)
    wind_speed_kmh = models.FloatField(null=True, blank=True)
    wind_dir_deg = models.FloatField(null=True, blank=True)
    pressure_hpa = models.FloatField(null=True, blank=True)
    precip_mm = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'weather_forecast'
        constraints = [
            models.UniqueConstraint(fields=['station', 'issued_at', 'ts'], name='weather_forecast_pkey_uniq')
        ]
