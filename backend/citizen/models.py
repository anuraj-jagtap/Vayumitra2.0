from django.db import models
from django.conf import settings

class CitizenProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='citizen_profile')
    
    class Meta:
        db_table = 'citizen_profile'
