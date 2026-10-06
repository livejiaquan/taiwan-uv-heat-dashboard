import { formatClock, formatRelativeAge } from "../../../lib/time";
import type { DashboardData } from "../../../lib/types";

interface StatusLineProps {
  data: DashboardData;
  now: number;
  refreshing: boolean;
  onRefresh: () => void;
}

export function StatusLine({ data, now, refreshing, onRefresh }: StatusLineProps) {
  const live = data.mode === "live";
  // The headline already says the page shows demo data.
  const issues = data.issues.filter((issue) => !issue.includes("目前顯示示範資料"));
  return (
    <div className="status-line" role="status">
      <span>
        {live
          ? data.latestObservation
            ? `中央氣象署資料・觀測時間 ${formatClock(data.latestObservation)}（${formatRelativeAge(data.latestObservation, now)}）`
            : "中央氣象署預報資料・目前沒有即時觀測"
          : "示範資料：數值為示範情境，不代表實際天氣"}
        {live && data.stale && data.latestObservation ? "，觀測資料偏舊" : ""}
      </span>
      {live ? (
        <button className="refresh" type="button" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? "更新中…" : "重新整理"}
        </button>
      ) : null}
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
