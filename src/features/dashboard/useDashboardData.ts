import { useEffect, useState } from "react";
import { buildDashboardData, loadCwaBundle } from "../../lib/cwa";
import type { DashboardData, RawCwaBundle } from "../../lib/types";
import type { LoadStatus } from "./types";

const apiKey = import.meta.env.VITE_CWA_API_KEY as string | undefined;
const FRESHNESS_RECHECK_MS = 60_000;

interface DashboardSnapshot {
  bundle: RawCwaBundle;
  errors: string[];
}

export function useDashboardData() {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [data, setData] = useState<DashboardData | null>(null);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const nextSnapshot = await loadCwaBundle(apiKey);
      setSnapshot(nextSnapshot);
      setData(buildDashboardData(nextSnapshot.errors, nextSnapshot.bundle));
      setStatus("ready");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
      setSnapshot(null);
      setData(null);
      setStatus("error");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        const nextSnapshot = await loadCwaBundle(apiKey);
        if (cancelled) return;
        setSnapshot(nextSnapshot);
        setData(buildDashboardData(nextSnapshot.errors, nextSnapshot.bundle));
        setStatus("ready");
      } catch (nextError) {
        if (cancelled) return;
        setError(nextError instanceof Error ? nextError.message : String(nextError));
        setSnapshot(null);
        setData(null);
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

  useEffect(() => {
    if (!snapshot) return;

    const recheck = window.setInterval(() => {
      setData(buildDashboardData(snapshot.errors, snapshot.bundle));
    }, FRESHNESS_RECHECK_MS);

    return () => window.clearInterval(recheck);
  }, [snapshot]);

  return { status, data, error, refreshing, refresh };
}
