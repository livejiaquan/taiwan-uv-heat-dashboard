// Taiwan has no daylight saving time, so Asia/Taipei is always UTC+8.
const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const pad2 = (value: number): string => String(value).padStart(2, "0");

/** Taipei calendar date (YYYY-MM-DD) for an epoch timestamp. */
export const taipeiDate = (ms: number): string =>
  new Date(ms + TAIPEI_OFFSET_MS).toISOString().slice(0, 10);

/** Taipei hour of day (0–23) for an epoch timestamp. */
export const taipeiHour = (ms: number): number =>
  new Date(ms + TAIPEI_OFFSET_MS).getUTCHours();

/** Epoch timestamp of the start of an hour on a Taipei date. */
export const hourStart = (date: string, hour: number): number =>
  Date.parse(`${date}T${pad2(hour)}:00:00+08:00`);

export const addDays = (date: string, days: number): string =>
  taipeiDate(hourStart(date, 12) + days * DAY_MS);

/**
 * CWA timestamps come either as ISO strings with an offset or as
 * "YYYY-MM-DD HH:mm:ss" in Taiwan local time without one.
 */
export const parseCwaTime = (value: unknown): number | undefined => {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const text = value.trim();
  const local = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(:\d{2})?$/.exec(text);
  const iso = local ? `${local[1]}T${local[2]}${local[3] ?? ":00"}+08:00` : text;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : undefined;
};

export const formatClock = (iso?: string): string => {
  if (!iso) return "--";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "--";
  const local = new Date(ms + TAIPEI_OFFSET_MS);
  return `${pad2(local.getUTCMonth() + 1)}/${pad2(local.getUTCDate())} ${pad2(local.getUTCHours())}:${pad2(local.getUTCMinutes())}`;
};

export const formatRelativeAge = (iso: string | undefined, now: number): string => {
  if (!iso) return "時間未知";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "時間未知";
  const minutes = Math.max(0, Math.round((now - ms) / 60000));
  if (minutes < 1) return "剛剛";
  if (minutes < 60) return `${minutes} 分鐘前`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} 小時前`;
  return `${Math.round(hours / 24)} 天前`;
};

export { HOUR_MS };
