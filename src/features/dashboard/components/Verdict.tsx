import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { factsFor, packFor, shareText, verdictFor } from "../../../lib/guidance";
import {
  HEAT_LEVELS,
  SKIN_TYPES,
  UV_LEVELS,
  burnMinutes,
  heatAlertFor,
  heatColor,
  heatInk,
  uvColor,
  uvInk,
  type Level,
} from "../../../lib/levels";
import { formatClock, pad2 } from "../../../lib/time";
import type { CountyOutlook, DayOutlook, MetricOrigin } from "../../../lib/types";

const sourceText = (origin?: MetricOrigin): string => {
  if (!origin) return "資料不足";
  if (origin.kind === "observation") return `測站觀測・${origin.stationName}・${formatClock(origin.observedAt)}`;
  return origin.kind === "forecast" ? "氣象署預報" : "本站推估（非逐時官方預報）";
};

interface VerdictProps {
  sectionRef: RefObject<HTMLElement | null>;
  titleRef: RefObject<HTMLHeadingElement | null>;
  county: CountyOutlook;
  day: DayOutlook;
  dayIndex: 0 | 1;
  dayWord: string;
  hour: number;
  isNow: boolean;
  /** Set when the data is more than 6 hours old: the card turns neutral and, past 24 hours, says how old. */
  staleLabel?: { tier: "old" | "unusable"; age: string };
  /** Data time and freshness, shown under the place name. */
  status?: ReactNode;
  skin: number;
  demo: boolean;
  onDay: (day: 0 | 1) => void;
}

export function Verdict(props: VerdictProps) {
  const { sectionRef, titleRef, county, day, dayIndex, dayWord, hour, isNow, staleLabel, status, skin, demo, onDay } = props;
  const [ledeOpen, setLedeOpen] = useState(false);
  const med = SKIN_TYPES[skin].med;
  const verdict = verdictFor(day, hour, dayWord, med);
  const facts = factsFor(day);
  const point = day.hours[hour];
  const alert = heatAlertFor(day.airMax);
  const uvSource = point?.uv === undefined || demo ? "" : point.uvOrigin?.kind === "observation" ? "測站觀測" : "本站推估";
  // The card takes the colour of whichever reading is more severe right now.
  const risk =
    staleLabel || (verdict.uvIndex < 0 && verdict.heatIndex < 0)
      ? "var(--missing)"
      : verdict.uvIndex >= verdict.heatIndex
        ? uvColor(verdict.uvIndex)
        : heatColor(verdict.heatIndex);

  const metric = (
    label: string,
    when: string,
    value: number | undefined,
    unit: string | undefined,
    level: number,
    levels: Level[],
    color: (level: number) => string,
    ink: (level: number) => string,
    scale: number[],
  ) => (
    <div className="metric">
      <dt>
        <span>{label}</span>
        <span className="metric-when">{when}</span>
      </dt>
      <dd>
        <MeterValue value={value} unit={unit} level={level} levels={levels} color={color} ink={ink} />
        <Gauge value={value} scale={scale} levels={levels} level={level} color={color} />
        <p className="meter-action">{level < 0 ? "資料不足，請查中央氣象署" : levels[level].action}</p>
      </dd>
    </div>
  );

  return (
    <section
      className="verdict"
      id="verdict"
      ref={sectionRef}
      aria-labelledby="v-title"
      style={{ ["--risk" as string]: risk }}
    >
      <header className="place">
        <p className="place-name">{county.county}</p>
        <div className="place-meta">
          <p className="place-sub">
            <span>{`${isNow ? "現在" : dayWord} ${pad2(hour)} 時`}</span>
            {day.weather ? <span>{day.weather}</span> : null}
            {staleLabel?.tier === "unusable" ? <span className="age-tag">{`${staleLabel.age}的資料`}</span> : null}
          </p>
          {status}
        </div>
        <div className="day-nav" role="group" aria-label="日期">
          {(["今天", "明天"] as const).map((label, index) => (
            <button key={label} type="button" aria-pressed={dayIndex === index} onClick={() => onDay(index as 0 | 1)}>
              {label}
            </button>
          ))}
        </div>
      </header>

      {alert ? (
        <p
          className="heat-alert"
          style={{ ["--alert-color" as string]: alert.level === 2 ? "var(--ht-2)" : "var(--ht-1)" }}
        >
          <strong>高溫 · 達氣象署{alert.name}</strong>
          <span>
            {dayWord}最高氣溫約 {Math.round(day.airMax!)}°C。實際高溫資訊燈號以中央氣象署發布為準。
          </span>
        </p>
      ) : null}

      <div className="answer" aria-live="polite" aria-atomic="true">
        <h1 id="v-title" ref={titleRef}>
          {verdict.title}
        </h1>
        <p id="v-lede" className={`verdict-lede${ledeOpen ? " is-open" : ""}`}>{verdict.lede}</p>
        {verdict.lede.length > 36 ? (
          <button className="lede-more" type="button" aria-expanded={ledeOpen} aria-controls="v-lede" onClick={() => setLedeOpen((open) => !open)}>
            {ledeOpen ? "收合說明" : "看完整說明"}
          </button>
        ) : null}
      </div>

      <div className="metric-card">
        <dl className="metric-row">
          {metric("紫外線指數", [`${pad2(hour)} 時`, uvSource].filter(Boolean).join(" · "), verdict.uv, undefined, verdict.uvIndex, UV_LEVELS, uvColor, uvInk, UV_SCALE)}
          {metric("體感溫度", point?.temperature === undefined ? "氣溫 --" : `氣溫 ${Math.round(point.temperature)}°`, verdict.apparent, "°C", verdict.heatIndex, HEAT_LEVELS, heatColor, heatInk, HEAT_SCALE)}
          <div className="metric fact">
            <dt>需要防曬</dt>
            <dd>{verdict.protectText}</dd>
          </div>
          <div className="metric fact">
            <dt>已知最高<span className="dt-long">體感</span></dt>
            <dd>
              {facts.peakHour === undefined || day.apparentMax === undefined
                ? "--"
                : `${pad2(facts.peakHour)} 時 · ${Math.round(day.apparentMax)}°`}
            </dd>
          </div>
          <div className="metric fact">
            <dt>適合運動</dt>
            <dd>{facts.exercise.length ? facts.exercise.join("、") : "無法確認"}</dd>
          </div>
        </dl>
        {!demo ? (
          <details className="sources">
            <summary>這些數值從哪裡來</summary>
            <dl>
              <div><dt>紫外線</dt><dd>{sourceText(point?.uvOrigin)}</dd></div>
              <div><dt>體感</dt><dd>{sourceText(point?.apparentOrigin)}</dd></div>
              <div><dt>氣溫</dt><dd>{sourceText(point?.temperatureOrigin)}</dd></div>
            </dl>
          </details>
        ) : null}
      </div>
    </section>
  );
}

