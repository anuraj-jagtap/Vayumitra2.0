from django.db import models
from django.conf import settings

class PolicymakerProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='policymaker_profile')
    department = models.CharField(max_length=100, blank=True)
    designation = models.CharField(max_length=100, blank=True)
    organization = models.CharField(max_length=100, blank=True)
    approval_status = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'policymaker_profile'
