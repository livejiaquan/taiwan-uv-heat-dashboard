import type { KeyboardEvent } from "react";
import { adviceFor, type Audience } from "../../../lib/guidance";
import type { DayOutlook } from "../../../lib/types";

const AUDIENCES: Array<[Audience, string]> = [
  ["general", "一般外出"],
  ["family", "兒童・長者"],
  ["sport", "運動"],
  ["work", "戶外工作"],
];

interface AdviceProps {
  county: string;
  day: DayOutlook;
  dayWord: string;
  audience: Audience;
  onAudience: (audience: Audience) => void;
}

export function Advice({ county, day, dayWord, audience, onAudience }: AdviceProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = ({ ArrowLeft: -1, ArrowRight: 1 } as Record<string, number>)[event.key];
    if (!step) return;
    event.preventDefault();
    const index = AUDIENCES.findIndex(([key]) => key === audience);
    const next = AUDIENCES[(index + step + AUDIENCES.length) % AUDIENCES.length][0];
    onAudience(next);
    document.getElementById(`tab-${next}`)?.focus();
  };

  return (
    <section aria-labelledby="advice-title">
      <div className="section-head">
        <div>
          <h2 id="advice-title">依你的情況</h2>
          <p>{`${county}${dayWord}的時段，依對象調整建議。`}</p>
        </div>
        <div className="tabs" role="tablist" aria-label="對象" onKeyDown={onKeyDown}>
          {AUDIENCES.map(([key, label]) => (
            <button
              key={key}
              id={`tab-${key}`}
              className="tab"
              role="tab"
              type="button"
              aria-selected={key === audience}
              aria-controls="advice-panel"
              tabIndex={key === audience ? 0 : -1}
              onClick={() => onAudience(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" id="advice-panel" tabIndex={0} aria-labelledby={`tab-${audience}`}>
        <ul className="advice-list">
          {adviceFor(day, audience, dayWord).map(([when, title, body]) => (
            <li key={title}>
              <span className="when">{when}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
