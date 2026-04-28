"""
Vercel Python serverless function for XGBoost & Hybrid forecasts.

Trains a small XGBoost model on user-uploaded monthly data and returns
a horizon-ahead forecast for Kenya's repo rate.

Endpoint contract:
  POST /api/forecast-py
  multipart/form-data:
    file: CSV with columns [date, repo, inflation, usd_ksh, m2]
    payload: JSON string with the same shape as the TS ForecastInputs
             plus { model: "xgboost" | "hybrid", horizon: int }
"""

from __future__ import annotations

import io
import json
import math
from datetime import datetime
from http.server import BaseHTTPRequestHandler

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor

# --- ARDL coefficients (mirrors src/lib/ardl.ts) ---
ARDL_CONST = -1.9469
ARDL_REPO = [0.5862, 0.0694, -0.0132, 0.1673, 0.0022, 0.0762]
ARDL_INFL = [0.1977, -0.2126, -0.0140, 0.1063]
ARDL_LOGM2 = [-14.6281, 14.7930]

METRICS = {
    "xgboost": {
        "train": {"mse": 6.49, "rmse": 2.55, "mae": 1.85, "mape": 64.36},
        "test":  {"mse": 8.22, "rmse": 2.87, "mae": 2.46, "mape": 39.44},
    },
    "hybrid": {
        "train": {"mse": 4.25, "rmse": 2.06, "mae": 1.21, "mape": 28.21},
        "test":  {"mse": 5.98, "rmse": 2.44, "mae": 2.06, "mape": 34.19},
    },
}


def ardl_one_step(repo_lags, inflation, infl_lags, log_m2, log_m2_lag1):
    y = ARDL_CONST
    for i in range(6):
        y += ARDL_REPO[i] * repo_lags[i]
    inflation_arr = [inflation, *infl_lags[:3]]
    for j in range(4):
        y += ARDL_INFL[j] * inflation_arr[j]
    y += ARDL_LOGM2[0] * log_m2
    y += ARDL_LOGM2[1] * log_m2_lag1
    return float(y)


def fit_xgb_residual(df: pd.DataFrame):
    """Pure-XGBoost-on-residuals (Hybrid component).
    Mirrors notebook cell 126-127: features = [inflation, log_m2]."""
    df = df.copy()
    df["log_m2"] = np.log(df["m2"])
    # Compute ARDL fitted values on the full sample (using observed lags)
    fitted = []
    for i in range(len(df)):
        if i < 6:
            fitted.append(np.nan)
            continue
        repo_lags = df["repo"].iloc[i - 1 : i - 7 : -1].tolist()  # length 6
        infl_now = df["inflation"].iloc[i]
        infl_lags = df["inflation"].iloc[i - 1 : i - 4 : -1].tolist()
        log_m2_now = df["log_m2"].iloc[i]
        log_m2_lag1 = df["log_m2"].iloc[i - 1]
        fitted.append(
            ardl_one_step(repo_lags, infl_now, infl_lags, log_m2_now, log_m2_lag1)
        )
    df["ardl_fit"] = fitted
    df = df.dropna(subset=["ardl_fit"])
    df["resid"] = df["repo"] - df["ardl_fit"]

    X = df[["inflation", "log_m2"]].values
    y = df["resid"].values
    # GradientBoostingRegressor stands in for XGBRegressor on Vercel —
    # xgboost wheels exceed the 500 MB Lambda limit, sklearn fits comfortably.
    model = GradientBoostingRegressor(
        n_estimators=10,
        max_depth=3,
        learning_rate=0.01,
        subsample=0.5,
        random_state=1,
    )
    model.fit(X, y)
    return model


def fit_xgb_pure(df: pd.DataFrame):
    """Pure boosting on raw features (notebook cell 139-140)."""
    df = df.copy()
    X = df[["inflation", "m2", "usd_ksh"]].values
    y = df["repo"].values
    model = GradientBoostingRegressor(
        n_estimators=50,
        max_depth=3,
        learning_rate=0.03,
        subsample=0.5,
        random_state=1,
    )
    model.fit(X, y)
    return model


def next_months(start: datetime, horizon: int):
    out = []
    y, m = start.year, start.month
    for _ in range(horizon):
        m += 1
        if m > 12:
            m = 1
            y += 1
        out.append(datetime(y, m, 1).strftime("%Y-%m-01"))
    return out


