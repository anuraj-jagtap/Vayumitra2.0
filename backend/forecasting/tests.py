from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from aqi_data.models import Station
from forecasting.models import ModelVersion, ForecastRun, ForecastHourly, ForecastDaily

class HourlyForecastAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('forecast-hourly-list')
        
        self.s1 = Station.objects.create(station_id='S-1', name='Station 1', city='Delhi', lat=28.0, lon=77.0)
        self.s2 = Station.objects.create(station_id='S-2', name='Station 2', city='Mumbai', lat=19.0, lon=72.0)
        
        self.model = ModelVersion.objects.create(name="Test Model", is_active=True, artifact_uri="dummy")
        self.origin_ts = timezone.now()
        
        self.failed_run = ForecastRun.objects.create(model=self.model, origin_ts=self.origin_ts - timedelta(hours=1), status='failed')
        
        self.run = ForecastRun.objects.create(model=self.model, origin_ts=self.origin_ts, status='ok')
        
        ForecastHourly.objects.create(run=self.run, station=self.s1, lead_h=1, target_ts=self.origin_ts + timedelta(hours=1), aqi=120, dominant='PM2.5')
        ForecastHourly.objects.create(run=self.run, station=self.s2, lead_h=1, target_ts=self.origin_ts + timedelta(hours=1), aqi=60, dominant='PM10')
        ForecastHourly.objects.create(run=self.run, station=self.s1, lead_h=2, target_ts=self.origin_ts + timedelta(hours=2), aqi=130, dominant='PM2.5')

    def test_list_hourly_forecasts(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data['results']
        self.assertEqual(len(data), 3)

    def test_filter_by_city(self):
        response = self.client.get(self.url, {'city': 'Delhi'})
        data = response.data['results']
        self.assertEqual(len(data), 2)
        self.assertEqual(data[0]['station_id'], 'S-1')

    def test_filter_by_station_id(self):
        response = self.client.get(self.url, {'station_id': 'S-2'})
        data = response.data['results']
        self.assertEqual(len(data), 1)

    def test_filter_by_lead_h(self):
        response = self.client.get(self.url, {'lead_h': 2})
        data = response.data['results']
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['lead_h'], 2)

    def test_invalid_lead_h(self):
        response = self.client.get(self.url, {'lead_h': 'abc'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class DailyForecastAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('forecast-daily-list')
        
        self.s1 = Station.objects.create(station_id='S-1', name='Station 1', city='Delhi', lat=28.0, lon=77.0)
        
        self.model = ModelVersion.objects.create(name="Test Model", is_active=True, artifact_uri="dummy")
        self.origin_ts = timezone.now()
        
        self.run = ForecastRun.objects.create(model=self.model, origin_ts=self.origin_ts, status='ok')
        
        ForecastDaily.objects.create(
            run=self.run, station=self.s1, lead_day=1, 
            window_start=self.origin_ts, window_end=self.origin_ts + timedelta(days=1), 
            aqi=120, dominant='PM2.5'
        )
        ForecastDaily.objects.create(
            run=self.run, station=self.s1, lead_day=2, 
            window_start=self.origin_ts + timedelta(days=1), window_end=self.origin_ts + timedelta(days=2), 
            aqi=150, dominant='PM10'
        )

    def test_list_daily_forecasts(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data['results']
        self.assertEqual(len(data), 2)

    def test_filter_by_lead_day(self):
        response = self.client.get(self.url, {'lead_day': 2})
        data = response.data['results']
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['lead_day'], 2)
