"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ModelKind } from "@/lib/types";
import { Cpu, Network, GitMerge } from "lucide-react";

const TABS: {
  id: ModelKind;
  label: string;
  icon: React.ReactNode;
  caption: string;
}[] = [
  {
    id: "ardl",
    label: "ARDL",
    icon: <Network size={16} />,
    caption: "Linear, transparent, instant.",
  },
  {
    id: "xgboost",
    label: "XGBoost",
    icon: <Cpu size={16} />,
    caption: "Gradient-boosted trees on raw macro features.",
  },
  {
    id: "hybrid",
    label: "Hybrid",
    icon: <GitMerge size={16} />,
    caption: "ARDL forecast + XGBoost residual correction.",
  },
];

export function ModelTabs({
  value,
  onChange,
}: {
  value: ModelKind;
  onChange: (v: ModelKind) => void;
}) {
  const active = TABS.find((t) => t.id === value)!;
  return (
    <div>
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            data-active={t.id === value}
            className="tab flex items-center gap-2 text-sm flex-1 justify-center"
            onClick={() => onChange(t.id)}
          >
            {t.id === value && (
              <motion.span
                layoutId="tab-bg"
                className="absolute inset-0 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm"
                style={{ zIndex: -1 }}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              {t.icon} {t.label}
            </span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={active.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="mt-3 text-sm text-[var(--ink-mute)]"
        >
          {active.caption}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
