export type ModelKind = "ardl" | "xgboost" | "hybrid";

export interface ForecastInputs {
  // Current month exogenous values
  inflation: number;
  usd_ksh: number;
  m2: number;
  // Recent observed lags (most recent first → oldest)
  // Index 0 = t-1, index 5 = t-6
  repo_lags: number[]; // length 6
  inflation_lags: number[]; // length 3 (t-1, t-2, t-3)
  m2_lags: number[]; // length 1 (t-1, in raw units, will be log-transformed)
  horizon: number; // months ahead, 1..12
  // For multi-step path projection
  inflation_path?: number[]; // future inflation values (one per horizon month)
  usd_path?: number[]; // future USD/KSH values
  m2_path?: number[]; // future M2 values
}

export interface ForecastPoint {
  month: string; // ISO date
  forecast: number;
  lower?: number;
  upper?: number;
  contribution?: { ardl: number; xgb_residual?: number };
}

export interface ForecastResponse {
  model: ModelKind;
  points: ForecastPoint[];
  metrics: {
    train: ModelMetric;
    test: ModelMetric;
  };
  notes?: string;
  rmse?: number;
}

export interface ModelMetric {
  mse: number;
  rmse: number;
  mae: number;
  mape: number;
}
