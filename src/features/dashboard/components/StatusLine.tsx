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
  return (
    <div className="status-line" role="status">
      <span>
        {live
          ? `氣象快照更新 ${formatClock(data.generatedAt)}（${formatRelativeAge(data.generatedAt, now)}）・${county.county}${county.observedAt ? "有有效測站觀測，各指標時間見下方" : "目前沒有有效即時觀測"}`
          : "示範資料：數值為示範情境，不代表實際天氣"}
      </span>
      {live ? (
        <button className="refresh" type="button" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? "更新中…" : "重新整理"}
        </button>
      ) : null}
      {!live ? <a href="?">返回實際資料</a> : null}
      {issues.length ? (
        <ul className="status-issues" style={{ flexBasis: "100%" }}>
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
