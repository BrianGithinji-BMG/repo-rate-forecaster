"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  ArrowUpRight,
  RotateCcw,
  Calendar,
  TrendingUp,
  Coins,
  Banknote,
  History,
  WandSparkles,
} from "lucide-react";
import type { ModelKind } from "@/lib/types";
import { RECENT_DEFAULTS } from "@/lib/ardl";

export interface FormState {
  inflation: number;
  usd_ksh: number;
  m2: number;
  repo_lags: number[]; // 6
  inflation_lags: number[]; // 3
  m2_lags: number[]; // 1
  horizon: number;
}

const PRESETS: { label: string; tag: string; state: FormState }[] = [
  {
    label: "Late-2024 snapshot",
    tag: "default",
    state: {
      inflation: RECENT_DEFAULTS.inflation,
      usd_ksh: RECENT_DEFAULTS.usd_ksh,
      m2: RECENT_DEFAULTS.m2,
      repo_lags: [...RECENT_DEFAULTS.repo_lags],
      inflation_lags: [...RECENT_DEFAULTS.inflation_lags],
      m2_lags: [...RECENT_DEFAULTS.m2_lags],
      horizon: 6,
    },
  },
  {
    label: "Easing cycle scenario",
    tag: "−inflation, −rates",
    state: {
      inflation: 4.5,
      usd_ksh: 130,
      m2: 4_700_000,
      repo_lags: [10.75, 11.25, 11.75, 12.0, 12.5, 12.75],
      inflation_lags: [4.7, 5.0, 5.5],
      m2_lags: [4_650_000],
      horizon: 6,
    },
  },
  {
    label: "Inflation shock scenario",
    tag: "+inflation, +rates",
    state: {
      inflation: 9.0,
      usd_ksh: 145,
      m2: 4_500_000,
      repo_lags: [13.5, 13.0, 12.75, 12.75, 12.5, 12.25],
      inflation_lags: [8.4, 7.9, 7.2],
      m2_lags: [4_450_000],
      horizon: 12,
    },
  },
];

interface Props {
  value: FormState;
  onChange: (s: FormState) => void;
  model: ModelKind;
  onSubmit: () => void;
  loading: boolean;
  onUploadFile: (f: File) => void;
  uploadedFile: File | null;
}

