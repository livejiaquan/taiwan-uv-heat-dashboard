import { RefreshCw, Sun } from "lucide-react";
import { FamilyMark } from "../../../components/FamilyMark";
import { formatRelativeAge, formatTime } from "../../../lib/format";
import type { DashboardData } from "../../../lib/types";

interface HeroProps {
  data: DashboardData;
  refreshing: boolean;
  onRefresh: () => void;
}

export function Hero({ data, refreshing, onRefresh }: HeroProps) {
  const demo = data.stats.dataMode === "demo";
  const updateTone = data.stats.hasLimitedCoverage ? "text-heat-700" : "text-reef-700";

  return (
    <header className="relative overflow-hidden border-b border-line pb-10 pt-5 sm:pt-6">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(234,106,34,0.12),rgba(15,118,110,0.09)_45%,rgba(225,29,72,0.08))]" />
      <div className="sun-rays absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="網站識別" className="flex items-center justify-between gap-4"><FamilyMark /><span className="hidden rounded-full border border-line bg-white/65 px-3 py-1 text-xs font-bold text-ink-500 sm:inline-flex">來源與更新時間分列</span></nav>
        <div className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1 text-sm font-bold text-sun-600 shadow-sm backdrop-blur">
              <Sun className="h-4 w-4" aria-hidden="true" />
              {demo ? "DEMO · 非即時資料" : "Taiwan CWA Open Data"}
            </div>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-ink-900 sm:text-5xl">
              {demo ? "探索台灣 UV 與高溫風險示範" : "外出前，先確認 UV 與熱風險"}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink-700">
              查看縣市 UV、高溫與資料狀態；觀測、日最大值、預報與示範資料分別標示。
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-white/85 p-4 shadow-card backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-500">
                  {demo ? "資料模式" : "最新可用觀測（台灣時間）"}
                </p>
                <p className={`mt-1 text-lg font-black ${updateTone}`}>
                  {demo ? "示範資料・無觀測時間" : formatTime(data.stats.latestUpdate)}
                </p>
                <p className="mt-1 text-xs font-semibold text-ink-500">
                  {demo ? "僅供功能展示" : `${formatRelativeAge(data.stats.latestUpdate)} · ${data.stats.currentCountyCount}/${data.stats.totalCounties} 縣市觀測齊全`} · {data.stats.sourceSummary}
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
