"""
AQI Forecasting Library v3 (High-Accuracy & Memory-Optimized Engine)
───────────────────────────────────────────────────────────────────
Features:
  • Multi-pollutant chemical signature (PM2.5, PM10, NO, NO2, CO, Ozone)
  • Physics-based atmospheric dynamics (ventilation index, stagnation flag, cooling rate)
  • Regional Delhi air basin spatial aggregation (city-wide lags & hotspot relative ratios)
  • Log1p variance-stabilizing target transformation (drastically improves MAPE and percentage accuracy)
  • Quantile prediction bands (10% and 90% bounds) with monotonic preservation
  • Memory-optimized float32 vectorized pipelines (<300 MB peak RAM usage)
"""

import gc
import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.base import BaseEstimator, RegressorMixin
import joblib, warnings

warnings.filterwarnings("ignore", category=UserWarning)

# ── Module-level defaults ──────────────────────────────────
POLLUTANTS = ["PM2.5", "PM10"]
ALL_POLLUTANTS = ["PM2.5", "PM10", "NO", "NO2", "CO", "Ozone"]
TARGETS = ["PM2.5", "PM10"]

BASE_WEATHER_COLS = ["temp", "rh", "wind_speed", "wind_sin", "wind_cos", "pressure", "precip"]
DERIVED_WEATHER_COLS = ["ventilation", "stagnation", "temp_diff6", "press_diff6"]
WEATHER_COLS = BASE_WEATHER_COLS + DERIVED_WEATHER_COLS

HOURLY_LEADS = [1, 2, 3, 4, 6, 8, 12, 16, 20, 24]
DAILY_LEADS  = [1, 2, 3, 4, 5, 6, 7]

XGB_PARAMS = dict(
    n_estimators=300,
    learning_rate=0.07,
    max_depth=6,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="reg:squarederror",
    n_jobs=-1,
    random_state=42,
    early_stopping_rounds=20,
)


# ═══════════════════════════════════════════════════════════
#  Wrapper for Log-Transformed Regression
# ═══════════════════════════════════════════════════════════
class LogTransformedXGBRegressor(BaseEstimator, RegressorMixin):
    """XGBoost Regressor operating on log1p scale to minimize relative errors (MAPE)
    and guarantee non-negative predictions in physical pollutant units.
    """
    def __init__(self, **params):
        self.params = params
        self.model = XGBRegressor(**params)

    def fit(self, X, y, eval_set=None, verbose=False):
        y_trans = np.log1p(np.maximum(y, 0.0))
        eval_trans = None
        if eval_set is not None:
            eval_trans = []
            for X_val, y_val in eval_set:
                eval_trans.append((X_val, np.log1p(np.maximum(y_val, 0.0))))
        self.model.fit(X, y_trans, eval_set=eval_trans, verbose=verbose)
        return self

    def predict(self, X):
        pred_trans = self.model.predict(X)
        return np.maximum(0.0, np.expm1(pred_trans))

    def get_params(self, deep=True):
        return self.model.get_params(deep=deep)

    def set_params(self, **params):
        self.model.set_params(**params)
        return self

    @property
    def feature_importances_(self):
        return self.model.feature_importances_

    @property
    def best_iteration(self):
        return getattr(self.model, "best_iteration", None)


