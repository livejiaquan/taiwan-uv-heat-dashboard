import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildDemoDashboard } from "../../data/demo";
import { loadDashboardData } from "../../lib/load";
import { buildSnapshotDashboard } from "../../lib/outlook";
import { parseWeatherSnapshot } from "../../lib/snapshot";
import { storage } from "../../lib/storage";
import type { WeatherSnapshot } from "../../lib/types";
import { useNow } from "./useNow";

const AUTO_REFRESH_MS = 10 * 60 * 1000;
const CACHE_KEY = "snapshot";

/** The last snapshot that loaded successfully, so a failed request still shows data (labelled with its age). */
const cachedSnapshot = (): WeatherSnapshot | null => {
  const text = storage.get(CACHE_KEY);
  if (!text) return null;
  try {
    return parseWeatherSnapshot(JSON.parse(text));
  } catch {
    return null;
  }
};

export function useDashboardData(demo = false) {
  const now = useNow();
  const [snapshot, setSnapshot] = useState<WeatherSnapshot | null>(() => (demo ? null : cachedSnapshot()));
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(() => {
    const id = ++requestId.current;
    return loadDashboardData().then(
      (next) => {
        if (id !== requestId.current) return;
        // Never replace newer data with an older file (e.g. a stale CDN copy).
        setSnapshot((current) => (current && Date.parse(current.fetchedAt) > Date.parse(next.fetchedAt) ? current : next));
        const savedAt = Date.parse(storage.get(`${CACHE_KEY}At`) ?? "");
        if (!(savedAt > Date.parse(next.fetchedAt))) {
          storage.set(CACHE_KEY, JSON.stringify(next));
          storage.set(`${CACHE_KEY}At`, next.fetchedAt);
        }
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
    return error ? { ...result, issues: [...result.issues, "暫時連不上本站資料，先顯示上次成功載入的資料。"] } : result;
  }, [demo, snapshot, now, error]);

  const status = data ? "ready" : error ? "error" : "loading";
  return { status, data, error, refreshing, refresh, now };
}
