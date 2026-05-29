export const formatNumber = (value?: number, digits = 1): string =>
  value === undefined || Number.isNaN(value) ? "--" : value.toFixed(digits);

export const formatInteger = (value?: number): string =>
  value === undefined || Number.isNaN(value) ? "--" : String(Math.round(value));

export const formatTime = (iso?: string): string => {
  if (!iso) return "--";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

export const formatRelativeAge = (iso?: string): string => {
  if (!iso) return "未知";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "剛剛";
  if (minutes < 60) return `${minutes} 分鐘前`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} 小時前`;
  return `${Math.round(hours / 24)} 天前`;
};
