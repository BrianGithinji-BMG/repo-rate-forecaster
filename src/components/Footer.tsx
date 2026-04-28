export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-20">
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10 flex flex-wrap items-end justify-between gap-6 text-sm">
        <div>
          <div className="font-serif text-[20px] tracking-tight text-[var(--ink)]">
            Repo Rate Forecaster
          </div>
          <p className="text-[var(--ink-mute)] mt-1 max-w-md">
            Built on the BFE 4.2 research project &mdash; &ldquo;Predicting
            Repurchase Rates Using a Hybrid ARDL&ndash;XGBoost Model&rdquo;.
          </p>
        </div>
        <div className="text-[var(--ink-mute)] text-xs">
          Data: Central Bank of Kenya · KNBS &mdash; Forecasts are illustrative,
          not investment advice.
        </div>
      </div>
    </footer>
  );
}
