import { buildDemoDashboard } from "../data/demo";
import { loadCwaBundle } from "./cwa";
import { buildLiveDashboard } from "./outlook";
import type { DashboardData } from "./types";

/**
 * Live CWA data when an authorization key is configured and at least one core
 * dataset answers; otherwise the clearly labelled demo scenario.
 */
export const loadDashboardData = async (apiKey?: string): Promise<DashboardData> => {
  if (!apiKey) {
    return buildDemoDashboard(["尚未設定中央氣象署授權碼，目前顯示示範資料。"]);
  }
  const { bundle, issues, usable } = await loadCwaBundle(apiKey);
  if (!usable) {
    return buildDemoDashboard([...issues, "中央氣象署資料暫時無法使用，目前顯示示範資料。"]);
  }
  return buildLiveDashboard(bundle, issues);
};
