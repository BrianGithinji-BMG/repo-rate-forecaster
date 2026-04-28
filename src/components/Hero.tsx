"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowDown } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-16 pb-12 lg:pt-24 lg:pb-20">
      <div className="max-w-6xl mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-10 items-end">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-8"
        >
          <motion.span
            className="chip mb-5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Sparkles size={12} /> BFE 4.2 — Research deployed
          </motion.span>

          <h1 className="font-serif text-[42px] sm:text-[56px] lg:text-[72px] leading-[0.95] tracking-tight text-[var(--ink)]">
            Forecast Kenya&rsquo;s{" "}
            <span className="italic text-[var(--primary)]">repo rate</span>
            <br />
            with a hybrid model.
          </h1>

          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-[var(--ink-2)]">
            An interactive tool built on the{" "}
            <span className="text-[var(--ink)] font-medium">ARDL × XGBoost</span>{" "}
            forecasting framework from my BFE 4.2 dissertation. Plug in current
            macro indicators, pick a horizon, and get a month-by-month forecast
            with uncertainty bands.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <a
              href="#forecast"
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-full text-[15px] font-medium"
            >
              Run a forecast <ArrowDown size={16} />
            </a>
            <a
              href="#methodology"
              className="btn-ghost inline-flex items-center gap-2 px-6 py-3 rounded-full text-[15px] font-medium"
            >
              How it works
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-4"
        >
          <div className="card p-6 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-[var(--primary-soft)] blur-2xl opacity-70" />
            <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-[var(--accent-soft)] blur-2xl opacity-70" />
            <div className="relative">
              <div className="text-xs uppercase tracking-widest text-[var(--ink-mute)]">
                Test set RMSE
              </div>
              <div className="font-serif text-[64px] leading-none mt-2 text-[var(--ink)]">
                2.44
              </div>
              <div className="mt-1 text-sm text-[var(--ink-2)]">
                Hybrid ARDL+XGBoost · 25 yrs CBK monthly data
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
                <Stat label="MAE" value="2.06" />
                <Stat label="MAPE" value="34.2%" />
                <Stat label="MSE" value="5.98" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-widest text-[var(--ink-mute)]">
        {label}
      </div>
      <div className="font-serif text-[20px] text-[var(--ink)] mt-0.5">
        {value}
      </div>
    </div>
  );
}
