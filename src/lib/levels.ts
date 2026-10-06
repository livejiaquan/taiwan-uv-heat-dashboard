export interface Level {
  name: string;
  short: string;
  max: number;
}

/** CWA five-level UV scale (WHO categories). */
export const UV_LEVELS: Level[] = [
  { name: "低量級", short: "低量", max: 2 },
  { name: "中量級", short: "中量", max: 5 },
  { name: "高量級", short: "高量", max: 7 },
  { name: "過量級", short: "過量", max: 10 },
  { name: "危險級", short: "危險", max: Infinity },
];

/**
 * Apparent-temperature bands used for guidance. These are this project's own
 * thresholds, not an official CWA or Ministry of Labor classification.
 */
export const HEAT_LEVELS: Level[] = [
  { name: "舒適", short: "舒適", max: 27 },
  { name: "留意", short: "留意", max: 31 },
  { name: "警戒", short: "警戒", max: 35 },
  { name: "危險", short: "危險", max: 39 },
  { name: "極危險", short: "極危險", max: Infinity },
];

const levelOf = (levels: Level[], value?: number): number =>
  value === undefined || !Number.isFinite(value) ? -1 : levels.findIndex((level) => value <= level.max);

/** Index into UV_LEVELS, or -1 when the value is missing. */
export const uvLevel = (uv?: number): number => levelOf(UV_LEVELS, uv === undefined ? undefined : Math.round(uv));

/** Index into HEAT_LEVELS, or -1 when the value is missing. */
export const heatLevel = (apparent?: number): number =>
  levelOf(HEAT_LEVELS, apparent === undefined ? undefined : Math.round(apparent));

export const uvColor = (level: number): string => (level < 0 ? "var(--missing)" : `var(--uv-${level})`);
export const uvInk = (level: number): string => (level < 0 ? "var(--missing-fg)" : `var(--uv-${level}-fg)`);
export const heatColor = (level: number): string => (level < 0 ? "var(--missing)" : `var(--ht-${level})`);
export const heatInk = (level: number): string => (level < 0 ? "var(--missing-fg)" : `var(--ht-${level}-fg)`);

/**
 * CWA 體感溫度 (apparent temperature):
 * AT = 1.04·T + 0.2·e − 0.65·V − 2.7, with e the vapour pressure (hPa) and V wind speed (m/s).
 */
export const apparentTemperature = (
  temperature?: number,
  humidity?: number,
  windSpeed = 0,
): number | undefined => {
  if (temperature === undefined || humidity === undefined) return undefined;
  const rh = Math.min(100, Math.max(0, humidity));
  const vapour = (rh / 100) * 6.105 * Math.exp((17.27 * temperature) / (237.7 + temperature));
  const at = 1.04 * temperature + 0.2 * vapour - 0.65 * Math.max(0, windSpeed) - 2.7;
  return Math.round(at * 10) / 10;
};

/**
 * Relative clear-sky UV through the day, peaking at 1 around 11:30 and zero
 * before 06:00 and after 18:00. Used to spread a daily maximum over the hours.
 */
export const uvDayShape = (hour: number): number => {
  const sun = Math.max(0, Math.sin((Math.PI * (hour + 0.5 - 6)) / 12));
  return Math.pow(sun, 1.5);
};

/** Self-described skin response → minimal erythemal dose (J/m²). */
export const SKIN_TYPES: Array<{ label: string; med: number }> = [
  { label: "容易曬紅、不太會黑", med: 250 },
  { label: "會曬紅，也會曬黑", med: 350 },
  { label: "很少曬紅、容易曬黑", med: 450 },
  { label: "幾乎不會曬紅", med: 600 },
];

/** Minutes until skin reddens without sunscreen; UV index 1 = 0.025 W/m². */
export const burnMinutes = (uv: number, med: number): number => Math.round(med / (uv * 0.025 * 60));

/**
 * CWA 高溫資訊 thresholds on air temperature: 36°C (yellow) and 38°C (orange).
 * Multi-day criteria need several days of observations and are not evaluated.
 */
export const heatAlertFor = (airMax?: number): { name: string; level: 1 | 2 } | null => {
  if (airMax === undefined) return null;
  if (airMax >= 38) return { name: "橙色燈號門檻", level: 2 };
  if (airMax >= 36) return { name: "黃色燈號門檻", level: 1 };
  return null;
};
