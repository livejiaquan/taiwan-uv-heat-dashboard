import type { CountyRisk } from "./types";

export const OBSERVATION_MAX_AGE_MS = 45 * 60 * 1000;
export const SOURCE_CLOCK_SKEW_MS = 5 * 60 * 1000;

// CWA zone-less timestamps describe Taiwan local time, never the viewer's timezone.
export const sourceTimestamp = (value?: string, allowDateOnly = false): number | undefined => {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/.exec(value);
  if (!match || (!allowDateOnly && !match[4])) return undefined;
  const [, year, month, day, hour, minute, second, zone] = match;
  const calendar = new Date(Date.UTC(+year, +month - 1, +day));
  if (calendar.getUTCFullYear() !== +year || calendar.getUTCMonth() !== +month - 1 || calendar.getUTCDate() !== +day) return undefined;
  if (+(hour ?? 0) > 23 || +(minute ?? 0) > 59 || +(second ?? 0) > 59) return undefined;
  const timestamp = Date.parse(`${year}-${month}-${day}T${hour ?? "00"}:${minute ?? "00"}:${second ?? "00"}${zone ?? "+08:00"}`);
  return Number.isFinite(timestamp) ? timestamp : undefined;
};

export const isCurrentObservation = (value: string | undefined, now: number): boolean => {
  const timestamp = sourceTimestamp(value);
  return timestamp !== undefined && timestamp <= now + SOURCE_CLOCK_SKEW_MS && now - timestamp <= OBSERVATION_MAX_AGE_MS;
};

const taiwanDay = (timestamp: number) => new Date(timestamp + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const isTodaysDailyUv = (value: string | undefined, now: number): boolean => {
  const timestamp = sourceTimestamp(value, true);
  return timestamp !== undefined && timestamp <= now + SOURCE_CLOCK_SKEW_MS && taiwanDay(timestamp) === taiwanDay(now);
};

export const isUsableForecast = (start: string | undefined, end: string | undefined, now: number): boolean => {
  const startAt = sourceTimestamp(start);
  const endAt = sourceTimestamp(end);
  return startAt !== undefined && endAt !== undefined && startAt < endAt && endAt > now && startAt <= now + 36 * 60 * 60 * 1000 && endAt <= now + 48 * 60 * 60 * 1000;
};

export const dataStatusCopy: Record<CountyRisk["dataStatus"], string> = {
  demo: "示範資料・非即時",
  current: "觀測時效內",
  limited: "資料不完整・無法確認低風險",
  stale: "觀測過期或時間不明",
  missing: "缺少可用資料",
};

export const lowRiskCounties = (counties: CountyRisk[]): CountyRisk[] =>
  counties.filter((county) => county.dataStatus === "current" && county.overallLevel.score === 0)
    .sort((a, b) => a.overallScore - b.overallScore);
