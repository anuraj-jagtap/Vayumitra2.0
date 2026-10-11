from rest_framework import serializers
from .models import WeatherHourly, WeatherForecast

class WeatherHourlySerializer(serializers.ModelSerializer):
    station_name = serializers.CharField(source='station.name', read_only=True)
    locality = serializers.CharField(source='station.locality', read_only=True)

    class Meta:
        model = WeatherHourly
        fields = [
            'id',
            'station_id',
            'station_name',
            'locality',
            'ts',
            'temp_c',
            'rh_pct',
            'wind_speed_kmh',
            'wind_dir_deg',
            'pressure_hpa',
            'precip_mm',
        ]
