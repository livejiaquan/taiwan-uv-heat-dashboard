import { AlertTriangle, Database } from "lucide-react";
import type { DashboardData } from "../../../lib/types";

export function StatusNotice({ data }: { data: DashboardData }) {
  const { stats } = data;
  const demo = stats.dataMode === "demo";
  const complete = !demo && !stats.errors.length && stats.currentCountyCount === stats.totalCounties;

  return (
    <div className={`rounded-2xl border p-4 shadow-card backdrop-blur ${complete ? "border-reef-100 bg-reef-50/65" : "border-sun-300 bg-sun-50/75"}`} role="status">
      <div className="flex gap-3">
        {complete ? <Database className="mt-0.5 h-5 w-5 flex-none text-reef-700" aria-hidden="true" /> : <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-sun-600" aria-hidden="true" />}
        <div className="text-sm leading-6 text-ink-700">
          <p className="font-black text-ink-900">
            {demo ? "示範模式：人工範例，非即時官方資料" : complete ? "CWA 觀測已載入，各縣市皆有時效內資料" : "資料有限：無法全面判斷目前風險"}
          </p>
          <p>{demo
            ? "沒有實際觀測時間。數值、地圖與排行僅展示功能，請勿據此決定是否外出；重新整理不會更新成真實觀測。"
            : `${stats.currentCountyCount} / ${stats.totalCounties} 縣市同時具備 45 分鐘內 UV、氣溫與濕度觀測。過期或時間不明的觀測不參與評分；日最大值與預報另列，資料完整不代表安全。`}
          </p>
          <a className="font-bold underline underline-offset-2" href="https://www.cwa.gov.tw/" target="_blank" rel="noreferrer">查看中央氣象署最新資訊</a>
          {stats.errors.length ? <ul className="mt-2 grid gap-1 text-xs text-ink-500">
            {stats.errors.map((item) => <li key={item}>• {item}</li>)}
          </ul> : null}
        </div>
      </div>
    </div>
  );
}
