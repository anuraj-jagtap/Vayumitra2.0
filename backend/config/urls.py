from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/v1/', include('aqi_data.urls')),
    path('api/v1/weather/', include('weather.urls')),
    path('api/v1/', include('forecasting.urls')),
    path('api/v1/policymaker/', include('policymaker.urls')),
    path('api/citizen/', include('citizen.urls')),
]

