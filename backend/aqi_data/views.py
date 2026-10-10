from rest_framework import generics
from django.db.models import Q
from rest_framework.exceptions import ValidationError
from .models import Station, VStationCurrent
from .serializers import StationSerializer, VStationCurrentSerializer

class StationListAPIView(generics.ListAPIView):
    serializer_class = StationSerializer
    
    def get_queryset(self):
        queryset = Station.objects.all().order_by('station_id')
        
        # 1. Filter by is_active (default True, override if authorized user provides 'is_active' param)
        is_active_param = self.request.query_params.get('is_active', None)
        
        if is_active_param is not None:
            # Check if user is authenticated/authorized
            if not self.request.user.is_authenticated:
                queryset = queryset.filter(is_active=True)
            else:
                if is_active_param.lower() in ['true', '1', 'yes']:
                    queryset = queryset.filter(is_active=True)
                elif is_active_param.lower() in ['false', '0', 'no']:
                    queryset = queryset.filter(is_active=False)
                else:
                    raise ValidationError({'is_active': 'Invalid value for is_active. Expected boolean.'})
        else:
            # Default to active stations only
            queryset = queryset.filter(is_active=True)
            
        # 2. Filter by city
        city = self.request.query_params.get('city', None)
        if city:
            queryset = queryset.filter(city__icontains=city)
            
        # 3. Search by name or locality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(locality__icontains=search)
            )
            
        return queryset

class CurrentAQIListAPIView(generics.ListAPIView):
    serializer_class = VStationCurrentSerializer
    
    def get_queryset(self):
        queryset = VStationCurrent.objects.exclude(aqi__isnull=True).order_by('station_id')
        
        city = self.request.query_params.get('city', None)
        if city:
            queryset = queryset.filter(city__icontains=city)
            
        station_id = self.request.query_params.get('station_id', None)
        if station_id:
            queryset = queryset.filter(station_id=station_id)
            
        return queryset
