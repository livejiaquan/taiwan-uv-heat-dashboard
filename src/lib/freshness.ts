import { formatClock, formatRelativeAge, taipeiDate } from "./time";

/**
 * How old the data is, measured in the browser from the data's own time.
 * Scheduled GitHub Actions runs are best effort and in practice arrive every
 * 3–4 hours, so the tiers follow what the schedule can actually deliver.
 */
export type Freshness = "live" | "aging" | "old" | "unusable";

export const LIVE_MAX_MS = 90 * 60_000;
export const AGING_MAX_MS = 6 * 60 * 60_000;
export const OLD_MAX_MS = 24 * 60 * 60_000;

export const freshnessOf = (dataTime: string, now: number): Freshness => {
  const age = now - Date.parse(dataTime);
  if (!Number.isFinite(age) || age <= LIVE_MAX_MS) return "live";
  if (age <= AGING_MAX_MS) return "aging";
  if (age <= OLD_MAX_MS) return "old";
  return "unusable";
};

/** 「資料時間 HH:MM · N 小時前」; the date is added once the data is from another day. */
export const dataTimeLabel = (dataTime: string, now: number): string => {
  const clock = formatClock(dataTime);
  const timestamp = Date.parse(dataTime);
  const shown = Number.isFinite(timestamp) && taipeiDate(timestamp) === taipeiDate(now) ? clock.slice(-5) : clock;
  return `資料時間 ${shown} · ${formatRelativeAge(dataTime, now)}`;
};
