"""
PostgreSQL Database Writer for Forecasts & Ingestion Tracking
─────────────────────────────────────────────────────────────
Directly writes predicted hourly and daily forecasts into PostgreSQL
tables (`forecast_runs`, `forecasts_hourly`, `forecasts_daily`, `ingest_log`)
matching the team's Django backend schema.
"""

import os, sys
from datetime import datetime, timezone

def load_env_files():
    """Load key-value pairs from .env files into os.environ if not already set."""
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


def get_db_config():
    """Return database connection parameters from environment or defaults."""
    return {
        "dbname": os.environ.get("DB_NAME", "vayumitra"),
        "user": os.environ.get("DB_USER", "postgres"),
        "password": os.environ.get("DB_PASSWORD", ""),
        "host": os.environ.get("DB_HOST", "localhost"),
        "port": os.environ.get("DB_PORT", "5432"),
    }


def get_connection():
    """Establish and return a psycopg2 connection to PostgreSQL."""
    try:
        import psycopg2
        cfg = get_db_config()
        return psycopg2.connect(**cfg)
    except ImportError:
        raise ImportError("psycopg2 is required for database persistence. Install with: pip install psycopg2-binary")


def ensure_model_version(conn, model_name="V3 Multi-Pollutant Engine", artifact_uri="aqi_models_v3.joblib"):
    """Ensure an active model_version record exists, returning model_id."""
    with conn.cursor() as cur:
        cur.execute("SELECT model_id FROM model_versions WHERE is_active = TRUE LIMIT 1;")
        row = cur.fetchone()
        if row:
            return row[0]

        # Insert new active model version
        cur.execute("""
            INSERT INTO model_versions (name, artifact_uri, is_active, trained_at)
            VALUES (%s, %s, TRUE, NOW())
            RETURNING model_id;
        """, (model_name, artifact_uri))
        model_id = cur.fetchone()[0]
        conn.commit()
        return model_id


def create_forecast_run(conn, model_id, origin_ts=None):
    """Create a new run entry in forecast_runs with status='running'."""
    origin_ts = origin_ts or datetime.now(timezone.utc)
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO forecast_runs (model_id, origin_ts, created_at, status)
            VALUES (%s, %s, NOW(), 'running')
            RETURNING run_id;
        """, (model_id, origin_ts))
        run_id = cur.fetchone()[0]
        conn.commit()
        return run_id


def save_hourly_forecasts(conn, run_id, rows):
    """Bulk insert hourly forecasts into forecasts_hourly.
    rows: list of tuples:
      (run_id, station_id, lead_h, target_ts, pm25, pm10, no2, so2, co, o3, aqi, dominant, cat)
    """
    if not rows: return 0
    from psycopg2.extras import execute_values
    query = """
        INSERT INTO forecasts_hourly (
            run_id, station_id, lead_h, target_ts,
            pm25, pm10, no2, so2, co, o3,
            aqi, dominant, cat
        ) VALUES %s
        ON CONFLICT (run_id, station_id, lead_h) DO UPDATE
        SET pm25 = EXCLUDED.pm25,
            pm10 = EXCLUDED.pm10,
            aqi  = EXCLUDED.aqi,
            dominant = EXCLUDED.dominant,
            cat = EXCLUDED.cat;
    """
    with conn.cursor() as cur:
        execute_values(cur, query, rows)
        conn.commit()
    return len(rows)


def save_daily_forecasts(conn, run_id, rows):
    """Bulk insert daily forecasts into forecasts_daily.
    rows: list of tuples:
      (run_id, station_id, lead_day, window_start, window_end, pm25, pm10, no2, so2, co, o3, aqi, dominant, cat)
    """
    if not rows: return 0
    from psycopg2.extras import execute_values
    query = """
        INSERT INTO forecasts_daily (
            run_id, station_id, lead_day, window_start, window_end,
            pm25, pm10, no2, so2, co, o3,
            aqi, dominant, cat
        ) VALUES %s
        ON CONFLICT (run_id, station_id, lead_day) DO UPDATE
        SET pm25 = EXCLUDED.pm25,
            pm10 = EXCLUDED.pm10,
            aqi  = EXCLUDED.aqi,
            dominant = EXCLUDED.dominant,
            cat = EXCLUDED.cat;
    """
    with conn.cursor() as cur:
        execute_values(cur, query, rows)
        conn.commit()
    return len(rows)


def mark_run_status(conn, run_id, status="ok", error=None):
    """Finalize run status in forecast_runs."""
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE forecast_runs
            SET status = %s, error = %s
            WHERE run_id = %s;
        """, (status, error, run_id))
        conn.commit()


def log_ingest(conn, job="ml_forecast_pipeline", status="ok", rows_written=0, detail=""):
    """Record execution details into ingest_log."""
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO ingest_log (job, started_at, finished_at, status, rows_written, detail)
                VALUES (%s, NOW(), NOW(), %s, %s, %s);
            """, (job, status, rows_written, detail))
            conn.commit()
    except Exception as e:
        print(f"IngestLog warning: {e}")
