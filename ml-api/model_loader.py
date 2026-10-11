"""
Model Loader & Inference Wrapper for V3 AQI Forecasting Engine
──────────────────────────────────────────────────────────────
Safely loads `aqi_models_v3.joblib` and exposes clean point and
confidence interval prediction methods.
"""

import os, sys
import numpy as np
import joblib

# Ensure aqi_forecast module is accessible for class unpickling
MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if MODEL_DIR not in sys.path:
    sys.path.insert(0, MODEL_DIR)

try:
    import aqi_forecast as A
except ImportError:
    # If not in model dir, check parent directories
    parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)
    import aqi_forecast as A

DEFAULT_MODEL_PATH = os.path.join(MODEL_DIR, "aqi_models_v3.joblib")


class AQIModelRegistry:
    def __init__(self, model_path=None):
        self.model_path = model_path or os.environ.get("MODEL_ARTIFACT_PATH", DEFAULT_MODEL_PATH)
        self.bundle = None
        self.models = None
        self.meta = None
        self._load()

    def _load(self):
        if not os.path.exists(self.model_path):
            # Fallback relative paths
            candidates = [
                self.model_path,
                os.path.join(os.path.dirname(__file__), "aqi_models_v3.joblib"),
                os.path.join(os.path.dirname(__file__), "..", "..", "aqi_models_v3.joblib"),
            ]
            for c in candidates:
                if os.path.exists(c):
                    self.model_path = c
                    break

        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model artifact not found at: {self.model_path}")

        print(f"Loading AQI V3 models from: {self.model_path}")
        self.bundle = joblib.load(self.model_path)
        self.models = self.bundle.get("models", {})
        self.meta = self.bundle.get("meta", None)
        print(f"Loaded {len(self.models)} model objects successfully.")

    def get_model(self, scale: str, target: str, lead: int):
        return self.models.get((scale, target, lead))

    def get_quantile_model(self, scale: str, target: str, lead: int, tag: str):
        return self.models.get((scale, target, lead, tag))

    def predict(self, scale: str, target: str, lead: int, X):
        m = self.get_model(scale, target, lead)
        if m is None:
            raise KeyError(f"No model found for scale={scale}, target={target}, lead={lead}")
        pred = m.predict(X)
        return np.maximum(0.0, np.array(pred, dtype=np.float32))

    def predict_with_intervals(self, scale: str, target: str, lead: int, X):
        m_point = self.get_model(scale, target, lead)
        m_q10 = self.get_quantile_model(scale, target, lead, "q10")
        m_q90 = self.get_quantile_model(scale, target, lead, "q90")

        if m_point is None:
            raise KeyError(f"No model found for scale={scale}, target={target}, lead={lead}")

        pt = np.maximum(0.0, np.array(m_point.predict(X), dtype=np.float32))

        lo = np.maximum(0.0, np.array(m_q10.predict(X), dtype=np.float32)) if m_q10 else pt * 0.8
        hi = np.maximum(lo, np.array(m_q90.predict(X), dtype=np.float32)) if m_q90 else pt * 1.2

        return pt, lo, hi

    def get_available_leads(self, scale: str):
        keys = [k for k in self.models if isinstance(k, tuple) and len(k) == 3 and k[0] == scale]
        leads = sorted(list(set(k[2] for k in keys)))
        return leads


# Global singleton instance
_registry = None

def get_model_registry(model_path=None):
    global _registry
    if _registry is None or (model_path and _registry.model_path != model_path):
        _registry = AQIModelRegistry(model_path=model_path)
    return _registry
