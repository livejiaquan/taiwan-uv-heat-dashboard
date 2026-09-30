import { sourceTimestamp } from "./freshness";

export const formatNumber = (value?: number, digits = 1): string =>
  value === undefined || !Number.isFinite(value) ? "--" : value.toFixed(digits);

export const formatInteger = (value?: number): string =>
  value === undefined || !Number.isFinite(value) ? "--" : String(Math.round(value));

export const formatTime = (iso?: string): string => {
  if (!iso) return "--";
  const timestamp = sourceTimestamp(iso, true);
  if (timestamp === undefined) return "時間不明";
  const date = new Date(timestamp);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", month: "2-digit", day: "2-digit" }).format(date);
  }
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

export const formatRelativeAge = (iso?: string): string => {
  if (!iso) return "未知";
  const timestamp = sourceTimestamp(iso);
  if (timestamp === undefined || timestamp > Date.now()) return "時間待確認";
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return "剛剛";
  if (minutes < 60) return `${minutes} 分鐘前`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} 小時前`;
  return `${Math.round(hours / 24)} 天前`;
};
