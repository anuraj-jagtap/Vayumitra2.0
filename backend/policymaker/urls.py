from django.urls import path
from .views import TrendsAPIView
from .traffic_views import LiveTrafficAPIView

urlpatterns = [
    path('trends/', TrendsAPIView.as_view(), name='policymaker-trends'),
    path('traffic/', LiveTrafficAPIView.as_view(), name='policymaker-traffic'),
]

