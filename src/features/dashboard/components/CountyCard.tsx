import { Clock3, RadioTower, Sun, ThermometerSun } from "lucide-react";
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
      type="button"
      className={`county-card ${active ? "is-active" : ""}`}
      onClick={onSelect}
      aria-pressed={active}
      aria-label={`查看 ${county.county} 的 UV 與高溫風險`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="text-left">
          <span className="text-xs font-bold text-ink-500">{county.regionLabel}</span>
          <strong className="mt-0.5 block text-lg font-black text-ink-900">
            {county.county}
          </strong>
        </span>
        <RiskPill level={county.overallLevel} label={county.overallLevel.shortLabel} />
      </span>

      <span className="mt-3 grid grid-cols-2 gap-2">
        <span className="mini-metric">
          <Sun className="h-4 w-4 text-sun-600" aria-hidden="true" />
          <span>
            <span className="block text-xs font-bold text-ink-500">UV</span>
            <span className="text-base font-black text-ink-900">{formatInteger(county.uvIndex)}</span>
          </span>
        </span>
        <span className="mini-metric">
          <ThermometerSun className="h-4 w-4 text-heat-700" aria-hidden="true" />
          <span>
            <span className="block text-xs font-bold text-ink-500">熱感</span>
            <span className="text-base font-black text-ink-900">{formatNumber(heatValue)}°</span>
          </span>
        </span>
      </span>

      <span
        className="mt-3 block h-1.5 overflow-hidden rounded-full bg-ink-100"
        aria-label={`風險分數 ${formatInteger(county.overallScore)}`}
      >
        <span
          className={`block h-full rounded-full bg-gradient-to-r ${toneStyles[county.overallLevel.tone]}`}
          style={{ width: `${Math.min(100, Math.max(10, county.overallScore / 1.8))}%` }}
        />
      </span>

      <span className="mt-3 flex flex-wrap gap-1.5">
        <span className="info-chip">
          <RadioTower className="h-3.5 w-3.5" aria-hidden="true" />
          {county.stationCount ? `${county.stationCount} 測站` : "測站暫缺"}
        </span>
        <span className="info-chip">
          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          {formatRelativeAge(county.observedAt)}
        </span>
      </span>
    </button>
  );
}
