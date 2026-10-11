from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

def compute_cpcb_band(aqi: Optional[int]) -> str:
    if aqi is None:
        return "Unknown"
    if aqi <= 50:
        return "Good"
    elif aqi <= 100:
        return "Satisfactory"
    elif aqi <= 200:
        return "Moderate"
    elif aqi <= 300:
        return "Poor"
    elif aqi <= 400:
        return "Very Poor"
    else:
        return "Severe"

class BaseAQIProvider(ABC):
    @abstractmethod
    def fetch_stations(self) -> List[Dict[str, Any]]:
        """
        Fetches live AQI stations and normalizes them into standard schema:
        {
          "station_id": str,
          "name": str,
          "lat": float,
          "lng": float,
          "aqi": int,
          "band": str,
          "pm2_5": float or None,
          "pm10": float or None,
          "no2": float or None,
          "main_pollutant": str,
          "updated_at": str (ISO 8601)
        }
        """
        pass