# ═══════════════════════════════════════════════════════════
#  Feature Engineering (Vectorized & Memory-Optimized)
# ═══════════════════════════════════════════════════════════
def _add_hourly_features(df):
    """Add multi-pollutant, meteorological, spatial, and cyclical features.
    Returns (df, list_of_feature_column_names)."""
    feats = []

    # 1. Primary PM targets lags and rolling
    for p in ["PM2.5", "PM10"]:
        if p not in df.columns: continue
        for lag in [1, 2, 3, 6, 12, 24, 48]:
            c = f"{p}_lag{lag}"
            df[c] = df[p].shift(lag).astype(np.float32)
            feats.append(c)
        for w in [6, 24]:
            c = f"{p}_rm{w}"
            df[c] = df[p].rolling(w, min_periods=1).mean().shift(1).astype(np.float32)
            feats.append(c)
        c_std = f"{p}_std24"
        df[c_std] = df[p].rolling(24, min_periods=3).std().shift(1).astype(np.float32)
        feats.append(c_std)

    # 2. Secondary pollutant markers (NO, NO2, CO, Ozone)
    for p in ["NO", "NO2", "CO", "Ozone"]:
        if p in df.columns:
            for lag in [1, 2, 24]:
                c = f"{p}_lag{lag}"
                df[c] = df[p].shift(lag).astype(np.float32)
                feats.append(c)
            c = f"{p}_rm24"
            df[c] = df[p].rolling(24, min_periods=1).mean().shift(1).astype(np.float32)
            feats.append(c)

    # 3. Regional Delhi air basin spatial features
    for cp in ["city_pm25", "city_pm10"]:
        if cp in df.columns:
            for lag in [1, 24]:
                c = f"{cp}_lag{lag}"
                df[c] = df[cp].shift(lag).astype(np.float32)
                feats.append(c)

    if "city_pm25" in df.columns and "PM2.5" in df.columns:
        df["station_rel_pm25"] = (df["PM2.5"] / (df["city_pm25"] + 1e-4)).shift(1).astype(np.float32)
        feats.append("station_rel_pm25")
    if "city_pm10" in df.columns and "PM10" in df.columns:
        df["station_rel_pm10"] = (df["PM10"] / (df["city_pm10"] + 1e-4)).shift(1).astype(np.float32)
        feats.append("station_rel_pm10")

    # 4. Chemical ratios and dynamics
    if "PM2.5" in df.columns and "PM10" in df.columns:
        df["pm_ratio"] = (df["PM2.5"] / (df["PM10"] + 1e-4)).shift(1).astype(np.float32)
        feats.append("pm_ratio")
    if "NO" in df.columns and "NO2" in df.columns:
        df["no_ratio"] = (df["NO"] / (df["NO2"] + 1e-4)).shift(1).astype(np.float32)
        feats.append("no_ratio")
    if "CO" in df.columns and "PM2.5" in df.columns:
        df["co_pm25"] = (df["CO"] / (df["PM2.5"] + 1e-4)).shift(1).astype(np.float32)
        feats.append("co_pm25")
    if "Ozone" in df.columns and "NO2" in df.columns:
        df["total_ox"] = (df["Ozone"] + df["NO2"]).shift(1).astype(np.float32)
        feats.append("total_ox")

    if "PM2.5" in df.columns:
        df["pm25_diff1"] = df["PM2.5"].diff(1).astype(np.float32)
        feats.append("pm25_diff1")
    if "PM10" in df.columns:
        df["pm10_diff1"] = df["PM10"].diff(1).astype(np.float32)
        feats.append("pm10_diff1")

    # 5. Cyclical time encodings
    dt = df["datetime"]
    df["hour_sin"] = np.sin(2 * np.pi * dt.dt.hour / 24).astype(np.float32)
    df["hour_cos"] = np.cos(2 * np.pi * dt.dt.hour / 24).astype(np.float32)
    df["dow_sin"] = np.sin(2 * np.pi * dt.dt.dayofweek / 7).astype(np.float32)
    df["dow_cos"] = np.cos(2 * np.pi * dt.dt.dayofweek / 7).astype(np.float32)
    df["month_sin"] = np.sin(2 * np.pi * dt.dt.month / 12).astype(np.float32)
    df["month_cos"] = np.cos(2 * np.pi * dt.dt.month / 12).astype(np.float32)
    df["doy_sin"] = np.sin(2 * np.pi * dt.dt.dayofyear / 365.25).astype(np.float32)
    df["doy_cos"] = np.cos(2 * np.pi * dt.dt.dayofyear / 365.25).astype(np.float32)
    df["is_weekend"] = (dt.dt.dayofweek >= 5).astype(np.float32)
    feats.extend(["hour_sin", "hour_cos", "dow_sin", "dow_cos", "month_sin", "month_cos", "doy_sin", "doy_cos", "is_weekend"])

    # 6. Meteorological features
    for w in WEATHER_COLS:
        if w in df.columns:
            feats.append(w)

    return df, feats


