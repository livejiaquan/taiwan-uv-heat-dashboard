import { Sun, ThermometerSun } from "lucide-react";
import { RiskPill } from "../../../components/RiskPill";
import { formatInteger, formatNumber, formatRelativeAge } from "../../../lib/format";
import type { CountyRisk } from "../../../lib/types";
import { toneStyles } from "../constants";

interface CountyCardProps {
  county: CountyRisk;
  active: boolean;
  onSelect: () => void;
}

export function CountyCard({ county, active, onSelect }: CountyCardProps) {
  const heatValue = Math.max(
    county.heatIndex ?? -Infinity,
    county.forecastMaxTemperature ?? -Infinity,
    county.observedTemperature ?? -Infinity,
  );

  return (
    <button
      className={`county-card ${active ? "is-active" : ""}`}
      onClick={onSelect}
      aria-pressed={active}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="text-left">
          <span className="text-xs font-bold text-ink-500">{county.regionLabel}</span>
          <strong className="mt-1 block text-xl font-black text-ink-900">
            {county.county}
          </strong>
        </span>
        <RiskPill level={county.overallLevel} label={county.overallLevel.shortLabel} />
      </span>

      <span className="mt-4 grid grid-cols-2 gap-3">
        <span className="mini-metric">
          <Sun className="h-4 w-4 text-sun-600" />
          <span>
            <span className="block text-xs font-bold text-ink-500">UV</span>
            <span className="text-lg font-black text-ink-900">{formatInteger(county.uvIndex)}</span>
          </span>
        </span>
        <span className="mini-metric">
          <ThermometerSun className="h-4 w-4 text-heat-700" />
          <span>
            <span className="block text-xs font-bold text-ink-500">熱指數</span>
            <span className="text-lg font-black text-ink-900">{formatNumber(heatValue)}°</span>
          </span>
        </span>
      </span>

      <span className="mt-4 block h-2 overflow-hidden rounded-full bg-ink-100">
        <span
          className={`block h-full rounded-full bg-gradient-to-r ${toneStyles[county.overallLevel.tone]}`}
          style={{ width: `${Math.min(100, Math.max(10, county.overallScore / 1.8))}%` }}
        />
      </span>
      <span className="mt-3 flex items-center justify-between text-xs font-semibold text-ink-500">
        <span>{county.stationCount ? `${county.stationCount} 測站` : "測站暫缺"}</span>
        <span>{formatRelativeAge(county.observedAt)}</span>
      </span>
    </button>
  );
}
