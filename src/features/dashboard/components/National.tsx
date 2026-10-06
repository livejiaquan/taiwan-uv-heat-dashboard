import { useLayoutEffect, useRef, useState } from "react";
import mapData from "../../../data/taiwan-map.json";
import { HEAT_LEVELS, UV_LEVELS, heatColor, heatInk, heatLevel, uvColor, uvInk, uvLevel } from "../../../lib/levels";
import type { CountyOutlook } from "../../../lib/types";

export type Metric = "uv" | "heat";

interface MapShape {
  name: string;
  d: string;
}

const MAP = mapData as { viewBox: number[]; main: MapShape[]; matsu: MapShape[]; kinmen: MapShape[] };
const SHAPES = [...MAP.main, ...MAP.matsu, ...MAP.kinmen];
const INSETS: Array<[string, number, number, number, number]> = [
  ["連江縣", 16, 22, 132, 140],
  ["金門縣", 16, 190, 132, 110],
];
const COLLAPSED_ROWS = 8;

interface NationalProps {
  counties: CountyOutlook[];
  dayIndex: 0 | 1;
  dayWord: string;
  selected: string;
  metric: Metric;
  onMetric: (metric: Metric) => void;
  onSelect: (county: string) => void;
}

const fmt = (value?: number, unit = "") => (value === undefined ? "--" : `${Math.round(value)}${unit}`);

export function National({ counties, dayIndex, dayWord, selected, metric, onMetric, onSelect }: NationalProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [phone] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches);

  // Crop the viewBox to the drawn shapes so the island fills its box.
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    try {
      const box = svg.getBBox();
      if (box.width && box.height) svg.setAttribute("viewBox", `${box.x - 8} ${box.y - 8} ${box.width + 16} ${box.height + 16}`);
    } catch {
      // getBBox is unavailable (e.g. not rendered); keep the default viewBox.
    }
  }, []);

  const value = (c: CountyOutlook) => (metric === "uv" ? c.days[dayIndex].uvMax : c.days[dayIndex].apparentMax);
  const fill = (c: CountyOutlook) => (metric === "uv" ? uvColor(uvLevel(value(c))) : heatColor(heatLevel(value(c))));
  const describe = (c: CountyOutlook) =>
    metric === "uv" ? `${dayWord}最高 UV ${fmt(value(c))}` : `${dayWord}最高體感 ${fmt(value(c), "°")}`;
  const byName = new Map(counties.map((c) => [c.county, c]));
  const caption = byName.get(hovered ?? selected) ?? byName.get(selected)!;

  const sorted = [...counties].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    if (va === undefined || vb === undefined) return va === undefined ? (vb === undefined ? 0 : 1) : -1;
    return vb - va || (b.days[dayIndex].uvMax ?? 0) + (b.days[dayIndex].apparentMax ?? 0) - (a.days[dayIndex].uvMax ?? 0) - (a.days[dayIndex].apparentMax ?? 0);
  });
  const collapsed = phone && !showAll;
  const rows = collapsed ? sorted.slice(0, COLLAPSED_ROWS) : sorted;
  const levels = metric === "uv" ? UV_LEVELS : HEAT_LEVELS;
  const anyMissing = counties.some((c) => value(c) === undefined);
  const ordered = [...SHAPES.filter((s) => s.name !== selected), ...SHAPES.filter((s) => s.name === selected)];

  return (
    <section aria-labelledby="national-title">
      <div className="section-head">
        <div>
          <h2 id="national-title">全台比較</h2>
          <p>{`各縣市${dayWord}的最高值。點地圖或清單切換上方縣市。`}</p>
        </div>
        <div className="metric-toggle" role="group" aria-label="比較指標">
          <button className="tab" type="button" aria-pressed={metric === "uv"} onClick={() => onMetric("uv")}>
            紫外線
          </button>
          <button className="tab" type="button" aria-pressed={metric === "heat"} onClick={() => onMetric("heat")}>
            體感溫度
          </button>
        </div>
      </div>
      <div className="national">
        <div className="map-box">
          <svg ref={svgRef} viewBox={MAP.viewBox.join(" ")} role="img" aria-label={`台灣各縣市${dayWord}最高值地圖`}>
            {INSETS.map(([name, fx, fy, fw, fh]) => (
              <g key={name}>
                <rect className="inset-frame" x={fx} y={fy} width={fw} height={fh} rx={10} />
                <text className="inset-label" x={fx + 10} y={fy + 18}>
                  {name}
                </text>
              </g>
            ))}
            {ordered.map((shape) => {
              const county = byName.get(shape.name);
              if (!county) return null;
              return (
                <path
                  key={shape.name}
                  d={shape.d}
                  className={`county${shape.name === selected ? " is-selected" : ""}`}
                  fill={fill(county)}
                  onClick={() => onSelect(shape.name)}
                  onMouseEnter={() => setHovered(shape.name)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <title>{`${shape.name} ${describe(county)}`}</title>
                </path>
              );
            })}
          </svg>
          <div className="map-caption">
            <span>{`${caption.county} · ${describe(caption)}`}</span>
            <span className="legend">
              {levels.map((level, index) => (
                <span key={level.name}>
                  <i style={{ background: metric === "uv" ? uvColor(index) : heatColor(index) }} />
                  {level.short}
                </span>
              ))}
              {anyMissing ? (
                <span>
                  <i style={{ background: "var(--missing)" }} />
                  資料不足
                </span>
              ) : null}
            </span>
          </div>
        </div>
        <div className="table-scroll">
          <table className="county-table">
            <thead>
              <tr>
                <th>縣市</th>
                <th className="r">最高 UV</th>
                <th className="r">最高體感</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const day = c.days[dayIndex];
                const ul = uvLevel(day.uvMax);
                const tl = heatLevel(day.apparentMax);
                return (
                  <tr key={c.county} className={c.county === selected ? "is-selected" : undefined}>
                    <td>
                      <button className="row-btn" type="button" aria-pressed={c.county === selected} onClick={() => onSelect(c.county)}>
                        <strong>{c.county}</strong>
                        <small>{c.regionLabel}</small>
                      </button>
                    </td>
                    <td className="r">
                      <span className="cell-chip" style={{ background: uvColor(ul), color: uvInk(ul) }}>
                        {fmt(day.uvMax)}
                      </span>
                    </td>
                    <td className="r" style={{ paddingRight: 8 }}>
                      <span className="cell-chip" style={{ background: heatColor(tl), color: heatInk(tl) }}>
                        {fmt(day.apparentMax, "°")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {collapsed ? (
            <button className="btn-ghost show-all" type="button" onClick={() => setShowAll(true)}>
              看全部 {counties.length} 個縣市
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
