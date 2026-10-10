from rest_framework import generics
from rest_framework.exceptions import ValidationError
from .models import VLatestHourly, VLatestDaily
from .serializers import VLatestHourlySerializer, VLatestDailySerializer

class HourlyForecastListAPIView(generics.ListAPIView):
    serializer_class = VLatestHourlySerializer

    def get_queryset(self):
        queryset = VLatestHourly.objects.all().order_by('station_id', 'target_ts')

        city = self.request.query_params.get('city', None)
        if city:
            queryset = queryset.filter(city__icontains=city)

        station_id = self.request.query_params.get('station_id', None)
        if station_id:
            queryset = queryset.filter(station_id=station_id)

        lead_h = self.request.query_params.get('lead_h', None)
        if lead_h:
            try:
                lead_h_val = int(lead_h)
                queryset = queryset.filter(lead_h=lead_h_val)
            except ValueError:
                raise ValidationError({'lead_h': 'Must be an integer.'})

        return queryset

class DailyForecastListAPIView(generics.ListAPIView):
    serializer_class = VLatestDailySerializer

    def get_queryset(self):
        queryset = VLatestDaily.objects.all().order_by('station_id', 'window_start')

        city = self.request.query_params.get('city', None)
        if city:
            queryset = queryset.filter(city__icontains=city)

        station_id = self.request.query_params.get('station_id', None)
        if station_id:
            queryset = queryset.filter(station_id=station_id)

        lead_day = self.request.query_params.get('lead_day', None)
        if lead_day:
            try:
                lead_day_val = int(lead_day)
                queryset = queryset.filter(lead_day=lead_day_val)
            except ValueError:
                raise ValidationError({'lead_day': 'Must be an integer.'})

        return queryset
