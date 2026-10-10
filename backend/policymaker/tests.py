from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from aqi_data.models import Station, AQICategory, AQIDaily
from forecasting.models import ModelVersion, ForecastRun, ForecastDaily
from authentication.models import User

class TrendsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('policymaker-trends')
        
        self.s1 = Station.objects.create(station_id='S-1', name='Station 1', city='Delhi', lat=28.0, lon=77.0)
        self.cat1 = AQICategory.objects.create(cat=1, label="Good", aqi_min=0, aqi_max=50)
        
        self.policymaker = User.objects.create_user(username='pm', password='pwd', role='POLICYMAKER')
        self.citizen = User.objects.create_user(username='cit', password='pwd', role='CITIZEN')
        
        now = timezone.now()
        yesterday = now - timedelta(days=1)
        
        AQIDaily.objects.create(station=self.s1, day=yesterday.date(), n_hours=24, aqi=45, dominant='PM2.5', cat=self.cat1)
        
        model = ModelVersion.objects.create(name="Test Model", is_active=True, artifact_uri="dummy")
        run = ForecastRun.objects.create(model=model, origin_ts=yesterday, status='ok')
        ForecastDaily.objects.create(run=run, station=self.s1, lead_day=1, window_start=now, window_end=now+timedelta(days=1), aqi=50, dominant='PM10', cat=self.cat1)
        
    def test_trends_unauthenticated(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_trends_citizen_denied(self):
        self.client.force_authenticate(user=self.citizen)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
    def test_trends_policymaker_missing_dates(self):
        self.client.force_authenticate(user=self.policymaker)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_trends_policymaker_success(self):
        self.client.force_authenticate(user=self.policymaker)
        start = (timezone.now() - timedelta(days=2)).strftime('%Y-%m-%d')
        end = (timezone.now() + timedelta(days=2)).strftime('%Y-%m-%d')
        response = self.client.get(self.url, {'start_date': start, 'end_date': end, 'city': 'Delhi'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['observed_count'], 1)
        self.assertEqual(response.data['predicted_count'], 1)