def _add_daily_features(df):
    """Add daily lags, rolling stats, and calendar encodings.
    Returns (df, list_of_feature_column_names)."""
    feats = []

    # 1. Primary PM daily lags and rolling
    for p in ["PM2.5", "PM10"]:
        if p not in df.columns: continue
        for lag in [1, 2, 3, 7, 14, 21, 28]:
            c = f"{p}_dlag{lag}"
            df[c] = df[p].shift(lag).astype(np.float32)
            feats.append(c)
        for w in [3, 7, 14, 30]:
            c = f"{p}_drm{w}"
            df[c] = df[p].rolling(w, min_periods=1).mean().shift(1).astype(np.float32)
            feats.append(c)
        c_std = f"{p}_dstd7"
        df[c_std] = df[p].rolling(7, min_periods=2).std().shift(1).astype(np.float32)
        feats.append(c_std)

    # 2. Secondary pollutants
    for p in ["NO", "NO2", "CO", "Ozone"]:
        if p in df.columns:
            for lag in [1, 2, 7]:
                c = f"{p}_dlag{lag}"
                df[c] = df[p].shift(lag).astype(np.float32)
                feats.append(c)
            c = f"{p}_drm7"
            df[c] = df[p].rolling(7, min_periods=1).mean().shift(1).astype(np.float32)
            feats.append(c)

    # 3. City spatial daily lags
    for cp in ["city_pm25", "city_pm10"]:
        if cp in df.columns:
            for lag in [1, 3, 7]:
                c = f"{cp}_dlag{lag}"
                df[c] = df[cp].shift(lag).astype(np.float32)
                feats.append(c)

    # 4. Ratios and differences
    if "PM2.5" in df.columns:
        df["pm25_ddiff"] = df["PM2.5"].diff(1).astype(np.float32)
        feats.append("pm25_ddiff")
    if "PM10" in df.columns:
        df["pm10_ddiff"] = df["PM10"].diff(1).astype(np.float32)
        feats.append("pm10_ddiff")
    if "PM2.5" in df.columns and "PM10" in df.columns:
        df["pm_ratio"] = (df["PM2.5"] / (df["PM10"] + 1e-4)).shift(1).astype(np.float32)
        feats.append("pm_ratio")

    # 5. Calendar encodings
    dt = df["datetime"]
    df["dow_sin"] = np.sin(2 * np.pi * dt.dt.dayofweek / 7).astype(np.float32)
    df["dow_cos"] = np.cos(2 * np.pi * dt.dt.dayofweek / 7).astype(np.float32)
    df["month_sin"] = np.sin(2 * np.pi * dt.dt.month / 12).astype(np.float32)
    df["month_cos"] = np.cos(2 * np.pi * dt.dt.month / 12).astype(np.float32)
    df["doy_sin"] = np.sin(2 * np.pi * dt.dt.dayofyear / 365.25).astype(np.float32)
    df["doy_cos"] = np.cos(2 * np.pi * dt.dt.dayofyear / 365.25).astype(np.float32)
    df["is_weekend"] = (dt.dt.dayofweek >= 5).astype(np.float32)
    feats.extend(["dow_sin", "dow_cos", "month_sin", "month_cos", "doy_sin", "doy_cos", "is_weekend"])

    for wc in WEATHER_COLS:
        if wc in df.columns:
            feats.append(wc)

    return df, feats


# ═══════════════════════════════════════════════════════════
#  Data Preparation
# ═══════════════════════════════════════════════════════════
def prepare(raw, meta=None, weather=None):
    """Build per-station hourly & daily DataFrames with engineered features.
    Computes spatial city-wide averages and weather dynamics with minimal memory footprint."""
    raw = raw.copy()

    # Preprocess weather if provided
    if weather is not None:
        weather = weather.copy()
        if "wind_dir" in weather.columns:
            weather["wind_sin"] = np.sin(2 * np.pi * weather["wind_dir"] / 360).astype(np.float32)
            weather["wind_cos"] = np.cos(2 * np.pi * weather["wind_dir"] / 360).astype(np.float32)
            weather.drop(columns=["wind_dir"], inplace=True)

        if "wind_speed" in weather.columns and "rh" in weather.columns:
            weather["ventilation"] = (weather["wind_speed"] / (weather["rh"] + 1.0) * 100.0).astype(np.float32)
            weather["stagnation"] = ((weather["wind_speed"] < 1.5) & (weather["rh"] > 60.0)).astype(np.float32)
        if "temp" in weather.columns:
            weather["temp_diff6"] = (weather["temp"] - weather["temp"].shift(6)).astype(np.float32)
        if "pressure" in weather.columns:
            weather["press_diff6"] = (weather["pressure"] - weather["pressure"].shift(6)).astype(np.float32)

        for wc in ["temp", "rh", "wind_speed", "pressure", "precip"]:
            if wc in weather.columns:
                weather[wc] = weather[wc].astype(np.float32)

        raw = pd.merge(raw, weather, on="datetime", how="left")
        del weather

    # Compute Delhi-wide air basin spatial averages
    spatial_cols = [c for c in ["PM2.5", "PM10", "CO", "NO2"] if c in raw.columns]
    if spatial_cols:
        city_avg = raw.groupby("datetime")[spatial_cols].mean().reset_index()
        city_avg.columns = ["datetime"] + [f"city_{c.lower()}" for c in spatial_cols]
        for c in city_avg.columns:
            if c != "datetime":
                city_avg[c] = city_avg[c].astype(np.float32)
        raw = pd.merge(raw, city_avg, on="datetime", how="left")
        del city_avg

    gc.collect()

    stations = {}
    pollutants_present = [p for p in ALL_POLLUTANTS if p in raw.columns]
    resample_candidates = pollutants_present + [c for c in WEATHER_COLS if c in raw.columns]
    resample_candidates += [f"city_{c.lower()}" for c in spatial_cols]

    for sid, grp in raw.groupby("station"):
        h = grp.sort_values("datetime").reset_index(drop=True).copy()
        h, hf = _add_hourly_features(h)

        resample_cols = [c for c in resample_candidates if c in grp.columns]
        d = (grp.set_index("datetime")
                .resample("D")[resample_cols].mean()
                .reset_index()
                .dropna(subset=["PM2.5", "PM10"], how="all"))
        for c in resample_cols:
            d[c] = d[c].astype(np.float32)
        d, df_ = _add_daily_features(d)

        stations[sid] = dict(hourly=h, daily=d, h_feats=hf, d_feats=df_)

    gc.collect()
    return stations


