import { normalizeCountyName } from "../data/counties";
import { parseDailyUvPayload, parseObservationPayload, stationCountyMap } from "./cwa";
import { mergeForecasts, parseForecastPayload } from "./forecast";
import { asRecord } from "./parse";
import type { CountyForecast, RawCwaBundle, StationObservation, WeatherSnapshot } from "./types";

export const SNAPSHOT_MAX_AGE_MS = 2 * 60 * 60_000;

export const createWeatherSnapshot = (bundle: RawCwaBundle, issues: string[], now = Date.now()): WeatherSnapshot => ({
  schemaVersion: 1,
  fetchedAt: new Date(now).toISOString(),
  observations: parseObservationPayload(bundle.observations),
  dailyUv: parseDailyUvPayload(bundle.dailyUv, stationCountyMap(bundle.observations)),
  forecasts: [...mergeForecasts(parseForecastPayload(bundle.forecast3d), parseForecastPayload(bundle.forecastWeek), parseForecastPayload(bundle.forecast36h)).values()],
  issues,
});

const numeric = (value: unknown, min = -Infinity, max = Infinity): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
const optionalNumber = (value: unknown, min: number, max: number) => value === undefined || numeric(value, min, max);
const optionalText = (value: unknown) => value === undefined || typeof value === "string";
const countyName = (value: unknown) => typeof value === "string" && normalizeCountyName(value) === value;
const timestamp = (value: unknown) => typeof value === "string" && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
const epoch = (value: unknown): value is number => numeric(value) && Number.isFinite(new Date(value + 8 * 3600_000).getTime());

const validStation = (input: unknown): input is StationObservation => {
  const s = asRecord(input);
  return countyName(s.county) && typeof s.stationId === "string" && typeof s.stationName === "string" && optionalText(s.town)
    && (s.observedAt === undefined || timestamp(s.observedAt))
    && optionalNumber(s.uvIndex, 0, 30) && optionalNumber(s.temperature, -50, 60)
    && optionalNumber(s.humidity, 0, 100) && optionalNumber(s.windSpeed, 0, 100);
};

const validForecast = (input: unknown): input is CountyForecast => {
  const f = asRecord(input);
  if (!countyName(f.county)) return false;
  for (const [key, min, max] of [["temperature", -50, 60], ["apparent", -80, 80], ["humidity", 0, 100]] as const) {
    if (!Array.isArray(f[key]) || !f[key].every((p: unknown) => epoch(asRecord(p).time) && numeric(asRecord(p).value, min, max))) return false;
  }
  for (const [key, min, max] of [["rain", 0, 100], ["uvDaily", 0, 30], ["maxTemperature", -50, 60], ["weather", 0, 0]] as const) {
    if (!Array.isArray(f[key]) || !f[key].every((p: unknown) => {
      const b = asRecord(p);
      return epoch(b.start) && epoch(b.end) && b.end > b.start
        && (key === "weather" ? typeof b.text === "string" : numeric(b.value, min, max));
    })) return false;
  }
  return true;
};

export const parseWeatherSnapshot = (input: unknown): WeatherSnapshot => {
  const s = asRecord(input);
  if (s.schemaVersion !== 1 || !timestamp(s.fetchedAt)
    || !Array.isArray(s.observations) || !s.observations.every(validStation)
    || !Array.isArray(s.dailyUv) || !s.dailyUv.every(validStation)
    || !Array.isArray(s.forecasts) || !s.forecasts.every(validForecast)
    || !Array.isArray(s.issues) || !s.issues.every((issue) => typeof issue === "string")) {
    throw new Error("氣象資料快照格式無效，請稍後再試。");
  }
  return s as unknown as WeatherSnapshot;
};
