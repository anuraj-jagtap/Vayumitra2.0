from django.urls import path
from .views import TrendsAPIView

urlpatterns = [
    path('trends/', TrendsAPIView.as_view(), name='policymaker-trends'),
]
