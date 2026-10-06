import { useEffectEvent, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import { heatColor, heatLevel, uvColor, uvInk, uvLevel } from "../../../lib/levels";
import { pad2 } from "../../../lib/time";
import type { DayOutlook } from "../../../lib/types";

interface TimelineProps {
  day: DayOutlook;
  dayWord: string;
  hour: number;
  /** Current hour when showing today, otherwise null. */
  nowHour: number | null;
  isNow: boolean;
  /** Changes whenever the chart should scroll the selected hour into view. */
  centerKey: number;
  demo: boolean;
  onSelect: (hour: number, center?: boolean) => void;
  onNow: () => void;
}

const T0 = 20;
const T1 = 42;
const TICKS = [24, 28, 32, 36, 40];

function useElementWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

const coarsePointer = () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

export function Timeline({ day, dayWord, hour, nowHour, isNow, centerKey, demo, onSelect, onNow }: TimelineProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const hostWidth = useElementWidth(hostRef);
  const [touchHint] = useState(coarsePointer);

  // On phones the 24 hours scroll sideways at a readable column width with the
  // y-axis pinned; on wider screens the whole day fits.
  const scroll = hostWidth > 0 && hostWidth < 640;
  const padL = scroll ? 2 : 38;
  const padR = scroll ? 2 : 6;
  const top = 34;
  const areaH = scroll ? 128 : 150;
  const stripY = top + areaH + 14;
  const stripH = scroll ? 28 : 26;
  const rainY = stripY + stripH + 6;
  const rainH = 10;
  const H = rainY + rainH + 26;
  const colW = scroll ? 34 : Math.max(10, (hostWidth - padL - padR) / 24);
  const W = scroll ? padL + padR + colW * 24 : hostWidth;
  const x = (h: number) => padL + h * colW;
  const cx = (h: number) => x(h) + colW / 2;
  const y = (t: number) => top + areaH - ((Math.min(T1, Math.max(T0, t)) - T0) / (T1 - T0)) * areaH;
  const centerSelectedHour = useEffectEvent(() => {
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollLeft = Math.max(0, cx(hour) - scroller.clientWidth / 2);
  });
  useLayoutEffect(() => {
    if (scroll) centerSelectedHour();
  }, [centerKey, scroll]);

  const hours = day.hours;
  const point = hours[hour];
  const hourAt = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * W;
    return Math.min(23, Math.max(0, Math.floor((px - padL) / colW)));
  };
  const pickFromPointer = (event: PointerEvent<SVGSVGElement>) => {
    const next = hourAt(event);
    if (next !== hour) onSelect(next);
  };
  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const delta = ({ ArrowLeft: -1, ArrowRight: 1, ArrowDown: -1, ArrowUp: 1 } as Record<string, number>)[event.key];
    if (delta) {
      event.preventDefault();
      onSelect((hour + delta + 24) % 24, true);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      onSelect(event.key === "Home" ? 0 : 23, true);
    }
  };

  // Continuous runs of known apparent temperatures, drawn as area + line.
  const runs: number[][] = [];
  hours.forEach((h, i) => {
    if (h.apparent === undefined) return;
    const last = runs[runs.length - 1];
    if (last && last[last.length - 1] === i - 1) last.push(i);
    else runs.push([i]);
  });

  const axis = (
    <>
      {TICKS.map((t) => (
        <text key={t} x={scroll ? 26 : padL - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--muted)" fontFamily="var(--font-num)">
          {t}°
        </text>
      ))}
      <text x={scroll ? 26 : padL - 6} y={stripY + stripH / 2 + 4} textAnchor="end" fontSize={11} fill="var(--muted)" fontFamily="var(--font-num)">
        UV
      </text>
      <text x={scroll ? 26 : padL - 6} y={rainY + rainH - 1} textAnchor="end" fontSize={10} fill="var(--muted)">
        雨
      </text>
    </>
  );

  const label = [
    `${pad2(hour)} 時`,
    `體感 ${point?.apparent === undefined ? "--" : Math.round(point.apparent)}°`,
    `UV ${point?.uv === undefined ? "--" : Math.round(point.uv)}`,
    (point?.rain ?? 0) >= 30 ? `雨 ${point!.rain}%` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const anchor = hour < 4 ? "start" : hour > 19 ? "end" : "middle";
  const labelX = anchor === "start" ? x(hour) : anchor === "end" ? x(hour) + colW : cx(hour);

  const chart = hostWidth ? (
    <svg
      className="timeline-plot"
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      style={scroll ? { width: `${W}px` } : undefined}
      role="slider"
      tabIndex={0}
      aria-label="選擇時段"
      aria-valuemin={0}
      aria-valuemax={23}
      aria-valuenow={hour}
      aria-valuetext={`${pad2(hour)} 時，紫外線 ${point?.uv ?? "資料不足"}，體感 ${point?.apparent === undefined ? "資料不足" : `${Math.round(point.apparent)} 度`}，降雨機率 ${point?.rain ?? "資料不足"}${point?.rain === undefined ? "" : "%"}`}
      onKeyDown={onKeyDown}
      onPointerDown={(event) => {
        // Mouse can drag across hours; touch uses a tap so a sideways swipe still scrolls.
        if (event.pointerType !== "mouse") return;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        pickFromPointer(event);
      }}
      onPointerMove={(event) => {
        if (event.pointerType === "mouse" && event.buttons) pickFromPointer(event);
      }}
      onClick={(event) => {
        if ((event.nativeEvent as globalThis.PointerEvent).pointerType === "mouse") return;
        const rect = event.currentTarget.getBoundingClientRect();
        const px = ((event.clientX - rect.left) / rect.width) * W;
        const next = Math.min(23, Math.max(0, Math.floor((px - padL) / colW)));
        if (next !== hour) onSelect(next);
      }}
    >
      {!scroll ? axis : null}
      <rect x={padL} y={y(T1)} width={W - padL - padR} height={y(36) - y(T1)} fill="var(--ht-3)" opacity={0.1} />
      <rect x={padL} y={y(36)} width={W - padL - padR} height={y(32) - y(36)} fill="var(--ht-2)" opacity={0.1} />
      {TICKS.map((t) => (
        <line
          key={t}
          x1={padL}
          x2={W - padR}
          y1={y(t)}
          y2={y(t)}
          stroke="var(--line)"
          strokeWidth={1}
          strokeDasharray={t === 32 || t === 36 ? undefined : "2 4"}
        />
      ))}
      <rect x={x(hour)} y={top - 6} width={colW} height={rainY + rainH - top + 6} rx={4} fill="var(--accent-soft)" />

      {runs.map((run) => (
        <path
          key={`area-${run[0]}`}
          d={`M${cx(run[0])},${y(T0)} ${run.map((h) => `L${cx(h)},${y(hours[h].apparent!)}`).join(" ")} L${cx(run[run.length - 1])},${y(T0)} Z`}
          fill="var(--ink)"
          opacity={0.05}
        />
      ))}
      {hours.slice(0, 23).map((h, i) => {
        const next = hours[i + 1];
        if (h.apparent === undefined || next.apparent === undefined) return null;
        const level = heatLevel(Math.max(h.apparent, next.apparent));
        return (
          <line
            key={`seg-${i}`}
            x1={cx(i)}
            y1={y(h.apparent)}
            x2={cx(i + 1)}
            y2={y(next.apparent)}
            stroke={level >= 2 ? heatColor(level) : "var(--ink)"}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        );
      })}
      {scroll
        ? hours.map((h, i) =>
            h.apparent !== undefined && (i % 2 === 0 || i === hour) ? (
              <text
                key={`t-${i}`}
                x={cx(i)}
                y={y(h.apparent) - 9}
                textAnchor="middle"
                fontSize={10.5}
                fill={i === hour ? "var(--ink)" : "var(--muted)"}
                fontWeight={i === hour ? 700 : 500}
                fontFamily="var(--font-num)"
              >
                {Math.round(h.apparent)}°
              </text>
            ) : null,
          )
        : null}
      {point?.apparent !== undefined ? (
        <circle cx={cx(hour)} cy={y(point.apparent)} r={5} fill="var(--surface)" stroke="var(--ink)" strokeWidth={2} />
      ) : null}
      <text x={labelX} y={top - 14} textAnchor={anchor} fontSize={12.5} fontWeight={600} fill="var(--ink)" fontFamily="var(--font-num)">
        {label}
      </text>

      {hours.map((h, i) => {
        const level = uvLevel(h.uv);
        return (
          <g key={`uv-${i}`}>
            <rect
              x={x(i) + 1}
              y={stripY}
              width={Math.max(1, colW - 2)}
              height={stripH}
              rx={4}
              fill={h.uv === undefined || h.uv === 0 ? "var(--surface-2)" : uvColor(level)}
            />
            {h.uv !== undefined && h.uv > 0 && colW >= 15 ? (
              <text x={cx(i)} y={stripY + stripH / 2 + 4} textAnchor="middle" fontSize={11.5} fontWeight={600} fill={uvInk(level)} fontFamily="var(--font-num)">
                {Math.round(h.uv)}
              </text>
            ) : null}
          </g>
        );
      })}
      {hours.map((h, i) =>
        (h.rain ?? 0) >= 30 ? (
          <rect
            key={`rain-${i}`}
            x={x(i) + 1}
            y={rainY}
            width={Math.max(1, colW - 2)}
            height={rainH}
            rx={2}
            fill="var(--rain)"
            opacity={0.25 + (h.rain ?? 0) / 120}
          />
        ) : null,
      )}
      {Array.from({ length: 24 }, (_, i) => i)
        .filter((i) => i % (scroll ? 1 : 3) === 0)
        .map((i) => (
          <text
            key={`h-${i}`}
            x={cx(i)}
            y={H - 6}
            textAnchor="middle"
            fontSize={scroll ? 10.5 : 11}
            fill={i === hour ? "var(--ink)" : "var(--muted)"}
            fontWeight={i === hour ? 700 : 400}
            fontFamily="var(--font-num)"
          >
            {pad2(i)}
          </text>
        ))}
      {nowHour !== null ? (
        <text x={cx(nowHour)} y={rainY + rainH + 10} textAnchor="middle" fontSize={9} fill="var(--accent)" fontWeight={700}>
          ▲
        </text>
      ) : null}
    </svg>
  ) : null;

  return (
    <section aria-labelledby="timeline-title">
      <div className="section-head">
        <div>
          <h2 id="timeline-title">{dayWord}的節奏</h2>
          <p>
            {touchHint
              ? "左右滑動看整天，點一下選時段，上方結論會跟著更新。"
              : "點或拖曳時間軸，上方的結論會跟著所選時段更新。"}
          </p>
        </div>
        <button className="btn-ghost" type="button" onClick={onNow} disabled={isNow}>
          {nowHour === null ? "回到今天" : "回到現在"}
        </button>
      </div>
      <div className="timeline">
        <div ref={hostRef} className={scroll ? "chart-scroll" : "chart-fit"}>
          {scroll ? (
            <svg className="chart-axis" viewBox={`0 0 30 ${H}`} width={30} height={H} aria-hidden="true">
              {axis}
            </svg>
          ) : null}
          <div ref={scrollerRef} className="chart-scroller">
            {chart}
          </div>
        </div>
        <div className="chart-legend">
          <span>
            <i />
            體感溫度
          </span>
          <span>
            <i className="band" style={{ background: "var(--ht-2)" }} />
            警戒 32° 以上
          </span>
          <span>
            <i className="band" style={{ background: "var(--ht-3)" }} />
            危險 36° 以上
          </span>
          <span className={demo ? "uv-note" : undefined}>
            <i className="band" style={{ background: "var(--uv-2)" }} />
            {demo ? "方格為逐時紫外線" : "紫外線：現在為測站觀測，其他時段依預報最大值推估"}
          </span>
          <span>
            <i className="band" style={{ background: "var(--rain)" }} />
            降雨機率 30% 以上
          </span>
        </div>
      </div>
    </section>
  );
}
