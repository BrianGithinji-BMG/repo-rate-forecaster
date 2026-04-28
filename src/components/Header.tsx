"use client";

import { motion } from "framer-motion";
import { ChartLine, Star } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[var(--bg)]/70 border-b border-[var(--border)]">
      <div className="max-w-6xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex items-center gap-3"
        >
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white shadow-sm">
            <ChartLine size={18} strokeWidth={2.4} />
          </span>
          <div className="leading-tight">
            <div className="font-serif text-[18px] tracking-tight text-[var(--ink)]">
              Repo Rate Forecaster
            </div>
            <div className="text-[11px] text-[var(--ink-mute)] tracking-wide uppercase">
              Hybrid ARDL × XGBoost — Kenya CBR
            </div>
          </div>
        </motion.div>

        <motion.nav
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
          className="hidden md:flex items-center gap-1 text-sm text-[var(--ink-2)]"
        >
          <a className="px-3 py-2 hover:text-[var(--primary-deep)] transition-colors" href="#forecast">
            Forecast
          </a>
          <a className="px-3 py-2 hover:text-[var(--primary-deep)] transition-colors" href="#models">
            Models
          </a>
          <a className="px-3 py-2 hover:text-[var(--primary-deep)] transition-colors" href="#methodology">
            Methodology
          </a>
          <a
            className="ml-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg btn-ghost text-sm"
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
          >
            <Star size={15} /> GitHub
          </a>
        </motion.nav>
      </div>
    </header>
  );
}
