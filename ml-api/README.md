# Vayumitra 2.0 — ML Forecasting Engine (`ml-api`)

This module connects the high-accuracy V3 Machine Learning forecasting engine (`aqi_models_v3.joblib`) with the Vayumitra 2.0 backend database and frontend dashboards.

---

## 1. Architecture & Component Roles

* **`model_loader.py`**: Loads `aqi_models_v3.joblib` (34 point models + 68 confidence band models).
* **`cpcb_calculator.py`**: Official Central Pollution Control Board (CPCB) India sub-index formula for overall AQI, dominant pollutant, and severity categories.
* **`data_fetcher.py`**: Fetches live weather forecasts from Open-Meteo (28.61°N, 77.21°E) and recent pollutant observations from XKDR CPCB API.
* **`db_writer.py`**: Direct bulk-insert pipeline into PostgreSQL tables (`forecast_runs`, `forecasts_hourly`, `forecasts_daily`, `ingest_log`).
* **`pipeline_runner.py`**: End-to-end batch execution script.
* **`api.py`**: FastAPI microservice for on-demand inference and citizen dashboard integration.

---

## 2. Quickstart

### Run Ingestion & Forecast Cycle via CLI:
```bash
python pipeline_runner.py
```
*(Add `--dry-run` to test feature generation and predictions without writing to PostgreSQL).*

### Start the ML Microservice:
```bash
uvicorn api:app --host 0.0.0.0 --port 8001 --reload
```

---

## 3. Database Schema Output Mapping

| Model Output | Destination Table | Output Field |
| :--- | :--- | :--- |
| Hourly PM2.5 & PM10 (1–24h) | `forecasts_hourly` | `pm25`, `pm10`, `aqi`, `dominant`, `cat` |
| Daily PM2.5 & PM10 (1–7d) | `forecasts_daily` | `pm25`, `pm10`, `aqi`, `dominant`, `cat` |
| Forecast Run Metadata | `forecast_runs` | `run_id`, `model_id`, `origin_ts`, `status` |
| Pipeline Ingestion Log | `ingest_log` | `job`, `status`, `rows_written`, `detail` |

Once populated, Django views `v_latest_hourly` and `v_latest_daily` instantly serve these forecasts to the Policymaker and Citizen dashboards via `/api/v1/forecasts/hourly/` and `/api/v1/forecasts/daily/`.
