import { Flame } from "lucide-react";
import { RiskPill } from "../../../components/RiskPill";
import { formatInteger, formatNumber } from "../../../lib/format";
import type { CountyRisk } from "../../../lib/types";
import { toneStyles } from "../constants";

interface RankingPanelProps {
  counties: CountyRisk[];
  demo: boolean;
  selectedCounty?: string;
  onSelect: (county: string) => void;
}

export function RankingPanel({
  counties,
  demo,
  selectedCounty,
  onSelect,
}: RankingPanelProps) {
  const max = Math.max(...counties.map((item) => item.overallScore), 1);

  return (
    <section className="rounded-2xl border border-white/75 bg-white/80 p-5 shadow-card backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-heat-700">Risk Ranking</p>
          <h2 className="mt-1 text-2xl font-black text-ink-900">{demo ? "示範風險排行" : "已知風險由高到低"}</h2>
        </div>
        <Flame className="h-8 w-8 text-heat-700" aria-hidden="true" />
      </div>
      <p className="mt-2 text-sm text-ink-500">{demo ? "人工範例，不代表目前天氣。" : "依可用觀測、當日日最大 UV 與預報排序，未列入不代表低風險。"}</p>
      {!counties.length ? <p className="mt-4 text-sm text-ink-500">目前沒有可評分的資料。</p> : null}
      <div className="mt-5 grid gap-3">
        {counties.map((county, index) => (
          <button
            key={county.county}
            className={`ranking-row ${county.county === selectedCounty ? "is-active" : ""}`}
            onClick={() => onSelect(county.county)}
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink-900 text-sm font-black text-white">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="flex items-center gap-2">
                <strong className="text-base text-ink-900">{county.county}</strong>
                <RiskPill level={county.overallLevel} label={county.overallLevel.shortLabel} />
              </span>
              <span className="mt-2 block h-2 overflow-hidden rounded-full bg-ink-100">
                <span
                  className={`block h-full rounded-full bg-gradient-to-r ${toneStyles[county.overallLevel.tone]}`}
                  style={{ width: `${Math.max(8, (county.overallScore / max) * 100)}%` }}
                />
              </span>
            </span>
            <span className="text-right text-sm font-bold text-ink-500">
              {county.uvSource === "dailyMax" ? "UV 日最大" : "UV"} {formatInteger(county.uvIndex)}
              <br />
              {formatNumber(Math.max(county.heatIndex ?? -Infinity, county.forecastMaxTemperature ?? -Infinity))}
              °C
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
