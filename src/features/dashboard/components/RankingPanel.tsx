import { Flame } from "lucide-react";
import { RiskPill } from "../../../components/RiskPill";
import { formatInteger, formatNumber } from "../../../lib/format";
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
  const max = Math.max(...counties.map((item) => item.overallScore), 1);

  return (
    <section className="rounded-2xl border border-white/75 bg-white/80 p-5 shadow-card backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-heat-700">Risk Ranking</p>
          <h2 className="mt-1 text-2xl font-black text-ink-900">目前最需要避開的區域</h2>
        </div>
        <Flame className="h-8 w-8 text-heat-700" aria-hidden="true" />
      </div>
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
              UV {formatInteger(county.uvIndex)}
              <br />
              {formatNumber(Math.max(county.heatIndex ?? -1, county.forecastMaxTemperature ?? -1))}
              °C
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
