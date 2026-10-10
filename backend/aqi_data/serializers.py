from rest_framework import serializers
from .models import Station, VStationCurrent

class StationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Station
        fields = ('station_id', 'cpcb_site_id', 'name', 'locality', 'city', 'lat', 'lon', 'is_active', 'created_at')

class VStationCurrentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VStationCurrent
        fields = ('station_id', 'station_name', 'locality', 'city', 'ts', 'aqi', 'dominant', 'category')
