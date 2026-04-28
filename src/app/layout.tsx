import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-stack",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif-stack",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: "Repo Rate Forecaster — Hybrid ARDL × XGBoost",
  description:
    "Forecast Kenya's monthly Central Bank Repo Rate with a hybrid ARDL + XGBoost model. Built on the BFE 4.2 research project.",
  openGraph: {
    title: "Repo Rate Forecaster",
    description:
      "Hybrid ARDL × XGBoost forecasts of Kenya's repo rate, trained on 25 years of CBK monthly data.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="grain min-h-full flex flex-col">
        <div className="relative z-[1] flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
