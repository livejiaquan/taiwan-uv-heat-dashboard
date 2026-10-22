import { STALE_AFTER_MINUTES } from "../../../lib/outlook";
import { SNAPSHOT_MAX_AGE_MS } from "../../../lib/snapshot";
import { formatClock, formatRelativeAge } from "../../../lib/time";
import type { CountyOutlook, DashboardData } from "../../../lib/types";

interface StatusLineProps {
  data: DashboardData;
  county: CountyOutlook;
  now: number;
  refreshing: boolean;
  onRefresh: () => void;
}

export function StatusLine({ data, county, now, refreshing, onRefresh }: StatusLineProps) {
  const live = data.mode === "live";
  // The headline already says the page shows demo data.
  const issues = data.issues.filter((issue) => !issue.includes("目前顯示示範資料"));
  const fetched = Date.parse(data.generatedAt);
  const ageMinutes = (now - fetched) / 60000;
  const state = !live ? "demo" : ageMinutes > STALE_AFTER_MINUTES ? "late" : "fresh";
  const validUntil = new Date(fetched + SNAPSHOT_MAX_AGE_MS).toISOString();

  return (
    <div className={`status-line is-${state}`} role="status">
      <span className="status-badge">
        <span className="status-dot" aria-hidden="true" />
        {state === "demo" ? "示範資料" : state === "late" ? "更新延遲" : "資料最新"}
      </span>
      <span className="status-text">
        {live ? (
          <>
            {`快照 ${formatClock(data.generatedAt)} 更新（${formatRelativeAge(data.generatedAt, now)}）`}
            <span className="status-sep" aria-hidden="true">・</span>
            {`有效至 ${formatClock(validUntil).slice(-5)}`}
            <span className="status-sep" aria-hidden="true">・</span>
            {`${county.county}${county.observedAt ? "有有效測站觀測，各指標時間見下方" : "目前沒有有效即時觀測"}`}
          </>
        ) : (
          "數值為示範情境，不代表實際天氣"
        )}
      </span>
      {live ? (
        <button className="refresh" type="button" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? "更新中…" : "重新整理"}
        </button>
      ) : (
        <a className="refresh" href="?">返回實際資料</a>
      )}
      {state === "late" ? (
        <p className="status-warn">排程更新可能延遲；快照超過 2 小時會停止顯示數值，請以中央氣象署為準。</p>
      ) : null}
      {issues.length ? (
        <ul className="status-issues">
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
