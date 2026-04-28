# Repo Rate Forecaster — Hybrid ARDL × XGBoost

An interactive web app that forecasts Kenya's monthly Central Bank Repo Rate
using the hybrid **ARDL + XGBoost** framework from the BFE 4.2 dissertation
*"Predicting Repurchase Rates Using a Hybrid ARDL–XGBoost Model"*.

## Features

- **Three models in one UI** — pick ARDL, XGBoost, or the Hybrid combination
- **Live forecasts** with confidence bands and per-month contribution breakdown
- **Quick presets** — late-2024 baseline, easing scenario, inflation-shock scenario
- **Editable lag history** so you can stress-test the model against custom paths
- **Warm light theme**, Framer Motion micro-interactions, Recharts visualisations

## Tech

- **Next.js 16** App Router + TypeScript + Tailwind 4
- **Framer Motion** for animation
- **Recharts** for the forecast chart
- **Vercel Python serverless** for XGBoost & Hybrid (uses `xgboost`, `pandas`, `numpy`)
- ARDL coefficients are hardcoded from the fitted model — pure ARDL forecasts
  run client-side with zero dependencies

## Local development

```bash
npm install
npm run dev
```

For XGBoost / Hybrid forecasts you'll be asked to upload a CSV/XLSX with these
columns:

```
date, repo, inflation, usd_ksh, m2
```

This is the same shape as `Combined_data.xlsx` from the original notebook.

## Deploy

```bash
vercel --prod
```

The Python serverless function lives in `api/forecast.py` with its own
`requirements.txt`.
