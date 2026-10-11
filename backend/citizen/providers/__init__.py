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
    provider_name = os.getenv("AQI_PROVIDER", "demo").lower()
    api_key = os.getenv("AQI_API_KEY", "")

    if provider_name == "aqicn" and api_key:
        return AQICNProvider(api_key), "live"
    elif provider_name == "cpcb" and api_key:
        return CPCBDataProvider(api_key), "live"
    elif provider_name == "openaq" and api_key:
        return OpenAQProvider(api_key), "live"
    else:
        return DemoAQIProvider(), "demo"

def get_normalized_stations() -> Tuple[List[Dict[str, Any]], str]:
    global _CACHE_STATIONS, _CACHE_TIMESTAMP, _CACHE_DATA_SOURCE

    cache_seconds = int(os.getenv("AQI_CACHE_SECONDS", "600"))
    now = time.time()

    if _CACHE_STATIONS and (now - _CACHE_TIMESTAMP < cache_seconds):
        return _CACHE_STATIONS, _CACHE_DATA_SOURCE

    provider, source_type = get_provider()
    try:
        stations = provider.fetch_stations()
        if not stations and source_type != "demo":
            # Fall back to demo provider if live response was empty
            stations = DemoAQIProvider().fetch_stations()
            source_type = "demo"
    except Exception as e:
        print(f"Warning: AQI provider failed ({e}), falling back to demo data.")
        stations = DemoAQIProvider().fetch_stations()
        source_type = "demo"

    # Always ensure CPCB band is verified
    for s in stations:
        s["band"] = compute_cpcb_band(s.get("aqi"))
        s["data_source"] = source_type

    _CACHE_STATIONS = stations
    _CACHE_TIMESTAMP = now
    _CACHE_DATA_SOURCE = source_type

    return _CACHE_STATIONS, _CACHE_DATA_SOURCE
