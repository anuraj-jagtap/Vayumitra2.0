from django.urls import path
from .views import HourlyForecastListAPIView, DailyForecastListAPIView

urlpatterns = [
    path('forecasts/hourly/', HourlyForecastListAPIView.as_view(), name='forecast-hourly-list'),
    path('forecasts/daily/', DailyForecastListAPIView.as_view(), name='forecast-daily-list'),
]
