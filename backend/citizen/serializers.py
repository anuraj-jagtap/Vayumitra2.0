from rest_framework import serializers
from .models import Drive, Rsvp, Checkin, OrganizerInterest, CitizenReport, DriveReport

class DriveSerializer(serializers.ModelSerializer):
    spots_left = serializers.IntegerField(read_only=True)

    class Meta:
        model = Drive
        fields = [
            'id', 'title', 'type', 'description', 'what_to_bring',
            'participation_options', 'organizer', 'verified_organizer',
            'starts_at', 'ends_at', 'place_name', 'lat', 'lng',
            'ward', 'spots_total', 'spots_left', 'status', 'ward_banner'
        ]

class RsvpSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rsvp
        fields = ['id', 'user', 'drive', 'created_at']
        read_only_fields = ['user', 'created_at']

class OrganizerInterestSerializer(serializers.ModelSerializer):
    honeypot = serializers.CharField(required=False, write_only=True, allow_blank=True)

    class Meta:
        model = OrganizerInterest
        fields = [
            'id', 'org_name', 'contact_person', 'email', 'phone',
            'website', 'title', 'description', 'proposed_date',
            'place_name', 'consent', 'created_at', 'honeypot'
        ]

    def validate(self, attrs):
        if attrs.get('honeypot'):
            raise serializers.ValidationError("Bot submission rejected.")
        return attrs

class CitizenReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = CitizenReport
        fields = ['id', 'reporter', 'category', 'note', 'lat', 'lng', 'photo', 'status', 'created_at']
        read_only_fields = ['reporter', 'status', 'created_at']