function MeterValue(props: {
  value?: number;
  unit?: string;
  level: number;
  levels: Level[];
  color: (level: number) => string;
  ink: (level: number) => string;
}) {
  const { value, unit, level, levels, color, ink } = props;
  return (
    <div className="meter-value">
      <span className="num">{value === undefined ? "--" : Math.round(value)}</span>
      {unit && value !== undefined ? <span className="unit">{unit}</span> : null}
      <span className="pill" style={{ background: color(level), color: ink(level) }}>
        {level < 0 ? "資料不足" : levels[level].name}
      </span>
    </div>
  );
}

/** Level boundaries on each gauge, halfway between the rounded values that change level. */
const UV_SCALE = [0, 2.5, 5.5, 7.5, 10.5, 12];
const HEAT_SCALE = [20, 27.5, 31.5, 35.5, 39.5, 44];

/**
 * A banded bar with a dot at the reading, so position and label carry the level
 * as well as colour.
 */
function Gauge(props: { value?: number; scale: number[]; levels: Level[]; level: number; color: (level: number) => string }) {
  const { value, scale, levels, level, color } = props;
  const lo = scale[0];
  const span = scale[scale.length - 1] - lo;
  const pct = (v: number) => ((Math.min(scale[scale.length - 1], Math.max(lo, v)) - lo) / span) * 100;
  const widths = levels.map((_, i) => scale[i + 1] - scale[i]);
  return (
    <div className={`gauge${value === undefined ? " is-empty" : ""}`} aria-hidden="true">
      <div className="gauge-track" style={{ gridTemplateColumns: widths.map((w) => `${w}fr`).join(" ") }}>
        {levels.map((l, i) => (
          <span key={l.name} style={{ background: color(i) }} />
        ))}
        {value !== undefined ? (
          <i className="gauge-dot" style={{ left: `${pct(value)}%`, background: color(level) }} />
        ) : null}
      </div>
      <div className="gauge-labels" style={{ gridTemplateColumns: widths.map((w) => `${w}fr`).join(" ") }}>
        {levels.map((l, i) => (
          <span key={l.name} className={i === level ? "on" : ""}>
            {l.short}
          </span>
        ))}
      </div>
    </div>
  );
}

