import { heatColor, heatInk, heatLevel, uvColor, uvInk, uvLevel } from "../../../lib/levels";
import type { CountyOutlook, DataMode, DayOutlook } from "../../../lib/types";
import { BrandMark } from "./BrandMark";

interface TopBarProps {
  counties: CountyOutlook[];
  county: CountyOutlook;
  day: DayOutlook;
  hour: number;
  mode: DataMode;
  /** True once the verdict has scrolled away; the brand gives way to a summary. */
  compact: boolean;
  onSelectCounty: (name: string) => void;
}

export function TopBar({ counties, county, day, hour, mode, compact, onSelectCounty }: TopBarProps) {
  const point = day.hours[hour];
  const ul = uvLevel(point?.uv);
  const tl = heatLevel(point?.apparent);
  const regions = [...new Set(counties.map((c) => c.regionLabel))];

  return (
    <header className={`topbar${compact ? " is-compact" : ""}`}>
      <div className="wrap">
        <div className="brand">
          <BrandMark />
          <span className="brand-name">台灣曬熱指南</span>
          <span className="mini" aria-hidden="true">
            <span className="cell-chip" style={{ background: uvColor(ul), color: uvInk(ul) }}>
              UV {point?.uv === undefined ? "--" : Math.round(point.uv)}
            </span>
            <span className="cell-chip" style={{ background: heatColor(tl), color: heatInk(tl) }}>
              {point?.apparent === undefined ? "--" : Math.round(point.apparent)}°
            </span>
          </span>
        </div>
        <span className="status-chip">
          <span className={`status-dot ${mode === "live" ? "is-live" : "is-warn"}`} aria-hidden="true" />
          {mode === "live" ? "氣象署資料" : "示範資料"}
        </span>
        <label className="county-picker">
          <span className="visually-hidden">選擇縣市</span>
          <select value={county.county} onChange={(event) => onSelectCounty(event.target.value)}>
            {regions.map((region) => (
              <optgroup key={region} label={region}>
                {counties
                  .filter((c) => c.regionLabel === region)
                  .map((c) => (
                    <option key={c.county} value={c.county}>
                      {c.county}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2 4.5 6 8l4-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </label>
      </div>
    </header>
  );
}
