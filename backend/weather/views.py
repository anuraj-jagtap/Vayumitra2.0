from rest_framework import generics
from rest_framework.response import Response
from .models import WeatherHourly
from .serializers import WeatherHourlySerializer

class CurrentWeatherAPIView(generics.ListAPIView):
    """
    Returns the latest live weather observation across stations,
    optionally filtered by ?station_id=
    """
    serializer_class = WeatherHourlySerializer

    def get_queryset(self):
        queryset = WeatherHourly.objects.select_related('station').order_by('-ts')
        station_id = self.request.query_params.get('station_id')
        if station_id:
            queryset = queryset.filter(station_id=station_id)
        return queryset

    def list(self, request, *args, **kwargs):
        station_id = request.query_params.get('station_id')
        if station_id:
            return super().list(request, *args, **kwargs)
        
        # If no station_id provided, return latest observation
        latest = WeatherHourly.objects.select_related('station').order_by('-ts').first()
        if not latest:
            return Response([])
        serializer = self.get_serializer(latest)
        return Response(serializer.data)
