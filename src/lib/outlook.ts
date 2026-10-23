import { counties } from "../data/counties";
import { blockAt, emptyForecast, valueAt } from "./forecast";
import { createWeatherSnapshot } from "./snapshot";
import { apparentTemperature, uvDayShape } from "./levels";
import { HOUR_MS, addDays, hourStart, taipeiDate, taipeiHour } from "./time";
import type { CountyForecast, CountyOutlook, DashboardData, DayOutlook, HourPoint, MetricOrigin, RawCwaBundle, StationObservation, WeatherSnapshot } from "./types";

export const STALE_AFTER_MINUTES = 45;
/** Observations older than this are not shown as the current hour. */
const OBSERVATION_MAX_AGE_MS = STALE_AFTER_MINUTES * 60_000;
const CLOCK_SKEW_MS = 5 * 60 * 1000;

const round1 = (value: number) => Math.round(value * 10) / 10;
const maxOf = (values: Array<number | undefined>): number | undefined => {
  const known = values.filter((v): v is number => v !== undefined && Number.isFinite(v));
  return known.length ? Math.max(...known) : undefined;
};

/** Fill in the day's summary values from its hours. */
export const summarizeDay = (day: Omit<DayOutlook, "uvMax" | "apparentMax" | "airMax">, extraAirMax?: number): DayOutlook => ({
  ...day,
  uvMax: maxOf(day.hours.map((h) => h.uv)),
  apparentMax: maxOf(day.hours.map((h) => h.apparent)),
  airMax: maxOf([...day.hours.map((h) => h.temperature), extraAirMax]),
});

const validTime = (iso: string | undefined, now: number): number | undefined => {
  if (!iso) return undefined;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) && ms <= now + CLOCK_SKEW_MS ? ms : undefined;
};

interface CurrentReading {
  observedAt?: string;
  uv?: number;
  temperature?: number;
  apparent?: number;
  uvOrigin?: MetricOrigin;
  apparentOrigin?: MetricOrigin;
  temperatureOrigin?: MetricOrigin;
}

const stationOrigin = (s: StationObservation): MetricOrigin => ({ kind: "observation", observedAt: s.observedAt, stationName: s.stationName, stationId: s.stationId });

/** County-level current reading: the strongest UV and the most oppressive station. */
const currentReading = (stations: StationObservation[], now: number): CurrentReading => {
  const fresh = stations.filter((s) => {
    const time = validTime(s.observedAt, now);
    return time !== undefined && now - time <= OBSERVATION_MAX_AGE_MS;
  });
  const uvStation = fresh.filter((s) => s.uvIndex !== undefined).sort((a, b) => b.uvIndex! - a.uvIndex!)[0];
  const uv = uvStation?.uvIndex;
  let apparent: number | undefined;
  let temperature: number | undefined;
  let heatStation: StationObservation | undefined;
  for (const s of fresh) {
    const at = apparentTemperature(s.temperature, s.humidity, s.windSpeed);
    if (at !== undefined && (apparent === undefined || at > apparent)) {
      apparent = at;
      temperature = s.temperature;
      heatStation = s;
    }
  }
  const temperatureStation = heatStation ?? fresh.filter((s) => s.temperature !== undefined).sort((a, b) => b.temperature! - a.temperature!)[0];
  temperature ??= temperatureStation?.temperature;
  const observedAt = [uvStation, heatStation, temperatureStation]
    .filter((s): s is StationObservation => Boolean(s))
    .map((s) => s.observedAt!)
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
  return { observedAt, uv, temperature, apparent,
    uvOrigin: uvStation ? stationOrigin(uvStation) : undefined,
    apparentOrigin: heatStation ? stationOrigin(heatStation) : undefined,
    temperatureOrigin: temperatureStation ? stationOrigin(temperatureStation) : undefined,
  };
};

/** Daily UV maximum for a date: the forecast block starting that day, else today's observed maximum. */
const dayUvMax = (forecast: CountyForecast, date: string, observedDailyMax?: number): number | undefined => {
  const blocks = forecast.uvDaily.filter((b) => taipeiDate(b.start) === date || taipeiDate(b.end - 1) === date);
  return maxOf(blocks.map((b) => b.value)) ?? observedDailyMax;
};