export function InputForm({
  value,
  onChange,
  model,
  onSubmit,
  loading,
  onUploadFile,
  uploadedFile,
}: Props) {
  const [advanced, setAdvanced] = useState(false);

  const set = (patch: Partial<FormState>) => onChange({ ...value, ...patch });
  const setRepoLag = (i: number, v: number) => {
    const arr = [...value.repo_lags];
    arr[i] = v;
    set({ repo_lags: arr });
  };
  const setInflLag = (i: number, v: number) => {
    const arr = [...value.inflation_lags];
    arr[i] = v;
    set({ inflation_lags: arr });
  };

  const needsCsv = model !== "ardl";
  const canSubmit = !loading && (!needsCsv || uploadedFile);

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div>
        <Label icon={<WandSparkles size={14} />}>Quick presets</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(p.state)}
              className="group btn-ghost text-left rounded-xl px-3.5 py-2.5 text-sm flex items-center gap-3"
            >
              <div>
                <div className="font-medium text-[var(--ink)]">{p.label}</div>
                <div className="text-[11px] text-[var(--ink-mute)]">
                  {p.tag}
                </div>
              </div>
              <ArrowUpRight
                size={14}
                className="text-[var(--ink-mute)] group-hover:text-[var(--primary)] transition-colors"
              />
            </button>
          ))}
        </div>
      </div>

      <div className="divider" />

      {/* Current month inputs */}
      <div className="grid sm:grid-cols-2 gap-4">
        <NumberField
          icon={<TrendingUp size={14} />}
          label="Current inflation (% YoY)"
          value={value.inflation}
          onChange={(v) => set({ inflation: v })}
          step={0.1}
          suffix="%"
        />
        <NumberField
          icon={<Coins size={14} />}
          label="USD / KSH"
          value={value.usd_ksh}
          onChange={(v) => set({ usd_ksh: v })}
          step={0.5}
        />
        <NumberField
          icon={<Banknote size={14} />}
          label="Money supply M2 (KES Mn)"
          value={value.m2}
          onChange={(v) => set({ m2: v })}
          step={50_000}
        />
        <NumberField
          icon={<Calendar size={14} />}
          label="Forecast horizon (months)"
          value={value.horizon}
          onChange={(v) => set({ horizon: Math.max(1, Math.min(12, Math.round(v))) })}
          step={1}
          min={1}
          max={12}
        />
      </div>

      <button
        type="button"
        onClick={() => setAdvanced((s) => !s)}
        className="text-sm text-[var(--primary-deep)] hover:underline inline-flex items-center gap-1.5"
      >
        <History size={14} />
        {advanced ? "Hide" : "Edit"} historical lags & paths
      </button>

      {advanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-5"
        >
          <div>
            <Label>Repo rate lags (most recent → oldest)</Label>
            <div className="mt-2 grid grid-cols-3 sm:grid-cols-6 gap-2">
              {value.repo_lags.map((v, i) => (
                <NumberField
                  key={i}
                  compact
                  label={`t-${i + 1}`}
                  value={v}
                  onChange={(nv) => setRepoLag(i, nv)}
                  step={0.05}
                />
              ))}
            </div>
          </div>
          <div>
            <Label>Inflation lags</Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {value.inflation_lags.map((v, i) => (
                <NumberField
                  key={i}
                  compact
                  label={`t-${i + 1}`}
                  value={v}
                  onChange={(nv) => setInflLag(i, nv)}
                  step={0.05}
                  suffix="%"
                />
              ))}
            </div>
          </div>
          <div>
            <Label>M2 lag (KES Mn, t-1)</Label>
            <div className="mt-2">
              <NumberField
                compact
                label=""
                value={value.m2_lags[0]}
                onChange={(nv) => set({ m2_lags: [nv] })}
                step={50_000}
              />
            </div>
          </div>
        </motion.div>
      )}

      {needsCsv && (
        <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm font-medium text-[var(--ink)]">
                Upload monthly dataset
              </div>
              <div className="text-xs text-[var(--ink-mute)] mt-1 max-w-md">
                CSV or XLSX with columns{" "}
                <code className="text-[var(--primary-deep)]">date</code>,{" "}
                <code className="text-[var(--primary-deep)]">repo</code>,{" "}
                <code className="text-[var(--primary-deep)]">inflation</code>,{" "}
                <code className="text-[var(--primary-deep)]">usd_ksh</code>,{" "}
                <code className="text-[var(--primary-deep)]">m2</code>. The
                XGBoost models train on this dataset before forecasting.
              </div>
            </div>
            <label className="btn-ghost rounded-full px-4 py-2 text-sm cursor-pointer">
              {uploadedFile ? "Change file" : "Choose file"}
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUploadFile(f);
                }}
              />
            </label>
          </div>
          {uploadedFile && (
            <div className="mt-3 text-xs text-[var(--ink-2)]">
              Loaded:{" "}
              <span className="text-[var(--ink)] font-medium">
                {uploadedFile.name}
              </span>{" "}
              <span className="text-[var(--ink-mute)]">
                ({Math.round(uploadedFile.size / 1024)} KB)
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-full text-[15px] font-medium"
        >
          {loading ? "Forecasting…" : `Run ${model.toUpperCase()} forecast`}
          {!loading && <ArrowUpRight size={16} />}
        </button>
        <button
          type="button"
          onClick={() => onChange(PRESETS[0].state)}
          className="btn-ghost inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm"
        >
          <RotateCcw size={14} /> Reset to defaults
        </button>
      </div>
    </div>
  );
}

function Label({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[var(--ink-mute)] font-medium">
      {icon}
      {children}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  suffix,
  icon,
  compact,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  icon?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <label className="block">
      {label && (
        <div
          className={`flex items-center gap-1.5 ${compact ? "text-[10px]" : "text-[11px]"} uppercase tracking-widest text-[var(--ink-mute)] font-medium mb-1.5`}
        >
          {icon}
          {label}
        </div>
      )}
      <div className="relative">
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`field ${compact ? "py-1.5 px-2.5 text-sm" : ""}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--ink-mute)]">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}
