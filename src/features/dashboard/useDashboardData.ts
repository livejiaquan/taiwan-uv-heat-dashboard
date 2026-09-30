import { useEffect, useMemo, useState } from "react";
import { buildDashboardData, loadCwaBundle } from "../../lib/cwa";
import type { LoadStatus } from "./types";

const apiKey = import.meta.env.VITE_CWA_API_KEY as string | undefined;

export function useDashboardData() {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [source, setSource] = useState<Awaited<ReturnType<typeof loadCwaBundle>> | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const data = useMemo(() => source ? buildDashboardData(source.mode, source.errors, source.bundle, now) : null, [source, now]);

  // Expire observations even when the page stays open without a network refresh.
  useEffect(() => {
    const revalidate = () => setNow(Date.now());
    const timer = window.setInterval(revalidate, 30_000);
    window.addEventListener("focus", revalidate);
    document.addEventListener("visibilitychange", revalidate);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", revalidate);
      document.removeEventListener("visibilitychange", revalidate);
    };
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const nextData = await loadCwaBundle(apiKey);
      setSource(nextData);
      setNow(Date.now());
      setStatus("ready");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
      setStatus("error");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        const nextData = await loadCwaBundle(apiKey);
        if (cancelled) return;
        setSource(nextData);
        setNow(Date.now());
        setStatus("ready");
      } catch (nextError) {
        if (cancelled) return;
        setError(nextError instanceof Error ? nextError.message : String(nextError));
        setStatus("error");
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    };

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  return { status, data, error, refreshing, refresh };
}
