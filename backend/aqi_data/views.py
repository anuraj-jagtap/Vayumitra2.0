from rest_framework import generics
from django.db.models import Q
from rest_framework.exceptions import ValidationError
from .models import Station, VStationCurrent, ObservationHourly
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
            c = city.strip().lower()
            if c in ['delhi ncr', 'ncr', 'all']:
                pass  # Return all NCR stations
            elif c in ['gurgaon', 'gurugram']:
                queryset = queryset.filter(
                    Q(city__icontains='gurgaon') | Q(city__icontains='gurugram') |
                    Q(name__icontains='gurgaon') | Q(name__icontains='gurugram') |
                    Q(locality__icontains='gurgaon') | Q(locality__icontains='gurugram')
                )
            elif c == 'noida':
                queryset = queryset.filter(
                    Q(city__icontains='noida') | Q(name__icontains='noida') | Q(locality__icontains='noida')
                )
            elif c == 'faridabad':
                queryset = queryset.filter(
                    Q(city__icontains='faridabad') | Q(name__icontains='faridabad') | Q(locality__icontains='faridabad')
                )
            elif c == 'delhi':
                queryset = queryset.filter(city__icontains='delhi')
            else:
                queryset = queryset.filter(
                    Q(city__icontains=city) | Q(name__icontains=city) | Q(locality__icontains=city)
                )
            
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
        
        # 1. Filter by is_active (default True, excludes deprecated duplicate stubs)
        is_active_param = self.request.query_params.get('is_active', 'true')
        if is_active_param.lower() in ['true', '1', 'yes']:
            active_ids = Station.objects.filter(is_active=True).values_list('station_id', flat=True)
            queryset = queryset.filter(station_id__in=active_ids)
        elif is_active_param.lower() in ['false', '0', 'no']:
            inactive_ids = Station.objects.filter(is_active=False).values_list('station_id', flat=True)
            queryset = queryset.filter(station_id__in=inactive_ids)
        
        city = self.request.query_params.get('city', None)
        if city:
            c = city.strip().lower()
            if c in ['delhi ncr', 'ncr', 'all']:
                pass  # Return all NCR stations
            elif c in ['gurgaon', 'gurugram']:
                queryset = queryset.filter(
                    Q(city__icontains='gurgaon') | Q(city__icontains='gurugram') |
                    Q(station_name__icontains='gurgaon') | Q(station_name__icontains='gurugram') |
                    Q(locality__icontains='gurgaon') | Q(locality__icontains='gurugram')
                )
            elif c == 'noida':
                queryset = queryset.filter(
                    Q(city__icontains='noida') | Q(station_name__icontains='noida') | Q(locality__icontains='noida')
                )
            elif c == 'faridabad':
                queryset = queryset.filter(
                    Q(city__icontains='faridabad') | Q(station_name__icontains='faridabad') | Q(locality__icontains='faridabad')
                )
            elif c == 'delhi':
                queryset = queryset.filter(city__icontains='delhi')
            else:
                queryset = queryset.filter(
                    Q(city__icontains=city) | Q(station_name__icontains=city) | Q(locality__icontains=city)
                )
            
        station_id = self.request.query_params.get('station_id', None)
        if station_id:
            queryset = queryset.filter(station_id=station_id)
            
        return queryset

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        results = response.data.get('results', []) if isinstance(response.data, dict) else response.data
        if results:
            station_ids = [r['station_id'] for r in results]
            obs_qs = ObservationHourly.objects.filter(station_id__in=station_ids).order_by('station_id', '-ts').distinct('station_id')
            obs_map = {obs.station_id: obs for obs in obs_qs}
            for r in results:
                obs = obs_map.get(r['station_id'])
                r['pm25'] = obs.pm25 if obs and obs.pm25 is not None else None
                r['pm10'] = obs.pm10 if obs and obs.pm10 is not None else None
                r['no2'] = obs.no2 if obs and obs.no2 is not None else None
                r['so2'] = obs.so2 if obs and obs.so2 is not None else None
                r['co'] = obs.co if obs and obs.co is not None else None
                r['o3'] = obs.o3 if obs and obs.o3 is not None else None
                r['nh3'] = obs.nh3 if obs and obs.nh3 is not None else None
        return response
