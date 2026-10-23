import { heatLevel, uvColor, uvInk, uvLevel } from "../../../lib/levels";
import { pad2 } from "../../../lib/time";
import type { DayOutlook } from "../../../lib/types";

interface HourTableProps {
  day: DayOutlook;
  hour: number;
  /** Current hour when showing today, otherwise null; today's past hours are left out. */
  nowHour: number | null;
  onSelect: (hour: number) => void;
}

const num = (value?: number, unit = "") => (value === undefined ? "--" : `${Math.round(value)}${unit}`);

/** Hour-by-hour rows, one reading per column, in the rhythm of a forecast table. */
export function HourTable({ day, hour, nowHour, onSelect }: HourTableProps) {
  const start = nowHour ?? 0;
  const rows = day.hours.map((h, i) => ({ ...h, i })).filter((h) => h.i >= start);

  return (
    <div className="hour-scroll">
      <table className="hour-table">
        <caption className="visually-hidden">逐時紫外線、體感溫度、氣溫與降雨機率；選一列可更新上方結論。</caption>
        <thead>
          <tr>
            <th scope="col">時間</th>
            <th scope="col" className="r">紫外線</th>
            <th scope="col" className="r">體感 °C</th>
            <th scope="col" className="r">氣溫 °C</th>
            <th scope="col" className="r">降雨 %</th>
            <th scope="col">提醒</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((h) => {
            const ul = uvLevel(h.uv);
            const notes = [
              (h.uv ?? 0) >= 3 ? "要防曬" : "",
              heatLevel(h.apparent) >= 2 ? "悶熱" : "",
              (h.rain ?? 0) >= 50 ? "可能下雨" : "",
            ].filter(Boolean);
            return (
              <tr key={h.i} className={h.i === hour ? "is-selected" : undefined} onClick={() => onSelect(h.i)}>
                <th scope="row">
                  <button type="button" className="hour-btn" aria-pressed={h.i === hour} onClick={(event) => { event.stopPropagation(); onSelect(h.i); }}>
                    {h.i === nowHour ? "現在" : pad2(h.i)}
                  </button>
                </th>
                <td className="r">
                  {h.uv === undefined ? (
                    "--"
                  ) : (
                    <span className="uv-chip" style={{ background: uvColor(ul), color: uvInk(ul) }}>
                      {Math.round(h.uv)}
                    </span>
                  )}
                </td>
                <td className="r hot">{num(h.apparent, "°")}</td>
                <td className="r">{num(h.temperature, "°")}</td>
                <td className="r wet">{h.rain === undefined ? "--" : h.rain}</td>
                <td className="notes">{notes.join("・")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
