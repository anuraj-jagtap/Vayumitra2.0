import json
import os
from datetime import datetime, timezone
from typing import List, Dict, Any
from .base import BaseAQIProvider, compute_cpcb_band

class DemoAQIProvider(BaseAQIProvider):
    def __init__(self, mocks_path: str = None):
        if mocks_path is None:
            # Walk up to root /mocks/stations.json
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            self.mocks_path = os.path.join(base_dir, "mocks", "stations.json")
        else:
            self.mocks_path = mocks_path

    def fetch_stations(self) -> List[Dict[str, Any]]:
        stations = []
        if os.path.exists(self.mocks_path):
            try:
                with open(self.mocks_path, "r", encoding="utf-8") as f:
                    raw_data = json.load(f)
                    for item in raw_data:
                        aqi = item.get("aqi", 150)
                        band = item.get("band") or compute_cpcb_band(aqi)
                        stations.append({
                            "station_id": item.get("station_id", f"DL_{item.get('name', 'UNKNOWN')}"),
                            "name": item.get("name", "Unknown Station"),
                            "lat": float(item.get("lat", 28.6139)),
                            "lng": float(item.get("lng", 77.2090)),
                            "aqi": int(aqi),
                            "band": band,
                            "pm2_5": item.get("pm2_5", 85.0),
                            "pm10": item.get("pm10", 160.0),
                            "no2": item.get("no2", 42.0),
                            "main_pollutant": item.get("main_pollutant", "PM2.5"),
                            "updated_at": item.get("updated_at", datetime.now(timezone.utc).isoformat())
                        })
                return stations
            except Exception as e:
                print(f"Error reading mocks/stations.json: {e}")

        # Fallback default Delhi stations if mocks missing
        default_delhi = [
            {"station_id": "DL_ANANDVIHAR", "name": "Anand Vihar", "lat": 28.6469, "lng": 77.3152, "aqi": 312, "pm2_5": 187, "pm10": 290, "no2": 55, "main_pollutant": "PM2.5"},
            {"station_id": "DL_ITO", "name": "ITO", "lat": 28.6286, "lng": 77.2410, "aqi": 215, "pm2_5": 110, "pm10": 220, "no2": 48, "main_pollutant": "PM2.5"},
            {"station_id": "DL_PUNJABIBAGH", "name": "Punjabi Bagh", "lat": 28.6738, "lng": 77.1306, "aqi": 320, "pm2_5": 195, "pm10": 305, "no2": 62, "main_pollutant": "PM2.5"},
            {"station_id": "DL_RKPURAM", "name": "R.K. Puram", "lat": 28.5633, "lng": 77.1864, "aqi": 180, "pm2_5": 78, "pm10": 170, "no2": 39, "main_pollutant": "PM2.5"},
            {"station_id": "DL_MANDIRMARG", "name": "Mandir Marg", "lat": 28.6360, "lng": 77.1993, "aqi": 165, "pm2_5": 72, "pm10": 150, "no2": 35, "main_pollutant": "PM2.5"}
        ]
        now_iso = datetime.now(timezone.utc).isoformat()
        for d in default_delhi:
            stations.append({
                **d,
                "band": compute_cpcb_band(d["aqi"]),
                "updated_at": now_iso
            })
        return stations
