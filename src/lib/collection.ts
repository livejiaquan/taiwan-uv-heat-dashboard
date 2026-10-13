import { loadCwaBundle } from "./cwa";
import { buildSnapshotDashboard } from "./outlook";
import { createWeatherSnapshot, parseWeatherSnapshot } from "./snapshot";
import type { WeatherSnapshot } from "./types";

/** Runs in Actions only. Never import into the frontend. */
export const collectWeatherSnapshot = async (apiKey?: string, now = Date.now()): Promise<WeatherSnapshot> => {
  if (!apiKey) return createWeatherSnapshot({}, ["目前尚無可用氣象資料，請查看中央氣象署最新資訊。"], now);
  const { bundle, issues } = await loadCwaBundle(apiKey);
  const snapshot = parseWeatherSnapshot(createWeatherSnapshot(bundle, issues, now));
  const dashboard = buildSnapshotDashboard(snapshot, now);
  if (!dashboard.counties.some((c) => c.days.some((d) => d.hours.some((h) => h.uv !== undefined || h.apparent !== undefined || h.temperature !== undefined)))) {
    throw new Error("沒有有效氣象資料；取消部署並保留目前公開版本。");
  }
  if (JSON.stringify(snapshot).includes(apiKey)) throw new Error("公開快照安全檢查未通過；取消部署。");
  return snapshot;
};
