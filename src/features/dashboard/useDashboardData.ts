import { useEffect, useState } from "react";
import { loadDashboardData } from "../../lib/cwa";
import type { DashboardData } from "../../lib/types";
import type { LoadStatus } from "./types";

const apiKey = import.meta.env.VITE_CWA_API_KEY as string | undefined;

export function useDashboardData() {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const nextData = await loadDashboardData(apiKey);
      setData(nextData);
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
        const nextData = await loadDashboardData(apiKey);
        if (cancelled) return;
        setData(nextData);
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