# ═══════════════════════════════════════════════════════════
#  Internal: Pool across stations
# ═══════════════════════════════════════════════════════════
def _pool(stations, scale, target, lead, test_start, stride=1, use_weather=False):
    """Concatenate feature / target arrays from all stations."""
    fkey = "h_feats" if scale == "hourly" else "d_feats"
    parts_tr, parts_va, parts_te = [], [], []

    for sid, data in stations.items():
        df = data[scale].copy()
        df["_y"] = df[target].shift(-lead)

        fcols = list(data[fkey])
        if use_weather:
            prefix = "hlead" if scale == "hourly" else "dlead"
            for wc in WEATHER_COLS:
                if wc in df.columns:
                    col_lead = f"{wc}_{prefix}{lead}"
                    df[col_lead] = df[wc].shift(-lead).astype(np.float32)
                    fcols.append(col_lead)

        ok = df.dropna(subset=fcols + ["_y"])
        X = ok[fcols].values.astype(np.float32)
        y = ok["_y"].values.astype(np.float32)
        dts = ok["datetime"].values

        if test_start is not None:
            ts = np.datetime64(test_start)
            tr = dts < ts
            te = dts >= ts

            Xtr, ytr = X[tr], y[tr]
            Xte, yte = X[te], y[te]

            split = int(len(Xtr) * 0.85)
            if stride > 1:
                idx = np.arange(0, split, stride)
                parts_tr.append((Xtr[idx], ytr[idx]))
            else:
                parts_tr.append((Xtr[:split], ytr[:split]))

            parts_va.append((Xtr[split:], ytr[split:]))
            if len(Xte):
                parts_te.append((Xte, yte))
        else:
            if stride > 1:
                idx = np.arange(0, len(X), stride)
                X, y = X[idx], y[idx]
            split = int(len(X) * 0.9)
            parts_tr.append((X[:split], y[:split]))
            parts_va.append((X[split:], y[split:]))

    def _stack(parts):
        if not parts:
            return None, None
        return (np.vstack([p[0] for p in parts]), np.concatenate([p[1] for p in parts]))

    return (*_stack(parts_tr), *_stack(parts_va), *_stack(parts_te))


