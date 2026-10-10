from django.db import models
from aqi_data.models import Station, AQICategory

class ModelVersion(models.Model):
    model_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    trained_at = models.DateTimeField(auto_now_add=True)
    train_start = models.DateTimeField(null=True, blank=True)
    train_end = models.DateTimeField(null=True, blank=True)
    params = models.JSONField(null=True, blank=True)
    metrics = models.JSONField(null=True, blank=True)
    artifact_uri = models.CharField(max_length=255)
    is_active = models.BooleanField(default=False)

    class Meta:
        db_table = 'model_versions'
        constraints = [
            models.UniqueConstraint(fields=['is_active'], condition=models.Q(is_active=True), name='one_active_model')
        ]

class ForecastRun(models.Model):
    run_id = models.BigAutoField(primary_key=True)
    model = models.ForeignKey(ModelVersion, on_delete=models.CASCADE, db_column='model_id')
    origin_ts = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='running')
    error = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'forecast_runs'
        constraints = [
            models.UniqueConstraint(fields=['model', 'origin_ts'], name='forecast_runs_model_id_origin_ts_key'),
            models.CheckConstraint(check=models.Q(status__in=['running', 'ok', 'failed']), name='forecast_runs_status_check')
        ]

class ForecastHourly(models.Model):
    id = models.BigAutoField(primary_key=True)
    run = models.ForeignKey(ForecastRun, on_delete=models.CASCADE, db_column='run_id')
    station = models.ForeignKey(Station, on_delete=models.CASCADE, db_column='station_id')
    lead_h = models.SmallIntegerField()
    target_ts = models.DateTimeField()
    pm25 = models.FloatField(null=True, blank=True)
    pm10 = models.FloatField(null=True, blank=True)
    no2 = models.FloatField(null=True, blank=True)
    so2 = models.FloatField(null=True, blank=True)
    co = models.FloatField(null=True, blank=True)
    o3 = models.FloatField(null=True, blank=True)
    aqi = models.SmallIntegerField(null=True, blank=True)
    dominant = models.CharField(max_length=50, null=True, blank=True)
    cat = models.ForeignKey(AQICategory, on_delete=models.SET_NULL, null=True, blank=True, db_column='cat')

    class Meta:
        db_table = 'forecasts_hourly'
        constraints = [
            models.UniqueConstraint(fields=['run', 'station', 'lead_h'], name='forecasts_hourly_pkey_uniq'),
            models.CheckConstraint(check=models.Q(lead_h__range=(1, 24)), name='forecasts_hourly_lead_h_check')
        ]
        indexes = [
            models.Index(fields=['station', 'target_ts'], name='fc_hourly_target_idx')
        ]

class ForecastDaily(models.Model):
    id = models.BigAutoField(primary_key=True)
    run = models.ForeignKey(ForecastRun, on_delete=models.CASCADE, db_column='run_id')
    station = models.ForeignKey(Station, on_delete=models.CASCADE, db_column='station_id')
    lead_day = models.SmallIntegerField()
    window_start = models.DateTimeField()
    window_end = models.DateTimeField()
    pm25 = models.FloatField(null=True, blank=True)
    pm10 = models.FloatField(null=True, blank=True)
    no2 = models.FloatField(null=True, blank=True)
    so2 = models.FloatField(null=True, blank=True)
    co = models.FloatField(null=True, blank=True)
    o3 = models.FloatField(null=True, blank=True)
    aqi = models.SmallIntegerField(null=True, blank=True)
    dominant = models.CharField(max_length=50, null=True, blank=True)
    cat = models.ForeignKey(AQICategory, on_delete=models.SET_NULL, null=True, blank=True, db_column='cat')

    class Meta:
        db_table = 'forecasts_daily'
        constraints = [
            models.UniqueConstraint(fields=['run', 'station', 'lead_day'], name='forecasts_daily_pkey_uniq'),
            models.CheckConstraint(check=models.Q(lead_day__range=(1, 7)), name='forecasts_daily_lead_day_check')
        ]

# DASHBOARD-FACING VIEWS
class LatestRun(models.Model):
    run_id = models.BigIntegerField(primary_key=True)
    model_id = models.IntegerField()
    origin_ts = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'latest_run'

class VLatestHourly(models.Model):
    id = models.BigAutoField(primary_key=True)
    station_id = models.CharField(max_length=50)
    station_name = models.CharField(max_length=255)
    locality = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    origin_ts = models.DateTimeField()
    lead_h = models.SmallIntegerField()
    target_ts = models.DateTimeField()
    pm25 = models.FloatField()
    pm10 = models.FloatField()
    no2 = models.FloatField()
    so2 = models.FloatField()
    co = models.FloatField()
    o3 = models.FloatField()
    aqi = models.SmallIntegerField()
    dominant = models.CharField(max_length=50)
    category = models.CharField(max_length=50)

    class Meta:
        managed = False
        db_table = 'v_latest_hourly'

class VLatestDaily(models.Model):
    id = models.BigAutoField(primary_key=True)
    station_id = models.CharField(max_length=50)
    station_name = models.CharField(max_length=255)
    locality = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    origin_ts = models.DateTimeField()
    lead_day = models.SmallIntegerField()
    window_start = models.DateTimeField()
    window_end = models.DateTimeField()
    pm25 = models.FloatField()
    pm10 = models.FloatField()
    no2 = models.FloatField()
    so2 = models.FloatField()
    co = models.FloatField()
    o3 = models.FloatField()
    aqi = models.SmallIntegerField()
    dominant = models.CharField(max_length=50)
    category = models.CharField(max_length=50)

    class Meta:
        managed = False
        db_table = 'v_latest_daily'
