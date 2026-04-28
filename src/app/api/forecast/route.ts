import { NextRequest, NextResponse } from "next/server";
import {
  ardlForecast,
  MODEL_METRICS,
  TRAIN_RMSE,
  nextMonthsFrom,
} from "@/lib/ardl";
import type { ForecastInputs, ForecastResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ForecastInputs & { startDate?: string };
    const horizon = Math.max(1, Math.min(24, body.horizon ?? 6));

    const inflation_path =
      body.inflation_path && body.inflation_path.length >= horizon
        ? body.inflation_path.slice(0, horizon)
        : Array(horizon).fill(body.inflation);
    const m2Now = body.m2;
    const m2_path =
      body.m2_path && body.m2_path.length >= horizon
        ? body.m2_path.slice(0, horizon)
        : Array(horizon).fill(m2Now);
    const log_m2_path = m2_path.map((v) => Math.log(v));
    const log_m2_lag1 = Math.log(body.m2_lags[0] ?? body.m2);

    const forecasts = ardlForecast({
      repo_lags: body.repo_lags,
      inflation_lags: body.inflation_lags,
      log_m2_lag1,
      inflation_path,
      log_m2_path,
      horizon,
    });

    const start = body.startDate ? new Date(body.startDate) : new Date();
    const months = nextMonthsFrom(start, horizon);

    // 95% CI ≈ ±1.96 * RMSE — uncertainty grows with horizon
    const points = forecasts.map((y, i) => {
      const widen = Math.sqrt(i + 1);
      const halfWidth = 1.96 * TRAIN_RMSE * widen;
      return {
        month: months[i],
        forecast: round(y),
        lower: round(y - halfWidth),
        upper: round(y + halfWidth),
        contribution: { ardl: round(y) },
      };
    });

    const resp: ForecastResponse = {
      model: "ardl",
      points,
      metrics: MODEL_METRICS.ardl,
      notes:
        "ARDL(6, 3, 1) fitted on Kenya CBK monthly data, 2000–2017 training window.",
    };
    return NextResponse.json(resp);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Forecast failed" },
      { status: 400 },
    );
  }
}

function round(x: number, d = 4) {
  const m = Math.pow(10, d);
  return Math.round(x * m) / m;
}
