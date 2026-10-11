"""
End-to-End Forecast Generation Pipeline Runner
───────────────────────────────────────────────
Coordinates data ingestion, feature generation, model inference,
AQI sub-index calculation, and database persistence.
"""

import os, sys, time
from datetime import datetime, timedelta, timezone
import numpy as np
import pandas as pd

# Path setup to import local modules and aqi_forecast
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

MODEL_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
if MODEL_DIR not in sys.path:
    sys.path.insert(0, MODEL_DIR)

import aqi_forecast as A
from cpcb_calculator import compute_aqi
from model_loader import get_model_registry
from data_fetcher import fetch_live_weather, fetch_recent_pollutants
import db_writer


def run_forecast_cycle(write_to_db=True, dry_run=False):
    """Execute complete forecast generation cycle across all stations."""
    print("=" * 70)
    print("  STARTING AQI FORECAST GENERATION CYCLE (V3 ENGINE)")
    print("=" * 70)
    t0 = time.time()

    # 1. Load Model Registry
    registry = get_model_registry()

    # 2. Ingest Weather & Observations
    print("\n[1/4] Ingesting live weather & pollutant observations...")
    weather = fetch_live_weather(days=7)
    if weather is not None:
        print(f"  Live weather loaded: {len(weather)} hourly points ({weather.datetime.min()} to {weather.datetime.max()})")
    else:
        print("  Warning: Proceeding with historical weather fallback.")

    raw = fetch_recent_pollutants(hours=96)
    print(f"  Observations loaded: {len(raw):,} rows across {raw.station.nunique()} stations")
    origin_ts = raw["datetime"].max()
    print(f"  Forecast Origin Timestamp: {origin_ts}")

    # 3. Prepare Feature Pipeline
    print("\n[2/4] Engineering multi-pollutant & meteorological features...")
    meta = pd.DataFrame({"lat": np.nan, "lon": np.nan}, index=raw.station.unique())
    stations = A.prepare(raw, meta, weather=weather)
    print(f"  Prepared {len(stations)} stations with engineered feature matrices.")

    # 4. Generate Predictions
    print("\n[3/4] Running V3 point & interval prediction models...")
    hourly_rows = []
    daily_rows = []

    hourly_leads = registry.get_available_leads("hourly") or [1, 2, 3, 4, 6, 8, 12, 16, 20, 24]
    daily_leads = registry.get_available_leads("daily") or [1, 2, 3, 4, 5, 6, 7]

    for sid, st_data in stations.items():
        h_df = st_data["hourly"].sort_values("datetime").reset_index(drop=True)
        d_df = st_data["daily"].sort_values("datetime").reset_index(drop=True)

        if len(h_df) == 0: continue

        # --- A. Hourly Forecasts (1-24h) ---
        for lead in hourly_leads:
            fcols = list(st_data["h_feats"])
            # Add future weather columns if available
            df_work = h_df.copy()
            for wc in A.WEATHER_COLS:
                if wc in df_work.columns:
                    col_lead = f"{wc}_hlead{lead}"
                    df_work[col_lead] = df_work[wc].shift(-lead).astype(np.float32)
                    fcols.append(col_lead)

            # Latest row contains features for predicting origin_ts + lead
            latest_row = df_work.iloc[-1:]
            
            # Predict PM2.5 & PM10
            try:
                m_pm25 = registry.get_model("hourly", "PM2.5", lead)
                m_pm10 = registry.get_model("hourly", "PM10", lead)
                if m_pm25 is None or m_pm10 is None: continue

                # Align X with model's expected feature set
                X = latest_row[fcols].bfill().fillna(0.0).values.astype(np.float32)
                pred_pm25 = float(m_pm25.predict(X)[0])
                pred_pm10 = float(m_pm10.predict(X)[0])

                # Physical consistency: PM10 >= PM2.5
                pred_pm10 = max(pred_pm10, pred_pm25)

                target_ts = origin_ts + timedelta(hours=int(lead))
                aqi_val, dominant, cat_id, _ = compute_aqi(pm25=pred_pm25, pm10=pred_pm10)

                # Format tuple for DB
                hourly_rows.append((
                    None,  # placeholder for run_id
                    sid,
                    int(lead),
                    target_ts,
                    round(pred_pm25, 2),
                    round(pred_pm10, 2),
                    None, None, None, None, # no2, so2, co, o3
                    aqi_val,
                    dominant,
                    cat_id
                ))
            except Exception as e:
                pass

        # --- B. Daily Forecasts (1-7d) ---
        for lead in daily_leads:
            fcols = list(st_data["d_feats"])
            df_dwork = d_df.copy()
            for wc in A.WEATHER_COLS:
                if wc in df_dwork.columns:
                    col_lead = f"{wc}_dlead{lead}"
                    df_dwork[col_lead] = df_dwork[wc].shift(-lead).astype(np.float32)
                    fcols.append(col_lead)

            if len(df_dwork) == 0: continue
            latest_drow = df_dwork.iloc[-1:]

            try:
                m_pm25 = registry.get_model("daily", "PM2.5", lead)
                m_pm10 = registry.get_model("daily", "PM10", lead)
                if m_pm25 is None or m_pm10 is None: continue

                X = latest_drow[fcols].bfill().fillna(0.0).values.astype(np.float32)
                pred_pm25 = float(m_pm25.predict(X)[0])
                pred_pm10 = float(m_pm10.predict(X)[0])
                pred_pm10 = max(pred_pm10, pred_pm25)

                target_date = (origin_ts + timedelta(days=int(lead))).date()
                w_start = datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0, tzinfo=timezone.utc)
                w_end = datetime(target_date.year, target_date.month, target_date.day, 23, 59, 59, tzinfo=timezone.utc)

                aqi_val, dominant, cat_id, _ = compute_aqi(pm25=pred_pm25, pm10=pred_pm10)

                daily_rows.append((
                    None,  # run_id placeholder
                    sid,
                    int(lead),
                    w_start,
                    w_end,
                    round(pred_pm25, 2),
                    round(pred_pm10, 2),
                    None, None, None, None,
                    aqi_val,
                    dominant,
                    cat_id
                ))
            except Exception as e:
                pass

    print(f"  Generated {len(hourly_rows):,} hourly predictions and {len(daily_rows):,} daily predictions.")

    # 5. Persist to PostgreSQL Database
    print("\n[4/4] Writing forecasts to PostgreSQL database...")
    if write_to_db and not dry_run:
        try:
            conn = db_writer.get_connection()
            model_id = db_writer.ensure_model_version(conn, model_name="V3 Multi-Pollutant Engine")
            run_id = db_writer.create_forecast_run(conn, model_id, origin_ts=origin_ts)
            print(f"  Created forecast run ID: {run_id}")

            # Inject run_id into rows
            h_payload = [(run_id, *r[1:]) for r in hourly_rows]
            d_payload = [(run_id, *r[1:]) for r in daily_rows]

            n_h = db_writer.save_hourly_forecasts(conn, run_id, h_payload)
            n_d = db_writer.save_daily_forecasts(conn, run_id, d_payload)
            db_writer.mark_run_status(conn, run_id, status="ok")
            db_writer.log_ingest(conn, job="ml_v3_forecast_pipeline", status="ok", rows_written=(n_h + n_d))
            conn.close()
            print(f"  Successfully committed {n_h:,} hourly and {n_d:,} daily rows to DB!")
        except Exception as e:
            print(f"  Database connection/write note: {e}")
            print("  (If PostgreSQL is not running locally, forecasts are ready in memory.)")
    else:
        print("  Dry run mode: skipped DB write.")

    elapsed = time.time() - t0
    print(f"\nCycle complete in {elapsed:.1f}s.")
    return {
        "origin_ts": origin_ts,
        "n_hourly": len(hourly_rows),
        "n_daily": len(daily_rows),
        "sample_hourly": hourly_rows[:3] if hourly_rows else [],
    }


if __name__ == "__main__":
    dry = "--dry-run" in sys.argv
    run_forecast_cycle(write_to_db=True, dry_run=dry)
