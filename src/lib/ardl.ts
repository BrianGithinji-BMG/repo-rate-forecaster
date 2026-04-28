// ARDL(6, {inflation:3, log_m2:1}) coefficients fitted on Kenya CBK monthly data
// 2000-01 to 2017-12 (training set). Source: BFE 4.2 project notebook.
// repo_t = const
//        + sum_{i=1..6} a_i * repo_{t-i}
//        + sum_{j=0..3} b_j * inflation_{t-j}
//        + g_0 * log_m2_t + g_1 * log_m2_{t-1}
export const ARDL_COEFS = {
  const: -1.9469,
  repo: [0.5862, 0.0694, -0.0132, 0.1673, 0.0022, 0.0762], // L1..L6
  inflation: [0.1977, -0.2126, -0.014, 0.1063], // L0..L3
  log_m2: [-14.6281, 14.793], // L0..L1
} as const;

// Training residual statistics (in-sample) used for confidence bands.
// Derived from Train MSE = 4.27, RMSE = 2.07 (CHAPTER FOUR.docx, BFE 4.2).
export const TRAIN_RMSE = 2.07;
export const TEST_RMSE = 2.44;

export const MODEL_METRICS = {
  ardl: {
    train: { mse: 4.27, rmse: 2.07, mae: 1.22, mape: 28.36 },
    test: { mse: 5.98, rmse: 2.44, mae: 2.06, mape: 34.19 },
  },
  xgboost: {
    train: { mse: 6.49, rmse: 2.55, mae: 1.85, mape: 64.36 },
    test: { mse: 8.22, rmse: 2.87, mae: 2.46, mape: 39.44 },
  },
  hybrid: {
    train: { mse: 4.25, rmse: 2.06, mae: 1.21, mape: 28.21 },
    test: { mse: 5.98, rmse: 2.44, mae: 2.06, mape: 34.19 },
  },
} as const;

export interface ArdlState {
  // Most recent at index 0
  repo_lags: number[]; // length >= 6
  inflation: number; // current
  inflation_lags: number[]; // length >= 3
  log_m2: number; // current
  log_m2_lag1: number;
}

export function ardlOneStep(state: ArdlState): number {
  const c = ARDL_COEFS;
  let y = c.const;
  for (let i = 0; i < 6; i++) y += c.repo[i] * state.repo_lags[i];
  // inflation L0..L3 — current + 3 lags
  const inflArr = [state.inflation, ...state.inflation_lags.slice(0, 3)];
  for (let j = 0; j < 4; j++) y += c.inflation[j] * inflArr[j];
  // log_m2 L0..L1
  y += c.log_m2[0] * state.log_m2;
  y += c.log_m2[1] * state.log_m2_lag1;
  return y;
}

export interface MultiStepInput {
  repo_lags: number[]; // length 6, [t-1..t-6] at start
  inflation_lags: number[]; // length 3, [t-1..t-3] at start
  log_m2_lag1: number; // log(M2_{t-1}) at start
  // Future paths (must have length >= horizon)
  inflation_path: number[]; // future inflation, one per step
  log_m2_path: number[]; // future log(M2), one per step
  horizon: number;
}

export function ardlForecast(input: MultiStepInput): number[] {
  const repoLags = [...input.repo_lags];
  const inflLags = [...input.inflation_lags];
  let logM2Prev = input.log_m2_lag1;
  const out: number[] = [];

  for (let h = 0; h < input.horizon; h++) {
    const inflNow = input.inflation_path[h];
    const logM2Now = input.log_m2_path[h];

    const yhat = ardlOneStep({
      repo_lags: repoLags,
      inflation: inflNow,
      inflation_lags: inflLags,
      log_m2: logM2Now,
      log_m2_lag1: logM2Prev,
    });

    out.push(yhat);
    repoLags.unshift(yhat);
    repoLags.length = 6;
    inflLags.unshift(inflNow);
    inflLags.length = 3;
    logM2Prev = logM2Now;
  }
  return out;
}

// Recent observed values (Dec 2024) — used as smart defaults so the form is pre-filled
// with realistic values rather than zeros. Sourced from CBK / KNBS public series.
export const RECENT_DEFAULTS = {
  inflation: 3.0, // KNBS YoY CPI inflation, Dec 2024 ≈ 3.0%
  usd_ksh: 129.5, // CBK indicative USD/KSH, late 2024
  m2: 4_682_652.95, // KES Mn, end-2024 (≈ from descriptive max)
  repo_lags: [12.75, 12.75, 12.75, 13.0, 13.0, 13.0], // CBR / repo policy path 2024 H2
  inflation_lags: [2.7, 2.8, 3.6], // CPI prior 3 months
  m2_lags: [4_580_000.0],
};

export function nextMonthsFrom(today: Date, horizon: number): string[] {
  const out: string[] = [];
  for (let i = 1; i <= horizon; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i + 1, 0);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}
