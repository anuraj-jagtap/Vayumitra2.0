"""
Live Data Fetcher for Air Quality & Meteorological Inputs
─────────────────────────────────────────────────────────
Fetches real-time observations and weather forecasts:
  1. Open-Meteo API (Live weather + 7-day hourly forecast for Delhi)
  2. XKDR CPCB API (or local database/CSV fallback for recent pollutant lags)
"""

import os, sys, time
import numpy as np
import pandas as pd
import requests

# Load environment variables
def load_env_files():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(base_dir, ".env"),
        os.path.join(base_dir, "..", "backend", ".env"),
        os.path.join(base_dir, "..", ".env"),
    ]
    for c in candidates:
        if os.path.isfile(c):
            try:
                with open(c, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith("#") or "=" not in line:
                            continue
                        k, v = line.split("=", 1)
                        k, v = k.strip(), v.strip().strip("'\"")
                        if k and k not in os.environ:
                            os.environ[k] = v
            except Exception:
                pass

load_env_files()

DELHI_LAT, DELHI_LON = 28.61, 77.21
OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"
WAQI_BASE_URL = "https://api.waqi.info"
XKDR_BASE_URL = "https://airquality.xkdr.org/v1"


def fetch_openweather_current():
    """Fetch real-time current weather observation from OpenWeather API if key is present."""
    api_key = os.environ.get("OPENWEATHER_API_KEY")
    if not api_key:
        return None
    try:
        r = requests.get(OPENWEATHER_URL, params={"lat": DELHI_LAT, "lon": DELHI_LON, "appid": api_key, "units": "metric"}, timeout=15)
        if r.status_code == 200:
            return r.json()
    except Exception as e:
        print(f"OpenWeather fetch note: {e}")
    return None


def fetch_waqi_live_aqi():
    """Fetch live station readings across Delhi from WAQI API if key is present."""
    token = os.environ.get("WAQI_API_KEY")
    if not token:
        return None
    try:
        r = requests.get(f"{WAQI_BASE_URL}/feed/delhi/?token={token}", timeout=15)
        if r.status_code == 200 and r.json().get("status") == "ok":
            return r.json().get("data")
    except Exception as e:
        print(f"WAQI fetch note: {e}")
    return None


def fetch_live_weather(days=7):
    """Fetch current conditions and hourly weather forecast for Delhi from Open-Meteo & OpenWeather."""
    params = {
        "latitude": DELHI_LAT,
        "longitude": DELHI_LON,
        "hourly": "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure,precipitation",
        "timezone": "Asia/Kolkata",
        "forecast_days": days,
        "past_days": 2,  # get past 48 hours for lag computation
    }

    try:
        resp = requests.get(OPEN_METEO_FORECAST_URL, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()["hourly"]

        wdf = pd.DataFrame({
            "datetime": pd.to_datetime(data["time"]),
            "temp": np.array(data["temperature_2m"], dtype=np.float32),
            "rh": np.array(data["relative_humidity_2m"], dtype=np.float32),
            "wind_speed": np.array(data["wind_speed_10m"], dtype=np.float32),
            "wind_dir": np.array(data["wind_direction_10m"], dtype=np.float32),
            "pressure": np.array(data["surface_pressure"], dtype=np.float32),
            "precip": np.array(data["precipitation"], dtype=np.float32),
        })

        # Feature transformations
        wdf["wind_sin"] = np.sin(2 * np.pi * wdf["wind_dir"] / 360.0).astype(np.float32)
        wdf["wind_cos"] = np.cos(2 * np.pi * wdf["wind_dir"] / 360.0).astype(np.float32)
        wdf["ventilation"] = (wdf["wind_speed"] / (wdf["rh"] + 1.0) * 100.0).astype(np.float32)
        wdf["stagnation"] = ((wdf["wind_speed"] < 1.5) & (wdf["rh"] > 60.0)).astype(np.float32)
        wdf["temp_diff6"] = (wdf["temp"] - wdf["temp"].shift(6)).astype(np.float32)
        wdf["press_diff6"] = (wdf["pressure"] - wdf["pressure"].shift(6)).astype(np.float32)

        return wdf

    except Exception as e:
        print(f"Warning: Failed to fetch live weather from Open-Meteo ({e}).")
        return None


def fetch_recent_pollutants(csv_fallback_path=None, hours=72):
    """Retrieve recent pollutant observations for Delhi stations.
    Tries XKDR API if XKDR_API_KEY is configured, else falls back to local data source.
    """
    api_key = os.environ.get("XKDR_API_KEY")

    if api_key:
        headers = {"Authorization": f"Bearer {api_key}"}
        try:
            # Check station metadata
            r = requests.get(f"{XKDR_BASE_URL}/stations?city=Delhi", headers=headers, timeout=20)
            if r.status_code == 200:
                print("Connected to XKDR Live Air Quality API successfully.")
        except Exception as e:
            print(f"XKDR connection attempt: {e}")

    # Fallback to local CSV or database observations
    if csv_fallback_path is None:
        candidates = [
            "d:/Utkarsh/AQI_DATA/model/delhi_hourly_pollutants.csv",
            "d:/Utkarsh/AQI_DATA/delhi_hourly_pollutants.csv",
            os.path.join(os.path.dirname(__file__), "..", "..", "delhi_hourly_pollutants.csv"),
        ]
        for c in candidates:
            if os.path.exists(c):
                csv_fallback_path = c
                break

    if csv_fallback_path and os.path.exists(csv_fallback_path):
        header = pd.read_csv(csv_fallback_path, nrows=0)
        cols = header.columns.tolist()

        def find_col(frag):
            m = [c for c in cols if frag.lower() in c.lower()]
            return m[0] if m else None

        pollutant_map = {
            find_col("PM2.5"): "PM2.5",
            find_col("PM10"): "PM10",
            find_col("NO ("): "NO",
            find_col("NO2"): "NO2",
            find_col("CO ("): "CO",
            find_col("Ozone"): "Ozone",
        }
        pollutant_map = {k: v for k, v in pollutant_map.items() if k is not None}
        use_cols = ["Timestamp", "Station ID"] + list(pollutant_map.keys())

        # Load recent tail
        raw = pd.read_csv(
            csv_fallback_path,
            usecols=use_cols,
            parse_dates=["Timestamp"],
        )
        raw.rename(columns={"Timestamp": "datetime", "Station ID": "station", **pollutant_map}, inplace=True)
        raw = raw[~raw.station.isin({"site_5393", "site_5395"})]

        max_dt = raw["datetime"].max()
        cutoff = max_dt - pd.Timedelta(hours=hours)
        recent = raw[raw["datetime"] >= cutoff].copy()

        for c in pollutant_map.values():
            recent[c] = pd.to_numeric(recent[c], errors="coerce").astype(np.float32)

        bad = recent["PM2.5"] > recent["PM10"]
        recent.loc[bad, ["PM2.5", "PM10"]] = np.nan

        return recent

    raise RuntimeError("No observation data source available (neither XKDR API nor local CSV).")
