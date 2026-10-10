from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.utils.dateparse import parse_date, parse_datetime
from aqi_data.models import AQIDaily, AQIHourly
from forecasting.models import ForecastDaily, ForecastHourly

class IsPolicymaker(IsAuthenticated):
    def has_permission(self, request, view):
        is_auth = super().has_permission(request, view)
        if not is_auth:
            return False
        return request.user.role == 'POLICYMAKER'

class TrendsAPIView(APIView):
    permission_classes = [IsPolicymaker]
    
    def get(self, request):
        station_id = request.query_params.get('station_id')
        city = request.query_params.get('city')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        granularity = request.query_params.get('granularity', 'daily')
        
        if not start_date or not end_date:
            raise ValidationError("start_date and end_date query parameters are required.")
            
        try:
            start = parse_datetime(start_date) or parse_date(start_date)
            end = parse_datetime(end_date) or parse_date(end_date)
            if start is None or end is None:
                raise ValueError
        except ValueError:
            raise ValidationError("Invalid date format. Use YYYY-MM-DD or ISO 8601 timestamps.")
            
        # Observations
        if granularity == 'daily':
            obs_qs = AQIDaily.objects.filter(day__gte=start, day__lte=end)
            pred_qs = ForecastDaily.objects.filter(window_start__gte=start, window_start__lte=end, run__status='ok')
        else:
            obs_qs = AQIHourly.objects.filter(ts__gte=start, ts__lte=end)
            pred_qs = ForecastHourly.objects.filter(target_ts__gte=start, target_ts__lte=end, run__status='ok')
            
        if station_id:
            obs_qs = obs_qs.filter(station_id=station_id)
            pred_qs = pred_qs.filter(station_id=station_id)
        if city:
            obs_qs = obs_qs.filter(station__city__icontains=city)
            pred_qs = pred_qs.filter(station__city__icontains=city)
            
        obs_qs = obs_qs.select_related('station', 'cat')
        pred_qs = pred_qs.select_related('station', 'cat', 'run')
        
        # Limit to 1000 records each to prevent payload issues
        obs_data = []
        for o in obs_qs[:1000]:
            if granularity == 'daily':
                obs_data.append({
                    'station_id': o.station_id,
                    'city': o.station.city,
                    'date': o.day,
                    'aqi': o.aqi,
                    'dominant': o.dominant,
                    'category': o.cat.label if o.cat else None
                })
            else:
                obs_data.append({
                    'station_id': o.station_id,
                    'city': o.station.city,
                    'ts': o.ts,
                    'aqi': o.aqi,
                    'dominant': o.dominant,
                    'category': o.cat.label if o.cat else None
                })
                
        pred_data = []
        for p in pred_qs[:1000]:
            if granularity == 'daily':
                pred_data.append({
                    'station_id': p.station_id,
                    'city': p.station.city,
                    'origin_ts': p.run.origin_ts,
                    'target_date': p.window_start,
                    'lead_day': p.lead_day,
                    'aqi': p.aqi,
                    'dominant': p.dominant,
                    'category': p.cat.label if p.cat else None
                })
            else:
                pred_data.append({
                    'station_id': p.station_id,
                    'city': p.station.city,
                    'origin_ts': p.run.origin_ts,
                    'target_ts': p.target_ts,
                    'lead_h': p.lead_h,
                    'aqi': p.aqi,
                    'dominant': p.dominant,
                    'category': p.cat.label if p.cat else None
                })

        return Response({
            "granularity": granularity,
            "start_date": start_date,
            "end_date": end_date,
            "observed_count": len(obs_data),
            "predicted_count": len(pred_data),
            "observed": obs_data,
            "predicted": pred_data
        })
