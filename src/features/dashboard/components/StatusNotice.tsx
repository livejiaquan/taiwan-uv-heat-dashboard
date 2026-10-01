import { AlertTriangle, ShieldCheck } from "lucide-react";
import { STALE_AFTER_MINUTES } from "../../../lib/cwa";
import type { DashboardData } from "../../../lib/types";

export function StatusNotice({ data }: { data: DashboardData }) {
  if (
    !data.stats.errors.length &&
    !data.stats.stale &&
    !data.stats.missingDataCount &&
    data.stats.dataMode === "live"
  ) {
    return (
      <div className="rounded-2xl border border-reef-100 bg-reef-50/65 p-4 text-sm font-semibold text-reef-700 shadow-card backdrop-blur" role="status">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          CWA 即時資料已載入，資料新鮮度正常。
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-sun-300 bg-sun-50/75 p-4 shadow-card backdrop-blur" role="status">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-sun-600" />
        <div className="text-sm leading-6 text-ink-700">
          <p className="font-black text-ink-900">
            {data.stats.dataMode === "demo" ? "目前顯示示範資料" : "部分資料降級：判讀範圍受限"}
          </p>
          {noticeLines(data).map((line) => (
            <p key={line}>{line}</p>
          ))}
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

function noticeLines(data: DashboardData): string[] {
  const { dataMode, missingDataCount, stale } = data.stats;
  if (dataMode === "demo") {
    return ["以下數值為內建示範資料，不代表目前實際天氣，請勿用於判斷是否外出。"];
  }

  const lines: string[] = [];
  if (stale) {
    lines.push(
      `最新觀測時間已超過 ${STALE_AFTER_MINUTES} 分鐘或無法判斷，請以中央氣象署正式發布為準。`,
    );
  }
  if (missingDataCount) {
    lines.push(
      `${missingDataCount} 個縣市目前缺少足夠欄位，已標示為資料不足，不會被歸入低風險。`,
    );
  }
  if (!lines.length) {
    lines.push("部分 CWA 來源可能未回應，介面已保留可用欄位並標示資料來源。");
  }
  return lines;
}
