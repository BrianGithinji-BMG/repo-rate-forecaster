"use client";

import { motion } from "framer-motion";
import { MODEL_METRICS } from "@/lib/ardl";
import { Cpu, Network, GitMerge, Trophy } from "lucide-react";

const ROWS = [
  { id: "ardl", label: "ARDL", icon: <Network size={14} />, color: "var(--accent)" },
  { id: "xgboost", label: "XGBoost", icon: <Cpu size={14} />, color: "var(--gold)" },
  { id: "hybrid", label: "Hybrid", icon: <GitMerge size={14} />, color: "var(--primary)" },
] as const;

export function ModelComparison() {
  const maxRmse = Math.max(
    ...ROWS.map((r) => MODEL_METRICS[r.id].test.rmse),
  );
  return (
    <section id="models" className="py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <span className="chip">Model gallery</span>
            <h2 className="font-serif text-[36px] sm:text-[44px] leading-[1.05] tracking-tight mt-4">
              Three models, one repo rate.
            </h2>
            <p className="mt-4 text-[var(--ink-2)] leading-relaxed">
              Performance numbers come straight from{" "}
              <span className="text-[var(--ink)] font-medium">Chapter Four</span>
              {" "}of the dissertation. Lower is better — the hybrid model edges
              out the others on test RMSE while staying close on train.
            </p>
          </div>

          <div className="lg:col-span-8 grid sm:grid-cols-3 gap-4">
            {ROWS.map((r, i) => {
              const m = MODEL_METRICS[r.id];
              const winner = m.test.rmse === Math.min(...ROWS.map((x) => MODEL_METRICS[x.id].test.rmse));
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="card p-5 relative overflow-hidden"
                >
                  {winner && (
                    <span className="absolute top-3 right-3 chip bg-[var(--primary-soft)] text-[var(--primary-deep)]">
                      <Trophy size={11} /> Best
                    </span>
                  )}
                  <div
                    className="inline-flex items-center gap-2 px-2 py-1 rounded-md text-[11px] font-medium uppercase tracking-widest"
                    style={{ background: "color-mix(in oklch, " + r.color + " 12%, transparent)", color: r.color }}
                  >
                    {r.icon} {r.label}
                  </div>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="font-serif text-[36px] text-[var(--ink)]">
                      {m.test.rmse.toFixed(2)}
                    </span>
                    <span className="text-xs text-[var(--ink-mute)]">test RMSE</span>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <motion.div
                      className="h-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(m.test.rmse / maxRmse) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: 0.1 + i * 0.08, ease: "easeOut" }}
                      style={{ background: r.color }}
                    />
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-3 text-[12px]">
                    <Stat label="Train RMSE" value={m.train.rmse.toFixed(2)} />
                    <Stat label="MAE" value={m.test.mae.toFixed(2)} />
                    <Stat label="MAPE" value={`${m.test.mape.toFixed(1)}%`} />
                  </dl>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-[var(--ink-mute)]">
        {label}
      </dt>
      <dd className="font-serif text-[16px] text-[var(--ink)]">{value}</dd>
    </div>
  );
}
