import math
import os
import requests
from datetime import datetime, timezone
from django.db import transaction
from django.utils import timezone as dj_timezone
from django.shortcuts import get_object_or_404
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from PIL import Image
import io
from django.core.files.uploadedfile import InMemoryUploadedFile

from .providers import get_normalized_stations, compute_cpcb_band
from .models import Drive, Rsvp, Checkin, OrganizerInterest, CitizenReport, DriveReport, CitizenProfile
from .serializers import (
    DriveSerializer, OrganizerInterestSerializer, CitizenReportSerializer
)

DEMO_STATION_OVERRIDES = {}

def apply_demo_overrides(station):
    """Pass-through live station data directly from provider/database."""
    return station

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0 # km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class NearestStationAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        lat_str = request.GET.get('lat')
        lng_str = request.GET.get('lng')

        stations, data_source = get_normalized_stations()
        if not stations:
            return Response({"error": "No station data available"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        if not lat_str or not lng_str:
            # Default to Anand Vihar / Central Delhi
            first_station = apply_demo_overrides(dict(stations[0]))
            first_station["distance_km"] = 0.0
            first_station["data_source"] = data_source
            return Response(first_station)

        try:
            u_lat = float(lat_str)
            u_lng = float(lng_str)
        except ValueError:
            return Response({"error": "Invalid lat/lng parameters"}, status=status.HTTP_400_BAD_REQUEST)

        nearest = None
        min_dist = float('inf')

        for st in stations:
            dist = haversine(u_lat, u_lng, st['lat'], st['lng'])
            if dist < min_dist:
                min_dist = dist
                nearest = st

        result = apply_demo_overrides(dict(nearest))
        result["distance_km"] = round(min_dist, 1)
        result["data_source"] = data_source
        return Response(result)

class StationListAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        stations, data_source = get_normalized_stations()
        stations = [apply_demo_overrides(dict(s)) for s in stations]
        return Response(stations)

class StationDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, station_id):
        stations, data_source = get_normalized_stations()
        for st in stations:
            if st.get('station_id') == station_id:
                res = apply_demo_overrides(dict(st))
                res["data_source"] = data_source
                return Response(res)
        for st in stations:
            if station_id.lower() in st.get('station_id', '').lower() or station_id.lower() in st.get('name', '').lower():
                res = apply_demo_overrides(dict(st))
                res["data_source"] = data_source
                return Response(res)
        return Response({"error": "Station not found"}, status=status.HTTP_404_NOT_FOUND)

class ForecastAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        station_id = request.GET.get('station_id', 'DL_ANANDVIHAR')
        ml_base = os.getenv("ML_API_BASE_URL", "http://localhost:8001")
        data_source = "demo"

        forecast_data = None
        try:
            res = requests.get(f"{ml_base}/forecast/citizen?station_id={station_id}", timeout=2.5)
            if res.status_code == 200:
                raw_ml = res.json()
                data_source = "model"
                forecast_data = raw_ml
        except Exception:
            pass

        now_iso = dj_timezone.now().isoformat()

        if forecast_data and "hourly" in forecast_data:
            # Adapt ML output into standard Part C shape
            hourly_adapted = []
            for h in forecast_data.get("hourly", []):
                aqi_val = h.get("aqi", 150)
                band_str = compute_cpcb_band(aqi_val)
                hourly_adapted.append({
                    "time": h.get("time", "1h"),
                    "aqi": aqi_val,
                    "band": band_str,
                    "low": max(0, aqi_val - 25),
                    "high": aqi_val + 35
                })

            peak_aqi = max([x["aqi"] for x in hourly_adapted], default=240)
            return Response({
                "area": "Delhi NCR",
                "generated_at": now_iso,
                "model_version": "v3",
                "data_source": data_source,
                "hourly": hourly_adapted,
                "best_hours": [{"start": "01:00 AM", "end": "04:00 AM"}],
                "summary": {
                    "peak_aqi": peak_aqi,
                    "peak_time": "9:00 PM",
                    "trend": "worsening" if peak_aqi > 250 else "stable"
                },
                "weather": forecast_data.get("weather", "Moderate dispersion index with stable evening inversion.")
            })

        # Fallback demo forecast
        demo_hourly = [
            {"time": "Now", "aqi": 120, "band": "Satisfactory", "low": 100, "high": 135},
            {"time": "7 PM", "aqi": 130, "band": "Satisfactory", "low": 110, "high": 145},
            {"time": "8 PM", "aqi": 145, "band": "Moderate", "low": 125, "high": 165},
            {"time": "9 PM", "aqi": 160, "band": "Moderate", "low": 140, "high": 180},
            {"time": "10 PM", "aqi": 150, "band": "Moderate", "low": 130, "high": 170},
            {"time": "11 PM", "aqi": 135, "band": "Satisfactory", "low": 115, "high": 150},
            {"time": "12 AM", "aqi": 115, "band": "Satisfactory", "low": 95, "high": 130},
            {"time": "1 AM", "aqi": 95, "band": "Good", "low": 80, "high": 110},
            {"time": "2 AM", "aqi": 88, "band": "Good", "low": 75, "high": 105},
            {"time": "3 AM", "aqi": 90, "band": "Good", "low": 78, "high": 108},
            {"time": "4 AM", "aqi": 98, "band": "Good", "low": 85, "high": 115},
            {"time": "5 AM", "aqi": 108, "band": "Satisfactory", "low": 92, "high": 122},
        ]
        return Response({
            "area": "Anand Vihar, Delhi",
            "generated_at": now_iso,
            "model_version": "v1-demo",
            "data_source": "demo",
            "hourly": demo_hourly,
            "best_hours": [{"start": "01:00 AM", "end": "04:00 AM"}],
            "summary": {
                "peak_aqi": 160,
                "peak_time": "9:00 PM",
                "trend": "stable"
            },
            "weather": "Wind speed: 11 km/h. Open-Meteo live index: Moderate dispersion."
        })

class DriveListAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        ward = request.GET.get('ward')
        dtype = request.GET.get('type')

        # Part G: Only return verified drives
        qs = Drive.objects.filter(status='verified')
        if ward:
            qs = qs.filter(ward__icontains=ward)
        if dtype and dtype != 'all':
            qs = qs.filter(type=dtype)

        serializer = DriveSerializer(qs, many=True)
        return Response(serializer.data)

class DriveRsvpAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, drive_id):
        with transaction.atomic():
            drive = get_object_or_404(Drive.objects.select_for_update(), id=drive_id, status='verified')
            if drive.spots_left <= 0:
                return Response({"detail": "This drive has reached full capacity."}, status=status.HTTP_400_BAD_REQUEST)

            rsvp, created = Rsvp.objects.get_or_create(user=request.user, drive=drive)
            if not created:
                # Cancel RSVP
                rsvp.delete()
                return Response({"status": "cancelled", "spots_left": drive.spots_left})

            return Response({"status": "confirmed", "spots_left": drive.spots_left})

class DriveCheckinAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, drive_id):
        code = request.data.get('code', '').strip().upper()
        drive = get_object_or_404(Drive, id=drive_id, status='verified')

        # Check RSVP exists
        if not Rsvp.objects.filter(user=request.user, drive=drive).exists():
            return Response({"detail": "You must RSVP for this drive before checking in."}, status=status.HTTP_400_BAD_REQUEST)

        # Verify code
        if not drive.checkin_code or code != drive.checkin_code.upper():
            return Response({"detail": "Invalid check-in code. Please check with the venue organizer."}, status=status.HTTP_400_BAD_REQUEST)

        checkin, created = Checkin.objects.get_or_create(user=request.user, drive=drive)
        if not created:
            return Response({"detail": "You have already checked in for this event.", "points_awarded": 0})

        profile, _ = CitizenProfile.objects.get_or_create(user=request.user)
        profile.points += checkin.points_awarded
        profile.save()

        return Response({
            "status": "success",
            "message": "Check-in verified!",
            "points_awarded": checkin.points_awarded,
            "total_points": profile.points
        })

class OrganizerInterestAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OrganizerInterestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "status": "pending_review",
                "message": "Your drive listing request has been submitted for verification. It will appear live once approved by an administrator."
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DriveReportAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, drive_id):
        drive = get_object_or_404(Drive, id=drive_id)
        reason = request.data.get('reason', 'General Concern')
        note = request.data.get('note', '')

        reporter = request.user if request.user.is_authenticated else None
        DriveReport.objects.create(drive=drive, reporter=reporter, reason=reason, note=note)
        return Response({"status": "received", "message": "Drive report submitted for review."})

class CitizenReportAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        lat = request.data.get('lat')
        lng = request.data.get('lng')

        try:
            lat = round(float(lat), 3)
            lng = round(float(lng), 3)
        except (TypeError, ValueError):
            return Response({"error": "Valid latitude and longitude required."}, status=status.HTTP_400_BAD_REQUEST)

        # Delhi bounds check: lat 28.40 to 28.88, lng 76.84 to 77.35
        if not (28.40 <= lat <= 28.88 and 76.84 <= lng <= 77.35):
            return Response({"error": "Reports can only be filed within Delhi boundaries."}, status=status.HTTP_400_BAD_REQUEST)

        photo = request.FILES.get('photo')
        cleaned_photo = None
        if photo:
            try:
                # Strip EXIF metadata
                img = Image.open(photo)
                data = list(img.getdata())
                img_no_exif = Image.new(img.mode, img.size)
                img_no_exif.putdata(data)

                buffer = io.BytesIO()
                img_format = img.format or 'JPEG'
                img_no_exif.save(buffer, format=img_format)
                buffer.seek(0)

                cleaned_photo = InMemoryUploadedFile(
                    buffer, 'photo', photo.name, photo.content_type, buffer.getbuffer().nbytes, None
                )
            except Exception as e:
                cleaned_photo = photo # Fallback

        reporter = request.user if request.user.is_authenticated else None
        report = CitizenReport.objects.create(
            reporter=reporter,
            category=request.data.get('category', 'construction_dust'),
            note=request.data.get('note', '')[:500],
            lat=lat,
            lng=lng,
            photo=cleaned_photo,
            status='new'
        )

        return Response({
            "status": "received",
            "report_id": report.id,
            "message": "Report logged successfully and sent to the policymaker dashboard."
        }, status=status.HTTP_201_CREATED)