const buildDay = (
  forecast: CountyForecast,
  date: string,
  now: number,
  current: CurrentReading | undefined,
  observedDailyMax: number | undefined,
): DayOutlook => {
  const uvMax = dayUvMax(forecast, date, observedDailyMax);
  const nowHour = taipeiDate(now) === date ? taipeiHour(now) : -1;

  const hours: HourPoint[] = Array.from({ length: 24 }, (_, hour) => {
    const time = hourStart(date, hour);
    const temperature = valueAt(forecast.temperature, time);
    const humidity = valueAt(forecast.humidity, time);
    const apparent = valueAt(forecast.apparent, time) ?? apparentTemperature(temperature, humidity);
    const rain = blockAt(forecast.rain, time + HOUR_MS / 2)?.value;
    const point: HourPoint = {
      uv: uvMax === undefined ? undefined : Math.round(uvMax * uvDayShape(hour)),
      apparent: apparent === undefined ? undefined : round1(apparent),
      temperature: temperature === undefined ? undefined : round1(temperature),
      rain,
      observed: false,
      uvOrigin: uvMax === undefined ? undefined : { kind: "estimate" },
      apparentOrigin: apparent === undefined ? undefined : { kind: valueAt(forecast.apparent, time) === undefined ? "estimate" : "forecast" },
      temperatureOrigin: temperature === undefined ? undefined : { kind: "forecast" },
    };
    if (hour === nowHour && current) {
      // The current hour shows what the stations measure right now.
      if (current.uv !== undefined) { point.uv = current.uv; point.uvOrigin = current.uvOrigin; }
      if (current.temperature !== undefined) { point.temperature = current.temperature; point.temperatureOrigin = current.temperatureOrigin; }
      if (current.apparent !== undefined) { point.apparent = current.apparent; point.apparentOrigin = current.apparentOrigin; }
      point.observed = current.uv !== undefined || current.apparent !== undefined;
    }
    return point;
  });

  const noon = hourStart(date, 12);
  const weatherTime = nowHour >= 0 ? Math.max(now, hourStart(date, 0)) : noon;
  const weather = (blockAt(forecast.weather, weatherTime) ?? blockAt(forecast.weather, noon))?.text;
  const forecastMax = maxOf(
    forecast.maxTemperature
      .filter((b) => taipeiDate(b.start) === date && taipeiHour(b.start) < 18)
      .map((b) => b.value),
  );
  return summarizeDay({ date, weather, hours }, forecastMax);
};

export const buildLiveDashboard = (bundle: RawCwaBundle, issues: string[], now = Date.now()): DashboardData =>
  buildSnapshotDashboard(createWeatherSnapshot(bundle, issues, now), now);

export const buildSnapshotDashboard = (snapshot: WeatherSnapshot, now = Date.now()): DashboardData => {
  // Old snapshots are still shown: forecasts stay tied to their own hours and
  // observations older than OBSERVATION_MAX_AGE_MS are never used as "now".
  // The UI labels the data's age instead (see lib/freshness.ts).
  const ahead = Date.parse(snapshot.fetchedAt) - now > CLOCK_SKEW_MS;
  const { observations, dailyUv } = snapshot;
  const forecasts = new Map(snapshot.forecasts.map((f) => [f.county, f]));
  const issues = ahead ? ["資料時間比這台裝置的時鐘還晚，請確認裝置時間是否正確。", ...snapshot.issues] : snapshot.issues;
  const today = taipeiDate(now);
  const tomorrow = addDays(today, 1);

  const outlooks: CountyOutlook[] = counties.map((meta) => {
    const stations = observations.filter((s) => s.county === meta.county);
    const current = currentReading(stations, now);
    const todaysObservedUvMax = maxOf(
      dailyUv
        .filter((s) => s.county === meta.county && s.observedAt && taipeiDate(Date.parse(s.observedAt)) === today)
        .map((s) => s.uvIndex),
    );
    const forecast = forecasts.get(meta.county) ?? emptyForecast(meta.county);
    return {
      ...meta,
      observedAt: current.observedAt,
      stationCount: stations.length,
      days: [
        buildDay(forecast, today, now, current, todaysObservedUvMax),
        buildDay(forecast, tomorrow, now, undefined, undefined),
      ],
    };
  });

  const latestObservation = outlooks
    .map((c) => c.observedAt)
    .filter((t): t is string => Boolean(t))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
  const stale =
    !latestObservation || (now - Date.parse(latestObservation)) / 60000 > STALE_AFTER_MINUTES;
  const missing = outlooks.filter((c) => c.days[0].uvMax === undefined && c.days[0].apparentMax === undefined).length;

  // The data's own time: the newest station reading the snapshot carries, else when it was fetched.
  const dataTime =
    observations
      .map((s) => validTime(s.observedAt, Date.parse(snapshot.fetchedAt)))
      .filter((t): t is number => t !== undefined)
      .sort((a, b) => b - a)
      .map((t) => new Date(t).toISOString())[0] ?? snapshot.fetchedAt;

  return {
    mode: "live",
    counties: outlooks,
    generatedAt: snapshot.fetchedAt,
    dataTime,
    latestObservation,
    stale,
    issues: missing ? [...issues, `${missing} 個縣市目前缺少紫外線與體感溫度資料`] : issues,
  };
};
