from django.db import models
from django.conf import settings
from aqi_data.models import Station

class CitizenProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='citizen_profile')
    preferred_station = models.ForeignKey(Station, on_delete=models.SET_NULL, null=True, blank=True, related_name='favorited_by')
    preferred_city = models.CharField(max_length=100, blank=True, null=True)
    health_profile = models.CharField(max_length=50, default='general')
    points = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'citizen_profile'

class CitizenReport(models.Model):
    CATEGORY_CHOICES = [
        ('construction_dust', 'Construction Dust'),
        ('garbage_burning', 'Garbage/Biomass Burning'),
        ('industrial_smoke', 'Industrial Smoke'),
        ('traffic_jam', 'Traffic Jam'),
        ('vehicle_idling', 'Vehicle Idling'),
    ]
    STATUS_CHOICES = [
        ('new', 'New'),
        ('under_review', 'Under Review'),
        ('resolved', 'Resolved'),
    ]

    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='citizen_reports')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    note = models.TextField(blank=True, max_length=500)
    lat = models.FloatField()
    lng = models.FloatField()
    photo = models.ImageField(upload_to='citizen_reports/', null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='new')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'citizen_reports'
        ordering = ['-created_at']

class Drive(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]

    title = models.CharField(max_length=200)
    type = models.CharField(max_length=100)
    description = models.TextField()
    what_to_bring = models.JSONField(default=list, blank=True)
    participation_options = models.JSONField(default=list, blank=True)
    organizer = models.CharField(max_length=150)
    verified_organizer = models.BooleanField(default=False)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    place_name = models.CharField(max_length=255)
    lat = models.FloatField()
    lng = models.FloatField()
    ward = models.CharField(max_length=100)
    spots_total = models.PositiveIntegerField(default=50)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    checkin_code = models.CharField(max_length=10, blank=True, null=True)
    ward_banner = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'citizen_drives'
        ordering = ['starts_at']

    @property
    def spots_left(self):
        rsvp_count = self.rsvps.count()
        return max(0, self.spots_total - rsvp_count)

class Rsvp(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='drive_rsvps')
    drive = models.ForeignKey(Drive, on_delete=models.CASCADE, related_name='rsvps')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'citizen_rsvps'
        unique_together = ('user', 'drive')

class Checkin(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='drive_checkins')
    drive = models.ForeignKey(Drive, on_delete=models.CASCADE, related_name='checkins')
    points_awarded = models.IntegerField(default=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'citizen_checkins'
        unique_together = ('user', 'drive')

class OrganizerInterest(models.Model):
    org_name = models.CharField(max_length=150)
    contact_person = models.CharField(max_length=100, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    proposed_date = models.DateField(null=True, blank=True)
    place_name = models.CharField(max_length=255)
    consent = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'citizen_organizer_interests'

class DriveReport(models.Model):
    drive = models.ForeignKey(Drive, on_delete=models.CASCADE, related_name='reports')
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    reason = models.CharField(max_length=100)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'citizen_drive_reports'
