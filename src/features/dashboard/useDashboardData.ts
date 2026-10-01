import { useCallback, useEffect, useRef, useState } from "react";
import { isStale, loadDashboardData } from "../../lib/cwa";
import type { DashboardData } from "../../lib/types";
import type { LoadStatus } from "./types";

const apiKey = import.meta.env.VITE_CWA_API_KEY as string | undefined;
const AUTO_REFRESH_MS = 10 * 60 * 1000;

// A refresh that falls back to demo data must not replace real readings that are
// already on screen; keep them and say why instead.
const mergeRefresh = (
  previous: DashboardData | null,
  next: DashboardData,
): DashboardData => {
  if (previous?.stats.dataMode !== "live" || next.stats.dataMode !== "demo") return next;
  return {
    ...previous,
    stats: {
      ...previous.stats,
      stale: isStale("live", previous.stats.latestUpdate),
      errors: [
        ...next.stats.errors.filter((item) => !item.includes("示範資料")),
        "重新整理失敗，畫面保留上一次成功載入的 CWA 即時資料。",
      ],
    },
  };
};

export function useDashboardData() {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const requestIdRef = useRef(0);
  const dataRef = useRef<DashboardData | null>(null);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      const nextData = mergeRefresh(dataRef.current, await loadDashboardData(apiKey));
      if (requestId !== requestIdRef.current) return;
      dataRef.current = nextData;
      setData(nextData);
      setError(null);
      setStatus("ready");
    } catch (nextError) {
      if (requestId !== requestIdRef.current) return;
      setError(nextError instanceof Error ? nextError.message : String(nextError));
      // Keep showing the last good dashboard if there is one.
      if (!dataRef.current) setStatus("error");
    } finally {
      if (requestId === requestIdRef.current) setRefreshing(false);
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
      // Invalidate in-flight requests so they cannot set state after unmount.
      requestIdRef.current += 1;
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [load, refresh]);

  return { status, data, error, refreshing, refresh };
}
