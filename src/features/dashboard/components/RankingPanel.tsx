import { Flame } from "lucide-react";
import { RiskPill } from "../../../components/RiskPill";
import { formatInteger } from "../../../lib/format";
import type { CountyRisk } from "../../../lib/types";
import { toneStyles } from "../constants";

interface RankingPanelProps {
  counties: CountyRisk[];
  selectedCounty?: string;
  onSelect: (county: string) => void;
}

export function RankingPanel({
  counties,
  selectedCounty,
  onSelect,
}: RankingPanelProps) {
  const ranked = counties.filter((item) => item.priorityScore >= 0);
  const max = Math.max(...ranked.map((item) => item.priorityScore), 1);

  return (
    <section className="rounded-2xl border border-line bg-white/80 p-5 shadow-card backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-heat-700">Observed UV Ranking</p>
          <h2 className="mt-1 text-2xl font-black text-ink-900">目前 UV 觀測較高的縣市</h2>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            只比較未超過 45 分鐘的有效測站觀測；不是整個縣市的精確曝曬值。
          </p>
        </div>
        <Flame className="h-8 w-8 text-heat-700" aria-hidden="true" />
      </div>
      <div className="mt-5 grid gap-3">
        {ranked.map((county, index) => (
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
                <RiskPill level={county.priorityLevel} label={county.priorityLevel.shortLabel} />
              </span>
              <span className="mt-2 block h-2 overflow-hidden rounded-full bg-ink-100">
                <span
                  className={`block h-full rounded-full bg-gradient-to-r ${toneStyles[county.priorityLevel.tone]}`}
                  style={{ width: `${Math.max(8, (county.priorityScore / max) * 100)}%` }}
                />
              </span>
            </span>
            <span className="text-right text-sm font-bold text-ink-500">
              UV {formatInteger(county.uvIndex)}
            </span>
          </button>
        ))}
        {!ranked.length ? (
          <p className="rounded-xl border border-ink-100 bg-ink-100/40 p-4 text-sm leading-6 text-ink-500">
            目前沒有足以進行排序的未過期 UV 觀測。
          </p>
        ) : null}
      </div>
    </section>
  );
}
