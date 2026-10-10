from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from .models import Station, AQICategory, AQIHourly
from authentication.models import User

class StationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('station-list')
        
        # Create active stations
        self.station1 = Station.objects.create(
            station_id='DL-1', name='Anand Vihar', locality='Anand Vihar', city='Delhi', lat=28.6, lon=77.3, is_active=True
        )
        self.station2 = Station.objects.create(
            station_id='MH-1', name='Bandra', locality='Bandra West', city='Mumbai', lat=19.0, lon=72.8, is_active=True
        )
        # Create inactive station
        self.station3 = Station.objects.create(
            station_id='DL-2', name='Inactive Station', locality='Unknown', city='Delhi', lat=28.7, lon=77.4, is_active=False
        )
        
        self.user = User.objects.create_user(username='testuser', password='password')
        
    def test_list_active_stations_default(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data['results']
        self.assertEqual(len(data), 2)
        station_ids = [s['station_id'] for s in data]
        self.assertIn('DL-1', station_ids)
        self.assertIn('MH-1', station_ids)
        self.assertNotIn('DL-2', station_ids)

    def test_filter_by_city(self):
        response = self.client.get(self.url, {'city': 'Mumbai'})
        data = response.data['results']
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['station_id'], 'MH-1')
        
    def test_search_by_name(self):
        response = self.client.get(self.url, {'search': 'anand'})
        data = response.data['results']
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['station_id'], 'DL-1')
        
    def test_empty_result(self):
        response = self.client.get(self.url, {'city': 'Pune'})
        data = response.data['results']
        self.assertEqual(len(data), 0)
        
    def test_inactive_stations_unauthorized(self):
        response = self.client.get(self.url, {'is_active': 'false'})
        data = response.data['results']
        # Should ignore param and return active only
        self.assertEqual(len(data), 2)
        
    def test_inactive_stations_authorized(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url, {'is_active': 'false'})
        data = response.data['results']
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['station_id'], 'DL-2')
        
    def test_invalid_query_param(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url, {'is_active': 'invalid'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class CurrentAQIAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('current-aqi-list')
        
        self.cat1 = AQICategory.objects.create(cat=1, label="Good", aqi_min=0, aqi_max=50)
        self.cat2 = AQICategory.objects.create(cat=2, label="Satisfactory", aqi_min=51, aqi_max=100)
        
        self.s1 = Station.objects.create(station_id='S-1', name='Station 1', city='Delhi', lat=28.0, lon=77.0)
        self.s2 = Station.objects.create(station_id='S-2', name='Station 2', city='Mumbai', lat=19.0, lon=72.0)
        self.s3 = Station.objects.create(station_id='S-3', name='Station 3', city='Delhi', lat=28.1, lon=77.1)
        
        # S1 has good AQI
        AQIHourly.objects.create(station=self.s1, ts=timezone.now(), aqi=45, dominant='PM2.5', cat=self.cat1)
        # S2 has satisfactory AQI
        AQIHourly.objects.create(station=self.s2, ts=timezone.now(), aqi=85, dominant='PM10', cat=self.cat2)
        # S3 has NULL AQI
        AQIHourly.objects.create(station=self.s3, ts=timezone.now(), aqi=None, dominant=None, cat=None)
        
    def test_list_current_aqi_default(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data['results']
        
        # Should return S1 and S2, but NOT S3 because S3 has null AQI
        self.assertEqual(len(data), 2)
        station_ids = [s['station_id'] for s in data]
        self.assertIn('S-1', station_ids)
        self.assertIn('S-2', station_ids)
        self.assertNotIn('S-3', station_ids)

    def test_filter_by_city(self):
        response = self.client.get(self.url, {'city': 'Delhi'})
        data = response.data['results']
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['station_id'], 'S-1')
        
    def test_filter_by_station_id(self):
        response = self.client.get(self.url, {'station_id': 'S-2'})
        data = response.data['results']
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['station_id'], 'S-2')

    def test_empty_results(self):
        response = self.client.get(self.url, {'city': 'NonExistentCity'})
        data = response.data['results']
        self.assertEqual(len(data), 0)
