import { normalizeCountyName } from "../data/counties";
import { asArray, asRecord, toNumber, toText } from "./parse";
import { parseCwaTime } from "./time";
import type { CountyForecast, SeriesBlock, SeriesPoint, TextBlock } from "./types";

// Element names across CWA API generations (Chinese names since 2024, codes before).
const ELEMENTS = {
  temperature: ["溫度", "T"],
  apparent: ["體感溫度", "AT"],
  humidity: ["相對濕度", "RH"],
  rain: ["3小時降雨機率", "6小時降雨機率", "12小時降雨機率", "PoP3h", "PoP6h", "PoP12h", "PoP"],
  weather: ["天氣現象", "Wx"],
  uvDaily: ["紫外線指數", "UVI"],
  maxTemperature: ["最高溫度", "MaxT"],
} as const;

type ElementKey = keyof typeof ELEMENTS;

const elementKey = (name?: string): ElementKey | undefined =>
  name ? (Object.keys(ELEMENTS) as ElementKey[]).find((key) => (ELEMENTS[key] as readonly string[]).includes(name)) : undefined;

export const emptyForecast = (county: string): CountyForecast => ({
  county,
  temperature: [],
  apparent: [],
  humidity: [],
  rain: [],
  weather: [],
  uvDaily: [],
  maxTemperature: [],
});

/** First usable value of a CWA time entry: `value`, `parameterName`, or a named field. */
const entryValue = (time: Record<string, unknown>): { number?: number; text?: string } => {
  const values = asArray(time.ElementValue ?? time.elementValue).map(asRecord);
  const parameter = asRecord(time.parameter);
  const candidates: unknown[] = [];
  for (const value of values) {
    candidates.push(value.value);
    // Since 2024 values are keyed by meaning (Temperature, Weather, UVIndex, …).
    for (const [key, field] of Object.entries(value)) {
      if (key !== "value" && key !== "measures" && !/Code$/i.test(key) && !/Level$/i.test(key)) candidates.push(field);
    }
  }
  candidates.push(parameter.parameterName);
  const number = candidates.map(toNumber).find((value) => value !== undefined);
  const text = candidates.map(toText).find((value) => value !== undefined && toNumber(value) === undefined);
  return { number, text };
};

const addTo = (forecast: CountyForecast, key: ElementKey, time: Record<string, unknown>) => {
  const point = parseCwaTime(time.DataTime ?? time.dataTime);
  const start = parseCwaTime(time.StartTime ?? time.startTime);
  const end = parseCwaTime(time.EndTime ?? time.endTime);
  const { number, text } = entryValue(time);

  if (key === "weather") {
    if (start !== undefined && end !== undefined && text) forecast.weather.push({ start, end, text } satisfies TextBlock);
    return;
  }
  if (number === undefined) return;
  if (key === "temperature" || key === "apparent" || key === "humidity") {
    // Point series; a block (older datasets) is treated as valid at its start.
    const at = point ?? start;
    if (at !== undefined) forecast[key].push({ time: at, value: number } satisfies SeriesPoint);
    return;
  }
  if (start !== undefined && end !== undefined) {
    forecast[key].push({ start, end, value: number } satisfies SeriesBlock);
  } else if (point !== undefined && key === "rain") {
    forecast.rain.push({ start: point, end: point + 3 * 3600_000, value: number });
  }
};

/**
 * Parse CWA forecast payloads (F-D0047-089/091 county forecasts, F-C0032-001)
 * into per-county series. Unknown counties and elements are ignored.
 */
export const parseForecastPayload = (payload: unknown): CountyForecast[] => {
  const records = asRecord(asRecord(payload).records);
  const groups = asArray(records.Locations ?? records.locations);
  const locations = groups.length
    ? groups.flatMap((group) => asArray(asRecord(group).Location ?? asRecord(group).location))
    : asArray(records.location ?? records.Location);

  const byCounty = new Map<string, CountyForecast>();
  for (const raw of locations) {
    const location = asRecord(raw);
    const county = normalizeCountyName(toText(location.LocationName) ?? toText(location.locationName));
    if (!county) continue;
    const forecast = byCounty.get(county) ?? emptyForecast(county);
    byCounty.set(county, forecast);
    for (const rawElement of asArray(location.WeatherElement ?? location.weatherElement)) {
      const element = asRecord(rawElement);
      const key = elementKey(toText(element.ElementName) ?? toText(element.elementName));
      if (!key) continue;
      for (const time of asArray(element.Time ?? element.time)) addTo(forecast, key, asRecord(time));
    }
  }
  for (const forecast of byCounty.values()) {
    forecast.temperature.sort((a, b) => a.time - b.time);
    forecast.apparent.sort((a, b) => a.time - b.time);
    forecast.humidity.sort((a, b) => a.time - b.time);
  }
  return [...byCounty.values()];
};

/** Merge forecasts; earlier sources win where both cover the same instant or hour. */
export const mergeForecasts = (...sources: CountyForecast[][]): Map<string, CountyForecast> => {
  const merged = new Map<string, CountyForecast>();
  for (const list of sources) {
    for (const forecast of list) {
      const target = merged.get(forecast.county) ?? emptyForecast(forecast.county);
      merged.set(forecast.county, target);
      for (const key of ["temperature", "apparent", "humidity"] as const) {
        const seen = new Set(target[key].map((p) => p.time));
        target[key].push(...forecast[key].filter((p) => !seen.has(p.time)));
        target[key].sort((a, b) => a.time - b.time);
      }
      // Blocks are kept in source order; blockAt returns the first match, so a
      // coarser source only fills hours the finer one doesn't cover.
      target.rain.push(...forecast.rain);
      target.uvDaily.push(...forecast.uvDaily);
      target.maxTemperature.push(...forecast.maxTemperature);
      target.weather.push(...forecast.weather);
    }
  }
  return merged;
};

/** Linear interpolation between neighbouring points no more than `maxGap` apart. */
export const valueAt = (points: SeriesPoint[], time: number, maxGap = 6 * 3600_000): number | undefined => {
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.time === time) return p.value;
    if (p.time > time) {
      const prev = points[i - 1];
      if (!prev || p.time - prev.time > maxGap) return undefined;
      const ratio = (time - prev.time) / (p.time - prev.time);
      return prev.value + (p.value - prev.value) * ratio;
    }
  }
  return undefined;
};

export const blockAt = <T extends { start: number; end: number }>(blocks: T[], time: number): T | undefined =>
  blocks.find((block) => block.start <= time && time < block.end);
