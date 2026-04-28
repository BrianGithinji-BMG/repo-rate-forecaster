"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ModelTabs } from "@/components/ModelTabs";
import { InputForm, type FormState } from "@/components/InputForm";
import { ForecastResults } from "@/components/ForecastResults";
import { ModelComparison } from "@/components/ModelComparison";
import { Methodology } from "@/components/Methodology";
import { Footer } from "@/components/Footer";
import { RECENT_DEFAULTS } from "@/lib/ardl";
import type { ForecastResponse, ModelKind } from "@/lib/types";

const initialState: FormState = {
  inflation: RECENT_DEFAULTS.inflation,
  usd_ksh: RECENT_DEFAULTS.usd_ksh,
  m2: RECENT_DEFAULTS.m2,
  repo_lags: [...RECENT_DEFAULTS.repo_lags],
  inflation_lags: [...RECENT_DEFAULTS.inflation_lags],
  m2_lags: [...RECENT_DEFAULTS.m2_lags],
  horizon: 6,
};

export default function Home() {
  const [model, setModel] = useState<ModelKind>("ardl");
  const [form, setForm] = useState<FormState>(initialState);
  const [result, setResult] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  async function runForecast() {
    setLoading(true);
    setError(null);
    try {
      if (model === "ardl") {
        const r = await fetch("/api/forecast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Forecast failed");
        setResult(data);
      } else {
        if (!file)
          throw new Error(
            "Upload your monthly dataset (CSV/XLSX) to run XGBoost-based forecasts.",
          );
        const fd = new FormData();
        fd.append("payload", JSON.stringify({ ...form, model }));
        fd.append("file", file);
        const r = await fetch("/api/forecast-py", { method: "POST", body: fd });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Forecast failed");
        setResult(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />

        {/* Forecast section */}
        <section
          id="forecast"
          className="pb-16 lg:pb-24 scroll-mt-20"
        >
          <div className="max-w-6xl mx-auto px-6 lg:px-10">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
              <div>
                <span className="chip">Live forecast</span>
                <h2 className="font-serif text-[32px] sm:text-[40px] tracking-tight mt-3 text-[var(--ink)]">
                  Build your forecast
                </h2>
              </div>
              <div className="text-sm text-[var(--ink-mute)] max-w-md">
                Pick a model, dial in the macro indicators you want to assume,
                and watch the projection update in real time.
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-5 card p-6 lg:p-7"
              >
                <ModelTabs value={model} onChange={setModel} />
                <div className="my-5 divider" />
                <InputForm
                  value={form}
                  onChange={setForm}
                  model={model}
                  onSubmit={runForecast}
                  loading={loading}
                  onUploadFile={setFile}
                  uploadedFile={file}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="lg:col-span-7"
              >
                <ForecastResults
                  result={result}
                  loading={loading}
                  error={error}
                  model={model}
                  lastRepo={form.repo_lags[0]}
                />
              </motion.div>
            </div>
          </div>
        </section>

        <ModelComparison />
        <Methodology />
      </main>
      <Footer />
    </>
  );
}
