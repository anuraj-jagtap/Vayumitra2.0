import os
import time
from typing import List, Dict, Any, Tuple
from .base import BaseAQIProvider, compute_cpcb_band
from .demo import DemoAQIProvider
from .aqicn import AQICNProvider
from .stubs import CPCBDataProvider, OpenAQProvider

_CACHE_STATIONS: List[Dict[str, Any]] = []
_CACHE_TIMESTAMP: float = 0
_CACHE_DATA_SOURCE: str = "demo"

def get_provider() -> Tuple[BaseAQIProvider, str]:
    api_key = os.getenv("AQI_API_KEY") or os.getenv("WAQI_API_KEY", "")
    provider_name = os.getenv("AQI_PROVIDER", "aqicn" if api_key else "demo").lower()

    if provider_name in ("aqicn", "waqi") and api_key:
        return AQICNProvider(api_key), "live"
    elif provider_name == "cpcb" and api_key:
        return CPCBDataProvider(api_key), "live"
    elif provider_name == "openaq" and api_key:
        return OpenAQProvider(api_key), "live"
    else:
        return DemoAQIProvider(), "demo"

def get_normalized_stations() -> Tuple[List[Dict[str, Any]], str]:
    global _CACHE_STATIONS, _CACHE_TIMESTAMP, _CACHE_DATA_SOURCE

    # Default cache frequency: 900 seconds (15 minutes) or 3600 (hourly)
    cache_seconds = int(os.getenv("AQI_CACHE_SECONDS", "900"))
    now = time.time()

    if _CACHE_STATIONS and (now - _CACHE_TIMESTAMP < cache_seconds):
        return _CACHE_STATIONS, _CACHE_DATA_SOURCE

    provider, source_type = get_provider()
    try:
        stations = provider.fetch_stations()
        if stations:
            for s in stations:
                s["band"] = compute_cpcb_band(s.get("aqi"))
                s["data_source"] = source_type

            _CACHE_STATIONS = stations
            _CACHE_TIMESTAMP = now
            _CACHE_DATA_SOURCE = source_type
            return _CACHE_STATIONS, _CACHE_DATA_SOURCE
        else:
            # Empty response: keep last known cached stations if available
            if _CACHE_STATIONS:
                print("Notice: AQI provider returned empty station list; keeping last known cached stations.")
                return _CACHE_STATIONS, _CACHE_DATA_SOURCE
            stations = DemoAQIProvider().fetch_stations()
            source_type = "demo"
    except Exception as e:
        print(f"Warning: AQI provider failed ({e}); checking fallback.")
        # Network/API failure: keep last known good cached stations if available
        if _CACHE_STATIONS:
            print("Notice: Keeping existing valid station cache during provider outage.")
            return _CACHE_STATIONS, _CACHE_DATA_SOURCE
        stations = DemoAQIProvider().fetch_stations()
        source_type = "demo"

    for s in stations:
        s["band"] = compute_cpcb_band(s.get("aqi"))
        s["data_source"] = source_type

    _CACHE_STATIONS = stations
    _CACHE_TIMESTAMP = now
    _CACHE_DATA_SOURCE = source_type

    return _CACHE_STATIONS, _CACHE_DATA_SOURCE
