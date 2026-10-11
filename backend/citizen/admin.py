import random
import string
from django.contrib import admin
from .models import Drive, Rsvp, Checkin, OrganizerInterest, CitizenReport, DriveReport, CitizenProfile

def generate_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

@admin.action(description="Approve selected pending drives and issue check-in codes")
def approve_drives(modeladmin, request, queryset):
    for drive in queryset:
        drive.status = 'verified'
        if not drive.checkin_code:
            drive.checkin_code = generate_code()
        drive.save()

@admin.action(description="Reject selected drives")
def reject_drives(modeladmin, request, queryset):
    queryset.update(status='rejected')

@admin.register(Drive)
class DriveAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'status', 'organizer', 'starts_at', 'spots_total', 'spots_left', 'checkin_code')
    list_filter = ('status', 'type', 'verified_organizer', 'ward')
    search_fields = ('title', 'organizer', 'place_name', 'ward')
    actions = [approve_drives, reject_drives]
    readonly_fields = ('created_at',)

@admin.register(CitizenReport)
class CitizenReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'category', 'status', 'lat', 'lng', 'created_at', 'reporter')
    list_filter = ('category', 'status', 'created_at')
    search_fields = ('note',)

@admin.register(Rsvp)
class RsvpAdmin(admin.ModelAdmin):
    list_display = ('user', 'drive', 'created_at')

@admin.register(Checkin)
class CheckinAdmin(admin.ModelAdmin):
    list_display = ('user', 'drive', 'points_awarded', 'created_at')

@admin.register(OrganizerInterest)
class OrganizerInterestAdmin(admin.ModelAdmin):
    list_display = ('org_name', 'email', 'title', 'place_name', 'created_at')

@admin.register(DriveReport)
class DriveReportAdmin(admin.ModelAdmin):
    list_display = ('drive', 'reporter', 'reason', 'created_at')

@admin.register(CitizenProfile)
class CitizenProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'health_profile', 'points', 'preferred_city')
