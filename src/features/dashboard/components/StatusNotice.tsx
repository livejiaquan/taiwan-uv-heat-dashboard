import { AlertTriangle, ShieldCheck } from "lucide-react";
import type { DashboardData } from "../../../lib/types";

export function StatusNotice({ data }: { data: DashboardData }) {
  if (
    !data.stats.errors.length &&
    !data.stats.stale &&
    !data.stats.missingDataCount
  ) {
    return (
      <div className="rounded-2xl border border-reef-100 bg-reef-50/65 p-4 text-sm font-semibold text-reef-700 shadow-card backdrop-blur" role="status">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          CWA 測站觀測已載入；UV、氣溫與預報均分開標示來源時間。
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
            部分資料降級：判讀範圍受限
          </p>
          <p>
            {data.stats.missingDataCount
              ? `${data.stats.missingDataCount} 個縣市目前沒有具有效時間的 UV 或氣溫觀測，不會被歸入低風險。`
              : data.stats.stale
              ? "至少一個縣市的觀測已超過 45 分鐘；請查看卡片與數值旁的個別時間。"
              : "部分 CWA 來源未回應；保留的觀測與預報仍會分開標示。"}
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
