from django.urls import path
from .views import StationListAPIView, CurrentAQIListAPIView

urlpatterns = [
    path('stations/', StationListAPIView.as_view(), name='station-list'),
    path('aqi/current/', CurrentAQIListAPIView.as_view(), name='current-aqi-list'),
]
