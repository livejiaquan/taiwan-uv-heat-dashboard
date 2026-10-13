import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildDemoDashboard } from "../../data/demo";
import { loadDashboardData } from "../../lib/load";
import { buildSnapshotDashboard } from "../../lib/outlook";
import type { WeatherSnapshot } from "../../lib/types";
import { useNow } from "./useNow";

const AUTO_REFRESH_MS = 10 * 60 * 1000;

export function useDashboardData(demo = false) {
  const now = useNow();
  const [snapshot, setSnapshot] = useState<WeatherSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(() => {
    const id = ++requestId.current;
    return loadDashboardData().then(
      (next) => {
        if (id !== requestId.current) return;
        setSnapshot(next);
        setError(null);
      },
      (reason: unknown) => {
        if (id !== requestId.current) return;
        setError(reason instanceof Error ? reason.message : "氣象資料讀取失敗。");
      },
    ).finally(() => {
      if (id === requestId.current) setRefreshing(false);
    });
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
  }, [load]);

  useEffect(() => {
    if (demo) return;
    void load();
    const timer = window.setInterval(() => { if (!document.hidden) void refresh(); }, AUTO_REFRESH_MS);
    const onVisible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      requestId.current += 1;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [demo, load, refresh]);

  const data = useMemo(() => {
    if (demo) return buildDemoDashboard([], now);
    if (!snapshot) return null;
    const result = buildSnapshotDashboard(snapshot, now);
    return error ? { ...result, issues: [...result.issues, "重新整理失敗，保留先前快照並持續檢查有效時間。"] } : result;
  }, [demo, snapshot, now, error]);

  const status = data ? "ready" : error ? "error" : "loading";
  return { status, data, error, refreshing, refresh, now };
}
