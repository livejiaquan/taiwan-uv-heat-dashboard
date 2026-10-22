import { useEffect, useRef, useState, type RefObject } from "react";
import { factsFor, formatRanges, packFor, shareText, verdictFor, type HourRange } from "../../../lib/guidance";
import {
  HEAT_LEVELS,
  SKIN_TYPES,
  UV_LEVELS,
  burnMinutes,
  heatAlertFor,
  heatColor,
  heatInk,
  heatLevel,
  uvColor,
  uvInk,
  uvLevel,
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
  /** Current hour when showing today, otherwise null. */
  nowHour?: number | null;
  skin: number;
  demo: boolean;
  onSkin: (skin: number) => void;
  onDay: (day: 0 | 1) => void;
}

export function Verdict(props: VerdictProps) {
  const { sectionRef, titleRef, county, day, dayIndex, dayWord, hour, isNow, nowHour = null, skin, demo, onSkin, onDay } = props;
  const [ledeOpen, setLedeOpen] = useState(false);
  const med = SKIN_TYPES[skin].med;
  const verdict = verdictFor(day, hour, dayWord, med);
  const facts = factsFor(day);
  const point = day.hours[hour];
  const alert = heatAlertFor(day.airMax);
  const uvSource = point?.uv === undefined || demo ? "" : point.uvOrigin?.kind === "observation" ? "測站觀測" : "本站推估";
  // The card takes the colour of whichever reading is more severe right now.
  const risk =
    verdict.uvIndex < 0 && verdict.heatIndex < 0
      ? "var(--missing)"
      : verdict.uvIndex >= verdict.heatIndex
        ? uvColor(verdict.uvIndex)
        : heatColor(verdict.heatIndex);

  return (
    <section
      className="verdict"
      id="verdict"
      ref={sectionRef}
      aria-labelledby="v-title"
      style={{ ["--risk" as string]: risk }}
    >
      <div className="v-head">
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
        <div className="verdict-meta">
          <div className="meta-text">
            <strong>{county.county}</strong>
            <span>{`${isNow ? "現在" : dayWord} ${pad2(hour)} 時`}</span>
            {day.weather ? <span>{day.weather}</span> : null}
          </div>
          <div className="day-toggle" role="group" aria-label="日期">
            {(["今天", "明天"] as const).map((label, index) => (
              <button
                key={label}
                className="tab"
                type="button"
                aria-pressed={dayIndex === index}
                onClick={() => onDay(index as 0 | 1)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div aria-live="polite" aria-atomic="true">
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
      </div>

      <DayBar day={day} dayWord={dayWord} hour={hour} nowHour={nowHour} protect={verdict.protectText} hot={facts.hot} />

      <div className="meters">
        <div className="meter">
          <div className="meter-head">
            <span>紫外線指數</span>
            <span className="meter-when">{[`${pad2(hour)} 時`, uvSource].filter(Boolean).join(" · ")}</span>
          </div>
          <MeterValue value={verdict.uv} level={verdict.uvIndex} levels={UV_LEVELS} color={uvColor} ink={uvInk} />
          <Gauge value={verdict.uv} scale={UV_SCALE} levels={UV_LEVELS} level={verdict.uvIndex} color={uvColor} />
          <p className="meter-action">{verdict.uvIndex < 0 ? "資料不足，請查中央氣象署" : UV_LEVELS[verdict.uvIndex].action}</p>
        </div>
        <div className="meter">
          <div className="meter-head">
            <span>體感溫度</span>
            <span className="meter-when">{point?.temperature === undefined ? "氣溫 --" : `氣溫 ${Math.round(point.temperature)}°`}</span>
          </div>
          <MeterValue
            value={verdict.apparent}
            unit="°C"
            level={verdict.heatIndex}
            levels={HEAT_LEVELS}
            color={heatColor}
            ink={heatInk}
          />
          <Gauge value={verdict.apparent} scale={HEAT_SCALE} levels={HEAT_LEVELS} level={verdict.heatIndex} color={heatColor} />
          <p className="meter-action">{verdict.heatIndex < 0 ? "資料不足，請查中央氣象署" : HEAT_LEVELS[verdict.heatIndex].action}</p>
        </div>
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
        <BurnText day={day} hour={hour} dayWord={dayWord} med={med} />
      </div>

      <dl className="facts">
        <div className="fact">
          <dt>需要防曬</dt>
          <dd>{verdict.protectText}</dd>
        </div>
        <div className="fact">
          <dt>已知最高體感</dt>
          <dd>
            {facts.peakHour === undefined || day.apparentMax === undefined
              ? "--"
              : `${pad2(facts.peakHour)} 時 · ${Math.round(day.apparentMax)}°`}
          </dd>
        </div>
        <div className="fact">
          <dt>適合運動</dt>
          <dd>
            {facts.exercise.length ? facts.exercise.join("、") : "無法確認"}
          </dd>
        </div>
      </dl>
      <PackList key={`${county.county}-${day.date}`} county={county.county} day={day} dayWord={dayWord} demo={demo} />
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

/**
 * The whole day at a glance: hours that need sun protection and hours that are
 * hot, with the selected hour marked. Missing hours are hatched, not left blank.
 */
function DayBar(props: { day: DayOutlook; dayWord: string; hour: number; nowHour: number | null; protect: string; hot: HourRange[] }) {
  const { day, dayWord, hour, nowHour, protect, hot } = props;
  const rows: Array<{ key: string; label: string; cell: (h: DayOutlook["hours"][number]) => string | null | undefined }> = [
    { key: "uv", label: "防曬", cell: (h) => (h.uv === undefined ? undefined : h.uv >= 3 ? uvColor(uvLevel(h.uv)) : null) },
    {
      key: "heat",
      label: "高溫",
      cell: (h) => (h.apparent === undefined ? undefined : h.apparent >= 32 ? heatColor(heatLevel(h.apparent)) : null),
    },
  ];
  const marker = `calc(${((hour + 0.5) / 24) * 100}%)`;
  return (
    <figure className="daybar">
      <span className="daybar-title" aria-hidden="true">{`${dayWord}的防曬與高溫時段`}</span>
      <figcaption className="visually-hidden">
        {`需要防曬：${protect}。體感 32 度以上：${hot.length ? formatRanges(hot) : "無或資料不足"}。`}
      </figcaption>
      <div className="daybar-grid" aria-hidden="true">
        {rows.map((row) => (
          <div className="daybar-row" key={row.key}>
            <span className="daybar-label">{row.label}</span>
            <div className="daybar-cells">
              {day.hours.map((h, i) => {
                const fill = row.cell(h);
                return (
                  <i
                    key={i}
                    className={[fill === undefined ? "is-missing" : fill === null ? "" : "is-on", i === hour ? "is-sel" : ""].join(" ").trim() || undefined}
                    style={fill ? { background: fill } : undefined}
                  />
                );
              })}
            </div>
          </div>
        ))}
        <div className="daybar-row daybar-axis">
          <span className="daybar-label" />
          <div className="daybar-cells">
            <b className="daybar-marker" style={{ left: marker }}>
              {nowHour === hour ? "現在" : `${pad2(hour)} 時`}
            </b>
            {/* Axis ticks give way to the marker when they would overlap it. */}
            {[0, 6, 12, 18].filter((t) => Math.abs(t - (hour + 0.5)) >= 3.5).map((t) => (
              <small key={t} style={{ left: `${(t / 24) * 100}%` }}>
                {pad2(t)}
              </small>
            ))}
          </div>
        </div>
      </div>
    </figure>
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
