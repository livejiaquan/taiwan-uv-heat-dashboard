import { dataTimeLabel, freshnessOf } from "../../../lib/freshness";
import { formatClock, formatRelativeAge } from "../../../lib/time";
import type { CountyOutlook, DashboardData } from "../../../lib/types";

interface StatusLineProps {
  data: DashboardData;
  county: CountyOutlook;
  now: number;
  refreshing: boolean;
  onRefresh: () => void;
}

const OFFICIAL = "https://www.cwa.gov.tw/V8/C/W/OBS_UVI.html";

export function StatusLine({ data, county, now, refreshing, onRefresh }: StatusLineProps) {
  const live = data.mode === "live";
  // The headline already says the page shows demo data.
  const issues = data.issues.filter((issue) => !issue.includes("目前顯示示範資料"));
  const tier = live ? freshnessOf(data.dataTime, now) : "live";
  const official = (
    <a href={OFFICIAL} target="_blank" rel="noopener noreferrer">
      中央氣象署
    </a>
  );

  return (
    <div className={`status-line${live ? ` is-${tier}` : " is-demo"}`} role="status">
      {live && tier === "unusable" ? (
        <p className="status-note">
          {`目前顯示的是 ${formatRelativeAge(data.dataTime, now)}的資料。`}本站每 3–4 小時更新一次，最新數據請見{official}。
        </p>
      ) : null}
      <span className="status-badge">
        <span className="status-dot" aria-hidden="true" />
        {live ? dataTimeLabel(data.dataTime, now) : "示範資料"}
      </span>
      <span className="status-text">
        {live ? (
          <span className="status-detail">
            {`${county.county}${county.observedAt ? "有即時測站觀測" : "使用氣象署逐時預報"}`}
          </span>
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
      {live && tier === "old" ? (
        <p className="status-explain">
          {`GitHub 排程延遲，最後成功更新 ${formatClock(data.generatedAt).slice(-5)}。`}本站每 3–4 小時更新一次，最新數據請見{official}。
        </p>
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
