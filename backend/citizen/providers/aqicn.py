import os
import requests
from datetime import datetime, timezone
from typing import List, Dict, Any
from .base import BaseAQIProvider, compute_cpcb_band

class AQICNProvider(BaseAQIProvider):
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("AQI_API_KEY", "")
        self.base_url = "https://api.waqi.info"

    def fetch_stations(self) -> List[Dict[str, Any]]:
        if not self.api_key:
            raise ValueError("AQI_API_KEY is missing for AQICNProvider")

        # Query Delhi bounding box: lat 28.40,76.84 to 28.88,77.35
        url = f"{self.base_url}/map/bounds/?latlng=28.40,76.84,28.88,77.35&token={self.api_key}"
        res = requests.get(url, timeout=5)
        res.raise_for_status()
        data = res.json()

        if data.get("status") != "ok":
            raise RuntimeError(f"WAQI API error: {data.get('data')}")

        stations = []
        now_iso = datetime.now(timezone.utc).isoformat()

        for item in data.get("data", []):
            try:
                aqi_val = int(item.get("aqi"))
            except (ValueError, TypeError):
                continue

            station_name = item.get("station", {}).get("name", "Delhi Station")
            station_id = f"DL_{item.get('uid', 'MON')}"

            stations.append({
                "station_id": station_id,
                "name": station_name,
                "lat": float(item.get("lat")),
                "lng": float(item.get("lon")),
                "aqi": aqi_val,
                "band": compute_cpcb_band(aqi_val),
                "pm2_5": float(aqi_val) * 0.65, # Derived approximation if sub-pollutant not broken out in bounds call
                "pm10": float(aqi_val) * 0.95,
                "no2": None,
                "main_pollutant": "PM2.5",
                "updated_at": item.get("station", {}).get("time", now_iso)
            })

        return stations