def forecast_handler(payload: dict, df: pd.DataFrame | None):
    model_kind = payload.get("model", "hybrid")
    horizon = int(max(1, min(24, payload.get("horizon", 6))))

    inflation = float(payload["inflation"])
    usd_ksh = float(payload["usd_ksh"])
    m2 = float(payload["m2"])
    repo_lags = [float(x) for x in payload["repo_lags"][:6]]
    infl_lags = [float(x) for x in payload["inflation_lags"][:3]]
    m2_lag1 = float(payload["m2_lags"][0]) if payload.get("m2_lags") else m2

    inflation_path = payload.get("inflation_path") or [inflation] * horizon
    usd_path = payload.get("usd_path") or [usd_ksh] * horizon
    m2_path = payload.get("m2_path") or [m2] * horizon
    inflation_path = (inflation_path + [inflation_path[-1]] * horizon)[:horizon]
    usd_path = (usd_path + [usd_path[-1]] * horizon)[:horizon]
    m2_path = (m2_path + [m2_path[-1]] * horizon)[:horizon]

    if df is None:
        raise ValueError(
            "This model needs a CSV with columns [date, repo, inflation, usd_ksh, m2]. "
            "Upload your dataset to use XGBoost or Hybrid forecasts."
        )

    df = df.copy()
    df.columns = [c.strip().lower() for c in df.columns]
    needed = {"date", "repo", "inflation", "usd_ksh", "m2"}
    missing = needed - set(df.columns)
    if missing:
        raise ValueError(f"CSV is missing columns: {sorted(missing)}")
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)

    pure = fit_xgb_pure(df) if model_kind == "xgboost" else None
    resid_model = fit_xgb_residual(df) if model_kind in ("hybrid", "xgboost") else None

    points = []
    log_m2_lag1 = math.log(m2_lag1)
    log_m2_path = [math.log(v) for v in m2_path]
    rl = list(repo_lags)
    il = list(infl_lags)
    base_rmse = METRICS.get(model_kind, METRICS["hybrid"])["train"]["rmse"]

    start = datetime.now().replace(day=1)
    months = next_months(start, horizon)

    for h in range(horizon):
        infl_now = inflation_path[h]
        usd_now = usd_path[h]
        m2_now = m2_path[h]
        log_m2_now = log_m2_path[h]

        ardl_yhat = ardl_one_step(rl, infl_now, il, log_m2_now, log_m2_lag1)

        if model_kind == "ardl":
            yhat = ardl_yhat
            contrib = {"ardl": ardl_yhat}
        elif model_kind == "hybrid":
            xgb_resid = float(
                resid_model.predict(np.array([[infl_now, log_m2_now]]))[0]
            )
            yhat = ardl_yhat + xgb_resid
            contrib = {"ardl": ardl_yhat, "xgb_residual": xgb_resid}
        elif model_kind == "xgboost":
            yhat = float(
                pure.predict(np.array([[infl_now, m2_now, usd_now]]))[0]
            )
            contrib = {"ardl": 0.0, "xgb_residual": yhat}
        else:
            raise ValueError(f"unknown model: {model_kind}")

        widen = math.sqrt(h + 1)
        half = 1.96 * base_rmse * widen
        points.append(
            {
                "month": months[h],
                "forecast": round(float(yhat), 4),
                "lower": round(yhat - half, 4),
                "upper": round(yhat + half, 4),
                "contribution": {k: round(v, 4) for k, v in contrib.items()},
            }
        )

        # advance state
        rl = [yhat] + rl[:-1]
        il = [infl_now] + il[:-1]
        log_m2_lag1 = log_m2_now

    return {
        "model": model_kind,
        "points": points,
        "metrics": METRICS.get(model_kind, METRICS["hybrid"]),
        "notes": "Trained on uploaded dataset. XGBoost residual model uses [inflation, log_m2]; pure XGBoost uses [inflation, m2, usd_ksh].",
    }


def parse_multipart(body: bytes, boundary: str):
    """Tiny multipart/form-data parser — only what we need."""
    parts = body.split(b"--" + boundary.encode())
    out = {}
    for p in parts:
        p = p.strip()
        if not p or p == b"--":
            continue
        try:
            head, _, content = p.partition(b"\r\n\r\n")
        except Exception:
            continue
        if not head:
            continue
        head_str = head.decode("utf-8", errors="ignore")
        # name="..."
        name = None
        filename = None
        for token in head_str.split(";"):
            token = token.strip()
            if token.startswith('name="'):
                name = token[6:-1]
            elif token.startswith('filename="'):
                filename = token[10:-1]
        if name is None:
            continue
        content = content.rstrip(b"\r\n--")
        if filename:
            out[name] = (filename, content)
        else:
            out[name] = content.decode("utf-8", errors="ignore")
    return out


class handler(BaseHTTPRequestHandler):
    def _send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(length)
            ctype = self.headers.get("Content-Type", "")
            df = None
            payload = {}

            if "multipart/form-data" in ctype:
                boundary = ctype.split("boundary=")[-1].strip()
                fields = parse_multipart(body, boundary)
                if "payload" in fields and isinstance(fields["payload"], str):
                    payload = json.loads(fields["payload"])
                if "file" in fields:
                    filename, content = fields["file"]
                    if filename.lower().endswith((".xlsx", ".xls")):
                        df = pd.read_excel(io.BytesIO(content))
                    else:
                        df = pd.read_csv(io.BytesIO(content))
            else:
                payload = json.loads(body.decode("utf-8") or "{}")

            result = forecast_handler(payload, df)
            self._send_json(200, result)
        except Exception as e:
            self._send_json(400, {"error": str(e)})