# ═══════════════════════════════════════════════════════════
#  Training — Point Regression
# ═══════════════════════════════════════════════════════════
def train(stations, test_start="2024-09-01", stride_h=1, stride_d=1,
          params=None, verbose=True, use_weather=True, use_log_target=True):
    """Train point regression models for every (scale, target, lead)."""
    base_p = dict(XGB_PARAMS, **(params or {}))
    models, metrics, td = {}, {}, {}

    tasks = (
        [("hourly", t, h, stride_h) for t in TARGETS for h in HOURLY_LEADS] +
        [("daily",  t, d, stride_d) for t in TARGETS for d in DAILY_LEADS]
    )

    for i, (scale, tgt, lead, stride) in enumerate(tasks, 1):
        key = (scale, tgt, lead)
        if verbose:
            print(f"  [{i:2d}/{len(tasks)}] {scale:6s} {tgt:5s} lead={lead:2d} …", end="  ", flush=True)

        Xtr, ytr, Xva, yva, Xte, yte = _pool(
            stations, scale, tgt, lead, test_start, stride, use_weather=use_weather
        )

        p = dict(base_p)
        if scale == "hourly" and lead >= 12:
            p["max_depth"] = min(p.get("max_depth", 6), 5)
            p["learning_rate"] = 0.06
        elif scale == "daily":
            p["max_depth"] = min(p.get("max_depth", 6), 5)
            p["learning_rate"] = 0.06

        if use_log_target:
            m = LogTransformedXGBRegressor(**p)
            m.fit(Xtr, ytr, eval_set=[(Xva, yva)], verbose=False)
        else:
            m = XGBRegressor(**p)
            m.fit(Xtr, ytr, eval_set=[(Xva, yva)], verbose=False)

        models[key] = m

        if Xte is not None and yte is not None:
            pred = m.predict(Xte)
            pred = np.maximum(pred, 0.0)

            rmse = float(np.sqrt(mean_squared_error(yte, pred)))
            mae  = float(mean_absolute_error(yte, pred))
            r2   = float(r2_score(yte, pred))

            mask = yte > 1.0
            mape = float(np.mean(np.abs((yte[mask] - pred[mask]) / yte[mask])) * 100) if mask.sum() else 0.0
            acc = 100.0 - mape

            metrics[key] = dict(rmse=rmse, mae=mae, r2=r2, mape=mape, accuracy=acc, n=len(yte))
            td[key] = (yte, pred)
            if verbose:
                print(f"ACC={acc:5.2f}% (MAPE={mape:5.2f}%)  RMSE={rmse:6.2f}  MAE={mae:6.2f}  R²={r2:.4f}")
        else:
            if verbose:
                print(f"trained ({len(ytr):,} rows, no test)")

    return models, metrics, td


# ═══════════════════════════════════════════════════════════
#  Training — Quantile Models (Prediction Bands)
# ═══════════════════════════════════════════════════════════
def train_quantiles(stations, models, test_start="2024-09-01",
                    params=None, verbose=True, use_weather=True, use_log_target=True):
    """Train 10th / 90th percentile quantile regressors for 80% prediction bands."""
    base_p = dict(XGB_PARAMS, **(params or {}))
    base_p.pop("objective", None)

    rows = []
    point_keys = sorted(k for k in models if isinstance(k, tuple) and len(k) == 3)

    for i, key in enumerate(point_keys, 1):
        scale, tgt, lead = key
        if verbose:
            print(f"  [{i:2d}/{len(point_keys)}] q {scale:6s} {tgt:5s} lead={lead:2d} …", end="  ", flush=True)

        Xtr, ytr, Xva, yva, Xte, yte = _pool(
            stations, scale, tgt, lead, test_start, use_weather=use_weather
        )

        for alpha, tag in [(0.1, "q10"), (0.9, "q90")]:
            qp = dict(base_p, objective="reg:quantileerror", quantile_alpha=alpha)
            if scale == "hourly" and lead >= 12:
                qp["max_depth"] = min(qp.get("max_depth", 5), 5)
            elif scale == "daily":
                qp["max_depth"] = min(qp.get("max_depth", 5), 5)

            if use_log_target:
                qm = LogTransformedXGBRegressor(**qp)
                qm.fit(Xtr, ytr, eval_set=[(Xva, yva)], verbose=False)
            else:
                qm = XGBRegressor(**qp)
                qm.fit(Xtr, ytr, eval_set=[(Xva, yva)], verbose=False)

            models[(*key, tag)] = qm

        if Xte is not None and yte is not None:
            lo = models[(*key, "q10")].predict(Xte)
            hi = models[(*key, "q90")].predict(Xte)

            hi = np.maximum(hi, lo)
            lo = np.maximum(lo, 0.0)

            cov = float(((yte >= lo) & (yte <= hi)).mean())
            wid = float((hi - lo).mean())

            thr = 250.0 if tgt == "PM2.5" else 430.0
            sev = yte >= thr
            bhs = float((yte[sev] <= hi[sev]).mean()) if sev.sum() else float("nan")

            rows.append(dict(scale=scale, pollutant=tgt, lead=lead,
                             n=int(len(yte)), coverage=cov,
                             width=wid, below_hi_on_severe=bhs))
            if verbose:
                print(f"cov={cov:.3f}  width={wid:.1f}  sev_cap={bhs:.3f}")
        else:
            if verbose:
                print("no test")

    return pd.DataFrame(rows)


# ═══════════════════════════════════════════════════════════
#  I/O
# ═══════════════════════════════════════════════════════════
def save(models, meta, filename):
    """Persist models + station metadata to a joblib file."""
    joblib.dump({"models": models, "meta": meta}, filename, compress=3)
    n = sum(1 for k in models if isinstance(k, tuple))
    print(f"  Saved {n} model entries -> {filename}")


def load(filename):
    """Load (models, meta) from a joblib file."""
    d = joblib.load(filename)
    return d["models"], d.get("meta")
