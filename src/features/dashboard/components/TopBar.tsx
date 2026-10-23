import { heatColor, heatInk, heatLevel, uvColor, uvInk, uvLevel } from "../../../lib/levels";
import type { CountyOutlook, DayOutlook } from "../../../lib/types";
import { ChevronDown } from "lucide-react";
import { Brand } from "./BrandMark";
import { ICON } from "./icons";

interface TopBarProps {
  counties: CountyOutlook[];
  county: CountyOutlook;
  day: DayOutlook;
  hour: number;
  /** True once the verdict has scrolled away; the brand gives way to a summary. */
  compact: boolean;
  onSelectCounty: (name: string) => void;
}

export function TopBar({ counties, county, day, hour, compact, onSelectCounty }: TopBarProps) {
  const point = day.hours[hour];
  const ul = uvLevel(point?.uv);
  const tl = heatLevel(point?.apparent);
  const regions = [...new Set(counties.map((c) => c.regionLabel))];

  return (
    <header className={`topbar${compact ? " is-compact" : ""}`}>
      <div className="wrap">
        <div className="brand">
          <Brand />
          <span className="mini" aria-hidden="true">
            <span className="cell-chip" style={{ background: uvColor(ul), color: uvInk(ul) }}>
              UV {point?.uv === undefined ? "--" : Math.round(point.uv)}
            </span>
            <span className="cell-chip" style={{ background: heatColor(tl), color: heatInk(tl) }}>
              {point?.apparent === undefined ? "--" : Math.round(point.apparent)}°
            </span>
          </span>
        </div>
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
          <ChevronDown {...ICON} size={16} />
        </label>
      </div>
    </header>
  );
}
