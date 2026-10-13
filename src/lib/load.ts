import { parseWeatherSnapshot } from "./snapshot";
import type { WeatherSnapshot } from "./types";

/**
 * Same-origin public data only. No API credentials and no implicit demo fallback.
 */
export const loadDashboardData = async (): Promise<WeatherSnapshot> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/weather.json`, { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error("目前無法取得氣象資料快照，請稍後再試。");
    return parseWeatherSnapshot(await response.json());
  } catch (error) {
    if (controller.signal.aborted) throw new Error("氣象資料讀取逾時，請稍後再試。");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};
