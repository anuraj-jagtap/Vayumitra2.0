from django.db import models
from django.conf import settings
from aqi_data.models import Station

class CitizenProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='citizen_profile')
    preferred_station = models.ForeignKey(Station, on_delete=models.SET_NULL, null=True, blank=True, related_name='favorited_by')
    preferred_city = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        db_table = 'citizen_profile'
