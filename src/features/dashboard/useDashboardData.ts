import { useCallback, useEffect, useRef, useState } from "react";
import { loadDashboardData } from "../../lib/load";
import type { DashboardData } from "../../lib/types";

const apiKey = (import.meta.env.VITE_CWA_API_KEY as string | undefined) || undefined;
const AUTO_REFRESH_MS = 10 * 60 * 1000;

type Status = "loading" | "ready" | "error";

// A refresh that falls back to demo data must not replace real readings that
// are already on screen; keep them and say why instead.
const keepLiveData = (previous: DashboardData | null, next: DashboardData): DashboardData => {
  if (previous?.mode !== "live" || next.mode !== "demo") return next;
  return {
    ...previous,
    stale: true,
    issues: [...next.issues.filter((issue) => !issue.includes("示範資料")), "重新整理失敗，畫面保留上一次成功載入的資料。"],
  };
};

export function useDashboardData() {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);
  const latest = useRef<DashboardData | null>(null);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const next = keepLiveData(latest.current, await loadDashboardData(apiKey));
      if (id !== requestId.current) return;
      latest.current = next;
      setData(next);
      setError(null);
      setStatus("ready");
    } catch (reason) {
      if (id !== requestId.current) return;
      setError(reason instanceof Error ? reason.message : String(reason));
      if (!latest.current) setStatus("error");
    } finally {
      if (id === requestId.current) setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
  }, [load]);

  useEffect(() => {
    void load();
    const timer = apiKey
      ? window.setInterval(() => {
          if (!document.hidden) void refresh();
        }, AUTO_REFRESH_MS)
      : undefined;
    return () => {
      // Invalidate in-flight requests so they cannot update an unmounted tree.
      requestId.current += 1;
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [load, refresh]);

  return { status, data, error, refreshing, refresh };
}
