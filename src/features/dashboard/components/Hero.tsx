import { ArrowDown, RefreshCw, Sun } from "lucide-react";
import { FamilyMark } from "../../../components/FamilyMark";
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
    <header className="relative overflow-hidden border-b border-line pb-10 pt-5 sm:pt-6">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(234,106,34,0.12),rgba(15,118,110,0.09)_45%,rgba(225,29,72,0.08))]" />
      <div className="sun-rays absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="網站識別" className="flex items-center justify-between gap-4">
          <FamilyMark />
          <span className="hidden rounded-full border border-line bg-white/65 px-3 py-1 text-xs font-bold text-ink-500 sm:inline-flex">
            官方來源優先 · 不以預報冒充現在
          </span>
        </nav>
        <div className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sun-300 bg-white/80 px-3 py-1 text-sm font-bold text-sun-600 shadow-sm backdrop-blur">
              <Sun className="h-4 w-4" aria-hidden="true" />
              CWA 官方資料 · 時間語意分列
            </div>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-ink-900 sm:text-5xl">
              現在適合外出嗎？先看 UV，再看熱感
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink-700">
              以有時效的測站觀測判讀現在曝曬風險；體感熱與 36 小時預報分開呈現，讓你能立刻採取防護行動。
            </p>
            <a className="btn-primary mt-5" href="#risk-map">
              查看縣市風險
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <div className="rounded-2xl border border-line bg-white/85 p-4 shadow-card backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-500">
                  資料新鮮度
                </p>
                <p className={`mt-1 text-lg font-black ${updateTone}`}>
                  {formatTime(data.stats.latestUpdate)}
                </p>
                <p className="mt-1 text-xs font-semibold text-ink-500">
                  {formatRelativeAge(data.stats.latestUpdate)} · 各縣市仍須看個別時間
                </p>
                <p className="mt-2 text-xs font-bold text-ink-700">
                  {data.stats.stale ? "含過期觀測，請留意標示" : "未過期資料才參與目前判讀"}
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
