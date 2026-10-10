from rest_framework import serializers
from .models import VLatestHourly, VLatestDaily

class VLatestHourlySerializer(serializers.ModelSerializer):
    class Meta:
        model = VLatestHourly
        fields = (
            'station_id', 'station_name', 'locality', 'city',
            'origin_ts', 'lead_h', 'target_ts',
            'pm25', 'pm10', 'no2', 'so2', 'co', 'o3',
            'aqi', 'dominant', 'category'
        )

class VLatestDailySerializer(serializers.ModelSerializer):
    class Meta:
        model = VLatestDaily
        fields = (
            'station_id', 'station_name', 'locality', 'city',
            'origin_ts', 'lead_day', 'window_start', 'window_end',
            'pm25', 'pm10', 'no2', 'so2', 'co', 'o3',
            'aqi', 'dominant', 'category'
        )
