"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { ForecastResponse, ForecastPoint, ModelKind } from "@/lib/types";
import { fmtNum, shortMonth } from "@/lib/utils";
import { TrendingUp, CircleAlert, Target } from "lucide-react";

interface Props {
  result: ForecastResponse | null;
  loading: boolean;
  error: string | null;
  model: ModelKind;
  lastRepo: number;
}

export function ForecastResults({ result, loading, error, model, lastRepo }: Props) {
  return (
    <div className="card p-6 lg:p-8 min-h-[420px] flex flex-col">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-[var(--ink-mute)]">
            Forecast output
          </div>
          <h3 className="font-serif text-[26px] tracking-tight text-[var(--ink)]">
            {model === "ardl"
              ? "ARDL projection"
              : model === "xgboost"
                ? "XGBoost projection"
                : "Hybrid projection"}
          </h3>
        </div>
        {result && (
          <div className="text-xs text-[var(--ink-mute)]">
            {result.points.length} months · 95% CI shown
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 p-4 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary)]/30 text-[var(--primary-deep)] text-sm flex gap-2"
          >
            <CircleAlert size={16} className="mt-0.5 shrink-0" />
            <div>{error}</div>
          </motion.div>
        )}
        {loading && !result && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-8 grow grid place-items-center text-[var(--ink-mute)]"
          >
            <Pulse />
          </motion.div>
        )}
        {!loading && !result && !error && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-10 grow grid place-items-center text-center"
          >
            <div className="max-w-sm">
              <div className="mx-auto w-14 h-14 grid place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--primary-deep)] mb-4">
                <Target size={22} />
              </div>
              <p className="text-[var(--ink-2)] text-[15px] leading-relaxed">
                Set your inputs on the left and run a forecast. Results render
                here with confidence bands and per-month contributions.
              </p>
            </div>
          </motion.div>
        )}
        {result && !loading && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 grow flex flex-col"
          >
            <Headline points={result.points} lastRepo={lastRepo} />
            <div className="mt-6 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    {
                      month: "now",
                      forecast: lastRepo,
                      upper: lastRepo,
                      lower: lastRepo,
                    },
                    ...result.points,
                  ]}
                  margin={{ top: 6, right: 12, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#b85042" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#b85042" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#b85042" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="#c98349" stopOpacity={0.85} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#ecd9bd" strokeDasharray="3 4" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(v) => (v === "now" ? "now" : shortMonth(v))}
                    stroke="#9a8772"
                    fontSize={11}
                    tickMargin={8}
                  />
                  <YAxis
                    stroke="#9a8772"
                    fontSize={11}
                    domain={["auto", "auto"]}
                    tickFormatter={(v) => `${v.toFixed(1)}`}
                    width={36}
                  />
                  <Tooltip
                    cursor={{ stroke: "#d4b78a", strokeDasharray: "3 3" }}
                    contentStyle={{
                      background: "#fffdfa",
                      border: "1px solid #ecd9bd",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelFormatter={(v) => (v === "now" ? "Latest observed" : shortMonth(v as string))}
                    formatter={(v, name) => [`${Number(v).toFixed(2)}%`, String(name ?? "")]}
                  />
                  <ReferenceLine y={lastRepo} stroke="#a7beae" strokeDasharray="4 4" />
                  <Area
                    type="monotone"
                    dataKey="upper"
                    stroke="transparent"
                    fill="url(#bandFill)"
                    isAnimationActive
                    animationDuration={600}
                  />
                  <Area
                    type="monotone"
                    dataKey="lower"
                    stroke="transparent"
                    fill="#fbf6ee"
                    isAnimationActive
                    animationDuration={600}
                  />
                  <Area
                    type="monotone"
                    dataKey="forecast"
                    stroke="url(#lineFill)"
                    strokeWidth={2.4}
                    fill="transparent"
                    isAnimationActive
                    animationDuration={700}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <Table points={result.points} model={model} />
            {result.notes && (
              <p className="mt-5 text-xs text-[var(--ink-mute)] leading-relaxed">
                {result.notes}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Headline({ points, lastRepo }: { points: ForecastPoint[]; lastRepo: number }) {
  const next = points[0];
  const last = points[points.length - 1];
  const delta = last.forecast - lastRepo;
  const sign = delta >= 0 ? "+" : "";
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      <Card label="Next month" value={`${next.forecast.toFixed(2)}%`} sub={shortMonth(next.month)} />
      <Card
        label={`In ${points.length} mo.`}
        value={`${last.forecast.toFixed(2)}%`}
        sub={shortMonth(last.month)}
      />
      <Card
        label="Cumulative move"
        value={`${sign}${delta.toFixed(2)} pp`}
        sub={delta >= 0 ? "Tightening bias" : "Easing bias"}
        accent={delta >= 0}
      />
    </div>
  );
}

function Card({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "bg-[var(--primary-soft)]/40 border-[var(--primary)]/30" : "bg-[var(--surface-2)] border-[var(--border)]"}`}>
      <div className="text-[10px] uppercase tracking-widest text-[var(--ink-mute)]">
        {label}
      </div>
      <div className="font-serif text-[28px] mt-0.5 text-[var(--ink)]">{value}</div>
      <div className="text-[11px] text-[var(--ink-2)] mt-1 inline-flex items-center gap-1">
        <TrendingUp size={11} /> {sub}
      </div>
    </div>
  );
}

function Table({ points, model }: { points: ForecastPoint[]; model: ModelKind }) {
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--surface-2)] text-[10px] uppercase tracking-widest text-[var(--ink-mute)]">
          <tr>
            <th className="text-left px-4 py-2.5 font-medium">Month</th>
            <th className="text-right px-4 py-2.5 font-medium">Forecast</th>
            <th className="text-right px-4 py-2.5 font-medium">95% CI</th>
            {model === "hybrid" && (
              <>
                <th className="text-right px-4 py-2.5 font-medium">ARDL</th>
                <th className="text-right px-4 py-2.5 font-medium">XGB Δ</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {points.map((p, i) => (
            <tr
              key={p.month}
              className={`${i % 2 ? "bg-[var(--surface-2)]/40" : "bg-[var(--surface)]"} border-t border-[var(--border)]`}
            >
              <td className="px-4 py-2.5 text-[var(--ink-2)]">{shortMonth(p.month)}</td>
              <td className="px-4 py-2.5 text-right font-serif text-[var(--ink)]">
                {p.forecast.toFixed(2)}%
              </td>
              <td className="px-4 py-2.5 text-right text-[var(--ink-mute)] tabular-nums">
                {fmtNum(p.lower ?? 0)} – {fmtNum(p.upper ?? 0)}
              </td>
              {model === "hybrid" && (
                <>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[var(--ink-2)]">
                    {(p.contribution?.ardl ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[var(--accent)]">
                    {((p.contribution?.xgb_residual ?? 0) >= 0 ? "+" : "")}
                    {(p.contribution?.xgb_residual ?? 0).toFixed(2)}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pulse() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-12 h-12">
        <motion.span
          className="absolute inset-0 rounded-full bg-[var(--primary)]/20"
          animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
        />
        <motion.span
          className="absolute inset-2 rounded-full bg-[var(--primary)]/30"
          animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0.2, 0.7] }}
          transition={{ repeat: Infinity, duration: 1.6, delay: 0.2 }}
        />
        <span className="absolute inset-4 rounded-full bg-[var(--primary)]" />
      </div>
      <div className="text-sm">Crunching coefficients…</div>
    </div>
  );
}
