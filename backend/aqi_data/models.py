from django.db import models

class Station(models.Model):
    station_id = models.CharField(max_length=50, primary_key=True)
    cpcb_site_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    name = models.CharField(max_length=255)
    locality = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=100, default='Delhi')
    lat = models.FloatField()
    lon = models.FloatField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stations'
        constraints = [
            models.CheckConstraint(check=models.Q(lat__range=(-90, 90)), name='stations_lat_check'),
            models.CheckConstraint(check=models.Q(lon__range=(-180, 180)), name='stations_lon_check'),
        ]

class AQICategory(models.Model):
    cat = models.SmallIntegerField(primary_key=True)
    label = models.CharField(max_length=50)
    aqi_min = models.SmallIntegerField()
    aqi_max = models.SmallIntegerField()

    class Meta:
        db_table = 'aqi_categories'

class ObservationHourly(models.Model):
    id = models.BigAutoField(primary_key=True)
    station = models.ForeignKey(Station, on_delete=models.CASCADE, db_column='station_id')
    ts = models.DateTimeField()
    pm25 = models.FloatField(null=True, blank=True)
    pm10 = models.FloatField(null=True, blank=True)
    no2 = models.FloatField(null=True, blank=True)
    so2 = models.FloatField(null=True, blank=True)
    co = models.FloatField(null=True, blank=True)
    o3 = models.FloatField(null=True, blank=True)
    nh3 = models.FloatField(null=True, blank=True)
    qc_flag = models.CharField(max_length=20, default='ok')
    source = models.CharField(max_length=100)
    ingested_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'observations_hourly'
        constraints = [
            models.UniqueConstraint(fields=['station', 'ts'], name='observations_hourly_pkey_uniq'),
            models.CheckConstraint(check=models.Q(qc_flag__in=['ok', 'interpolated', 'suspect']), name='observations_hourly_qc_flag_check'),
        ]
        indexes = [
            models.Index(fields=['-ts'], name='obs_hourly_ts_idx')
        ]

class AQIHourly(models.Model):
    id = models.BigAutoField(primary_key=True)
    station = models.ForeignKey(Station, on_delete=models.CASCADE, db_column='station_id')
    ts = models.DateTimeField()
    aqi = models.SmallIntegerField(null=True, blank=True)
    dominant = models.CharField(max_length=50, null=True, blank=True)
    cat = models.ForeignKey(AQICategory, on_delete=models.SET_NULL, null=True, blank=True, db_column='cat')

    class Meta:
        db_table = 'aqi_hourly'
        constraints = [
            models.UniqueConstraint(fields=['station', 'ts'], name='aqi_hourly_pkey_uniq'),
        ]
        indexes = [
            models.Index(fields=['-ts'], name='aqi_hourly_ts_idx')
        ]

class AQIDaily(models.Model):
    id = models.BigAutoField(primary_key=True)
    station = models.ForeignKey(Station, on_delete=models.CASCADE, db_column='station_id')
    day = models.DateField()
    pm25 = models.FloatField(null=True, blank=True)
    pm10 = models.FloatField(null=True, blank=True)
    no2 = models.FloatField(null=True, blank=True)
    so2 = models.FloatField(null=True, blank=True)
    co = models.FloatField(null=True, blank=True)
    o3 = models.FloatField(null=True, blank=True)
    nh3 = models.FloatField(null=True, blank=True)
    n_hours = models.SmallIntegerField()
    aqi = models.SmallIntegerField(null=True, blank=True)
    dominant = models.CharField(max_length=50, null=True, blank=True)
    cat = models.ForeignKey(AQICategory, on_delete=models.SET_NULL, null=True, blank=True, db_column='cat')

    class Meta:
        db_table = 'aqi_daily'
        constraints = [
            models.UniqueConstraint(fields=['station', 'day'], name='aqi_daily_pkey_uniq'),
        ]

# DASHBOARD-FACING VIEWS
class VStationCurrent(models.Model):
    station_id = models.CharField(max_length=50, primary_key=True)
    station_name = models.CharField(max_length=255)
    locality = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    ts = models.DateTimeField()
    aqi = models.SmallIntegerField()
    dominant = models.CharField(max_length=50)
    category = models.CharField(max_length=50)

    class Meta:
        managed = False
        db_table = 'v_station_current'
