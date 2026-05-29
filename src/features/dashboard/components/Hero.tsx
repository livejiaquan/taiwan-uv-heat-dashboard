import { RefreshCw, Sun } from "lucide-react";
import { formatRelativeAge, formatTime } from "../../../lib/format";
import type { DashboardData } from "../../../lib/types";

interface HeroProps {
  data: DashboardData;
  refreshing: boolean;
  onRefresh: () => void;
}

export function Hero({ data, refreshing, onRefresh }: HeroProps) {
  const updateTone = data.stats.stale ? "text-heat-700" : "text-reef-700";

  return (
    <header className="relative overflow-hidden pb-12 pt-8 sm:pt-10">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(245,158,11,0.20),rgba(20,184,166,0.15)_45%,rgba(239,68,68,0.13))]" />
      <div className="sun-rays absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1 text-sm font-bold text-sun-600 shadow-sm backdrop-blur">
              <Sun className="h-4 w-4" aria-hidden="true" />
              Taiwan CWA Open Data
            </div>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-ink-900 sm:text-5xl">
              台灣 UV 與高溫風險儀表板
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink-700">
              快速判斷現在出門的紫外線、悶熱與熱傷害風險，並找出最需要避開或較適合戶外活動的縣市。
            </p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-card backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-500">
                  Latest Update
                </p>
                <p className={`mt-1 text-lg font-black ${updateTone}`}>
                  {formatTime(data.stats.latestUpdate)}
                </p>
                <p className="mt-1 text-xs font-semibold text-ink-500">
                  {formatRelativeAge(data.stats.latestUpdate)} · {data.stats.sourceSummary}
                </p>
              </div>
              <button
                className="icon-button"
                onClick={onRefresh}
                disabled={refreshing}
                title="重新整理資料"
                aria-label="重新整理資料"
              >
                <RefreshCw
                  className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
