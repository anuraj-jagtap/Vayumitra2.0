import os
import requests
from typing import List, Dict, Any
from .base import BaseAQIProvider

class CPCBDataProvider(BaseAQIProvider):
    """
    CPCB Real-time CAAQMS data via data.gov.in resource API.
    Stub implementation ready for API key activation.
    """
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("AQI_API_KEY", "")
        self.resource_id = "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69"

    def fetch_stations(self) -> List[Dict[str, Any]]:
        if not self.api_key:
            raise ValueError("AQI_API_KEY is required for CPCB data.gov.in provider")
        # Placeholder endpoint
        url = f"https://api.data.gov.in/resource/{self.resource_id}?api-key={self.api_key}&format=json&filters[city]=Delhi"
        res = requests.get(url, timeout=5)
        res.raise_for_status()
        # Stub response parsing
        return []

class OpenAQProvider(BaseAQIProvider):
    """
    OpenAQ v3 API adapter for Delhi sensor nodes.
    """
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("AQI_API_KEY", "")

    def fetch_stations(self) -> List[Dict[str, Any]]:
        if not self.api_key:
            raise ValueError("AQI_API_KEY is required for OpenAQ v3 provider")
        headers = {"X-API-Key": self.api_key}
        url = "https://api.openaq.org/v3/locations?bbox=76.84,28.40,77.35,28.88"
        res = requests.get(url, headers=headers, timeout=5)
        res.raise_for_status()
        return []
