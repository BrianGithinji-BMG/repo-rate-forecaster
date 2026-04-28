"use client";

import { motion } from "framer-motion";
import {
  Database,
  Sigma,
  Sprout,
  GitMerge,
  Gauge,
  Clock3,
} from "lucide-react";

const STEPS = [
  {
    icon: <Database size={18} />,
    title: "Monthly CBK data, 2000–2024",
    body:
      "Repo rate, headline inflation, USD/KSH, and broad money M2. ~288 monthly observations split 70/30 into train and test.",
  },
  {
    icon: <Gauge size={18} />,
    title: "Stationarity & lag selection",
    body:
      "ADF tests show a mix of I(0) and I(1) variables — perfect for ARDL. Lag order chosen by AIC/BIC/HQIC: ARDL(6, 3, 1).",
  },
  {
    icon: <Sigma size={18} />,
    title: "ARDL baseline",
    body:
      "Linear model with lags of repo, inflation, and log(M2). Exact, transparent, and the same 13 coefficients are baked into this app.",
  },
  {
    icon: <Sprout size={18} />,
    title: "XGBoost on residuals",
    body:
      "A small gradient-boosted regressor learns whatever non-linear pattern the ARDL residuals leave on the table.",
  },
  {
    icon: <GitMerge size={18} />,
    title: "Hybrid forecast",
    body:
      "Final repo rate = ARDL prediction + XGBoost residual correction. Best-of-both-worlds on the test set.",
  },
  {
    icon: <Clock3 size={18} />,
    title: "Recursive multi-step forecast",
    body:
      "For h-step horizons, predicted values feed back into lag positions, exactly like in the notebook's dynamic forecast.",
  },
];

export function Methodology() {
  return (
    <section id="methodology" className="py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <span className="chip">Methodology</span>
            <h2 className="font-serif text-[36px] sm:text-[44px] leading-[1.05] tracking-tight mt-4">
              From CBK statistics to a live forecast.
            </h2>
            <p className="mt-4 text-[var(--ink-2)] leading-relaxed">
              The pipeline mirrors the BFE 4.2 dissertation step by step — same
              variables, same lag structure, same hyperparameters. The only
              difference is that you can now point it at any month you like.
            </p>

            <div className="mt-6 card p-5 text-sm">
              <div className="font-serif text-[18px] mb-3 text-[var(--ink)]">
                ARDL equation
              </div>
              <pre className="overflow-x-auto text-[12.5px] leading-relaxed text-[var(--ink-2)] whitespace-pre">
{`repo_t = -1.95
       + 0.59·repo_{t-1} + 0.07·repo_{t-2} − 0.01·repo_{t-3}
       + 0.17·repo_{t-4} + 0.00·repo_{t-5} + 0.08·repo_{t-6}
       + 0.20·infl_t  − 0.21·infl_{t-1}
       − 0.01·infl_{t-2} + 0.11·infl_{t-3}
       − 14.63·logM2_t + 14.79·logM2_{t-1}`}
              </pre>
            </div>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="card p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="grid place-items-center w-9 h-9 rounded-xl bg-[var(--primary-soft)] text-[var(--primary-deep)] shrink-0">
                    {s.icon}
                  </span>
                  <div>
                    <div className="text-[15px] font-medium text-[var(--ink)]">
                      {s.title}
                    </div>
                    <p className="text-[13px] text-[var(--ink-2)] leading-relaxed mt-1">
                      {s.body}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
