from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('CITIZEN', 'Citizen'),
        ('POLICYMAKER', 'Policymaker'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CITIZEN')

    class Meta:
        db_table = 'auth_user'
