import { useEffect, useRef, useState, type RefObject } from "react";
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
import { pad2 } from "../../../lib/time";
import type { CountyOutlook, DayOutlook } from "../../../lib/types";

interface VerdictProps {
  sectionRef: RefObject<HTMLElement | null>;
  titleRef: RefObject<HTMLHeadingElement | null>;
  county: CountyOutlook;
  day: DayOutlook;
  dayIndex: 0 | 1;
  dayWord: string;
  hour: number;
  isNow: boolean;
  skin: number;
  demo: boolean;
  onSkin: (skin: number) => void;
  onDay: (day: 0 | 1) => void;
}

export function Verdict(props: VerdictProps) {
  const { sectionRef, titleRef, county, day, dayIndex, dayWord, hour, isNow, skin, demo, onSkin, onDay } = props;
  const med = SKIN_TYPES[skin].med;
  const verdict = verdictFor(day, hour, dayWord, med);
  const facts = factsFor(day);
  const point = day.hours[hour];
  const alert = heatAlertFor(day.airMax);
  const uvSource = point?.uv === undefined || demo ? "" : point.observed ? "測站觀測" : "預報推估";

  return (
    <section className="verdict" id="verdict" ref={sectionRef} aria-labelledby="v-title">
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
          <p className="verdict-lede">{verdict.lede}</p>
        </div>
      </div>

      <div className="meters">
        <div className="meter">
          <div className="meter-head">
            <span>紫外線指數</span>
            <span>{[`${pad2(hour)} 時`, uvSource].filter(Boolean).join(" · ")}</span>
          </div>
          <MeterValue value={verdict.uv} level={verdict.uvIndex} levels={UV_LEVELS} color={uvColor} ink={uvInk} />
          <Scale levels={UV_LEVELS} active={verdict.uvIndex} color={uvColor} />
          <p className="meter-foot">{[`${pad2(hour)} 時`, uvSource].filter(Boolean).join(" · ")}</p>
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
        <div className="meter">
          <div className="meter-head">
            <span>體感溫度</span>
            <span>{point?.temperature === undefined ? "" : `氣溫 ${Math.round(point.temperature)}°`}</span>
          </div>
          <MeterValue
            value={verdict.apparent}
            unit="°C"
            level={verdict.heatIndex}
            levels={HEAT_LEVELS}
            color={heatColor}
            ink={heatInk}
          />
          <Scale levels={HEAT_LEVELS} active={verdict.heatIndex} color={heatColor} />
          <p className="meter-foot">{point?.temperature === undefined ? "氣溫 --" : `氣溫 ${Math.round(point.temperature)}°`}</p>
        </div>
      </div>

      <div className="v-body">
        <dl className="facts">
          <div className="fact">
            <dt>需要防曬</dt>
            <dd>{verdict.protectText}</dd>
          </div>
          <div className="fact">
            <dt>最熱（體感）</dt>
            <dd>
              {facts.peakHour === undefined || day.apparentMax === undefined
                ? "--"
                : `${pad2(facts.peakHour)} 時 · ${Math.round(day.apparentMax)}°`}
            </dd>
          </div>
          <div className="fact">
            <dt>適合運動</dt>
            <dd>
              {facts.peakHour === undefined ? "--" : facts.exercise.length ? facts.exercise.join("、") : `${dayWord}全天偏熱`}
            </dd>
          </div>
        </dl>
        <PackList key={`${county.county}-${day.date}`} county={county.county} day={day} dayWord={dayWord} demo={demo} />
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

function Scale({ levels, active, color }: { levels: Level[]; active: number; color: (level: number) => string }) {
  return (
    <div className="scale" aria-hidden="true">
      <div className="scale-bar">
        {levels.map((level, index) => (
          <span key={level.name} className={index === active ? "on" : ""} style={{ background: color(index) }} />
        ))}
      </div>
      <div className="scale-labels">
        {levels.map((level, index) => (
          <span key={level.name} className={index === active ? "on" : ""}>
            {level.short}
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
  const note = <span style={{ fontWeight: 400, color: "var(--muted)" }}>（未擦防曬的估算）</span>;

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
        <button className="btn-ghost" type="button" onClick={copy}>
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
          {day.uvMax === undefined && day.apparentMax === undefined ? "資料不足，暫時無法建議。" : `${dayWord}不需要特別準備。`}
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
