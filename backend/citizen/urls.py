from django.urls import path
from .views import (
    NearestStationAPIView,
    StationListAPIView,
    StationDetailAPIView,
    ForecastAPIView,
    DriveListAPIView,
    DriveRsvpAPIView,
    DriveCheckinAPIView,
    OrganizerInterestAPIView,
    DriveReportAPIView,
    CitizenReportAPIView
)

urlpatterns = [
    # Station & Live feed endpoints
    path('nearest-station', NearestStationAPIView.as_view(), name='nearest-station'),
    path('stations', StationListAPIView.as_view(), name='stations-list'),
    path('stations/<str:station_id>', StationDetailAPIView.as_view(), name='station-detail'),
    
    # Forecast endpoint (ML integration adapter)
    path('forecast', ForecastAPIView.as_view(), name='citizen-forecast'),

    # Drives endpoints
    path('drives', DriveListAPIView.as_view(), name='drives-list'),
    path('drives/<int:drive_id>/rsvp', DriveRsvpAPIView.as_view(), name='drive-rsvp'),
    path('drives/<int:drive_id>/checkin', DriveCheckinAPIView.as_view(), name='drive-checkin'),
    path('drives/<int:drive_id>/report', DriveReportAPIView.as_view(), name='drive-report'),
    path('organizer-interest', OrganizerInterestAPIView.as_view(), name='organizer-interest'),

    # Pollution reporting
    path('reports', CitizenReportAPIView.as_view(), name='citizen-reports'),
]