function BurnText({ day, hour, dayWord, med }: { day: DayOutlook; hour: number; dayWord: string; med: number }) {
  const uv = day.hours[hour]?.uv;
  const phrase = (value: number) => {
    const minutes = burnMinutes(value, med);
    return minutes > 120 ? (
      "超過 2 小時才會曬紅"
    ) : (
      <>
        約 <span className="num">{minutes}</span> 分鐘曬紅
      </>
    );
  };
  const note = <span className="burn-note">（未擦防曬的估算）</span>;

  if (uv !== undefined && uv > 0) {
    return (
      <p className="burn-text">
        {pad2(hour)} 時{phrase(uv)}
        {note}
      </p>
    );
  }
  if (day.uvMax !== undefined && day.uvMax > 0) {
    const peakHour = day.hours.findIndex((h) => h.uv === day.uvMax);
    return (
      <p className="burn-text">
        {dayWord}最強的 {pad2(peakHour)} 時{phrase(day.uvMax)}
        {note}
      </p>
    );
  }
  return <p className="burn-text">紫外線資料不足，無法估算曬傷時間</p>;
}

function PackList(props: { county: string; day: DayOutlook; dayWord: string; demo: boolean }) {
  const { county, day, dayWord, demo } = props;
  const [status, setStatus] = useState("");
  const [fallbackText, setFallbackText] = useState<string | null>(null);
  const fallbackRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (fallbackText === null) return;
    fallbackRef.current?.focus();
    fallbackRef.current?.select();
  }, [fallbackText]);
  const items = packFor(day);

  const copy = () => {
    const text = shareText(county, day, dayWord, demo);
    const showFallback = () => {
      setFallbackText(text);
      setStatus("無法自動複製，請長按下方文字複製。");
    };
    try {
      navigator.clipboard.writeText(text).then(() => {
        setFallbackText(null);
        setStatus("已複製，可以直接貼到 LINE 群組。");
      }, showFallback);
    } catch {
      showFallback();
    }
  };

  return (
    <div className="pack">
      <div className="pack-head">
        <h2 className="pack-title">出門帶這些</h2>
        <button className="btn-ghost btn-share" type="button" onClick={copy}>
          複製提醒傳給家人
        </button>
      </div>
      {items.length ? (
        <ul className="pack-list">
          {items.map(([item, why]) => (
            <li key={item}>
              <span className="tick" aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>
                <strong>{item}</strong>
                <span className="why">{why}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="share-status" style={{ color: "var(--muted)" }}>
          {day.hours.some((h) => h.uv === undefined || h.apparent === undefined || h.rain === undefined)
            ? "資料不足，暫時無法產生完整出門清單；請查官方預報。"
            : `${dayWord}已知數值未觸發額外裝備提醒，外出仍請留意天氣。`}
        </p>
      )}
      <p className="share-status" role="status">
        {status}
      </p>
      {fallbackText !== null ? (
        <textarea
          id="share-fallback"
          readOnly
          aria-label="提醒文字"
          value={fallbackText}
          ref={fallbackRef}
        />
      ) : null}
    </div>
  );
}

/** What to bring, the reminder to share, and the burn estimate for the reader's skin. */
export function PackSection(props: { county: string; day: DayOutlook; dayWord: string; hour: number; skin: number; demo: boolean; onSkin: (skin: number) => void }) {
  const { county, day, dayWord, hour, skin, demo, onSkin } = props;
  return (
    <section className="pack-section" aria-label="出門準備">
      <PackList key={`${county}-${day.date}`} county={county} day={day} dayWord={dayWord} demo={demo} />
      <div className="burn">
        <div className="burn-row">
          <label htmlFor="skin-select">你的膚質</label>
          <select id="skin-select" value={skin} onChange={(event) => onSkin(Number(event.target.value))}>
            {SKIN_TYPES.map((type, index) => (
              <option key={type.label} value={index}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <BurnText day={day} hour={hour} dayWord={dayWord} med={SKIN_TYPES[skin].med} />
      </div>
    </section>
  );
}
