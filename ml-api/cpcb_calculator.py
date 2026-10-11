"""
CPCB National Air Quality Index (NAQI) Calculation Engine
──────────────────────────────────────────────────────────
Implements the official Central Pollution Control Board (CPCB) India
sub-index calculation formula (piecewise linear interpolation).
"""

import numpy as np

# Breakpoints: (C_low, C_high, I_low, I_high)
BREAKPOINTS = {
    "PM2.5": [
        (0.0, 30.0, 0, 50),
        (30.1, 60.0, 51, 100),
        (60.1, 90.0, 101, 200),
        (90.1, 120.0, 201, 300),
        (120.1, 250.0, 301, 400),
        (250.1, 500.0, 401, 500),
    ],
    "PM10": [
        (0.0, 50.0, 0, 50),
        (50.1, 100.0, 51, 100),
        (100.1, 250.0, 101, 200),
        (250.1, 350.0, 201, 300),
        (350.1, 430.0, 301, 400),
        (430.1, 600.0, 401, 500),
    ],
    "NO2": [
        (0.0, 40.0, 0, 50),
        (40.1, 80.0, 51, 100),
        (80.1, 180.0, 101, 200),
        (180.1, 280.0, 201, 300),
        (280.1, 400.0, 301, 400),
        (400.1, 800.0, 401, 500),
    ],
    "CO": [
        (0.0, 1.0, 0, 50),
        (1.1, 2.0, 51, 100),
        (2.1, 10.0, 101, 200),
        (10.1, 17.0, 201, 300),
        (17.1, 34.0, 301, 400),
        (34.1, 50.0, 401, 500),
    ],
    "Ozone": [
        (0.0, 50.0, 0, 50),
        (50.1, 100.0, 51, 100),
        (100.1, 168.0, 101, 200),
        (168.1, 208.0, 201, 300),
        (208.1, 748.0, 301, 400),
        (748.1, 1000.0, 401, 500),
    ],
}

CATEGORY_MAP = [
    (50, 1, "Good"),
    (100, 2, "Satisfactory"),
    (200, 3, "Moderate"),
    (300, 4, "Poor"),
    (400, 5, "Very Poor"),
    (500, 6, "Severe"),
]


def calc_sub_index(pollutant: str, conc: float):
    """Calculate sub-index for a single pollutant concentration."""
    if conc is None or np.isnan(conc) or conc < 0:
        return None

    bp_list = BREAKPOINTS.get(pollutant)
    if not bp_list:
        return None

    # Cap concentration above top breakpoint to 500
    if conc > bp_list[-1][1]:
        return 500

    for c_lo, c_hi, i_lo, i_hi in bp_list:
        if c_lo <= conc <= c_hi:
            return round(((i_hi - i_lo) / (c_hi - c_lo)) * (conc - c_lo) + i_lo)

    return None


def get_aqi_category(aqi_val: int):
    """Return category ID (1-6) and string label for given AQI value."""
    if aqi_val is None or np.isnan(aqi_val):
        return None, None
    for max_aqi, cat_id, label in CATEGORY_MAP:
        if aqi_val <= max_aqi:
            return cat_id, label
    return 6, "Severe"


def compute_aqi(pm25=None, pm10=None, no2=None, co=None, o3=None):
    """Compute overall AQI, dominant pollutant, and category ID & label.
    Following CPCB guidelines: AQI is the maximum of the valid sub-indices.
    """
    sub_indices = {}
    if pm25 is not None and not np.isnan(pm25):
        s = calc_sub_index("PM2.5", pm25)
        if s is not None: sub_indices["PM2.5"] = s

    if pm10 is not None and not np.isnan(pm10):
        s = calc_sub_index("PM10", pm10)
        if s is not None: sub_indices["PM10"] = s

    if no2 is not None and not np.isnan(no2):
        s = calc_sub_index("NO2", no2)
        if s is not None: sub_indices["NO2"] = s

    if co is not None and not np.isnan(co):
        s = calc_sub_index("CO", co)
        if s is not None: sub_indices["CO"] = s

    if o3 is not None and not np.isnan(o3):
        s = calc_sub_index("Ozone", o3)
        if s is not None: sub_indices["Ozone"] = s

    if not sub_indices:
        return None, None, None, None

    dominant = max(sub_indices, key=sub_indices.get)
    overall_aqi = int(sub_indices[dominant])
    cat_id, cat_label = get_aqi_category(overall_aqi)

    return overall_aqi, dominant, cat_id, cat_label
