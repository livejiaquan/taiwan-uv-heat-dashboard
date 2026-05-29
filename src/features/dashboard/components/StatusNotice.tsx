import { AlertTriangle, ShieldCheck } from "lucide-react";
import type { DashboardData } from "../../../lib/types";

export function StatusNotice({ data }: { data: DashboardData }) {
  if (!data.stats.errors.length && !data.stats.stale && data.stats.dataMode === "live") {
    return (
      <div className="rounded-2xl border border-reef-100 bg-white/80 p-4 text-sm font-semibold text-reef-700 shadow-card backdrop-blur">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          CWA 即時資料已載入，資料新鮮度正常。
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-sun-300 bg-white/85 p-4 shadow-card backdrop-blur">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-sun-600" />
        <div className="text-sm leading-6 text-ink-700">
          <p className="font-black text-ink-900">
            {data.stats.dataMode === "demo" ? "目前顯示示範資料" : "資料狀態需要留意"}
          </p>
          <p>
            {data.stats.stale
              ? "最新觀測時間已超過 45 分鐘，請以中央氣象署正式發布為準。"
              : "部分 CWA 來源可能未回應，介面已保留可用欄位並標示資料來源。"}
          </p>
          {data.stats.errors.length ? (
            <ul className="mt-2 grid gap-1 text-xs text-ink-500">
              {data.stats.errors.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
