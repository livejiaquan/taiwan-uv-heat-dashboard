import { counties, normalizeCountyName } from "../data/counties";
import { buildAdvice, heatIndexCelsius, uvRiskLevel } from "./risk";
import type {
  CountyForecast,
  CountyRisk,
  DashboardData,
  RawCwaBundle,
  StationObservation,
} from "./types";

const CWA_BASE = "https://opendata.cwa.gov.tw/api/v1/rest/datastore";
const CWA_TIMEOUT_MS = 12_000;
const OBSERVATION_STALE_MINUTES = 45;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

export class CwaDataUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CwaDataUnavailableError";
  }
}

const toFiniteNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  const text = typeof value === "string" ? value.trim() : String(value);
  if (!text) return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toTemperature = (value: unknown): number | undefined => {
  const parsed = toFiniteNumber(value);
  return parsed !== undefined && parsed >= -50 && parsed <= 60 ? parsed : undefined;
};

const toUvIndex = (value: unknown): number | undefined => {
  const parsed = toFiniteNumber(value);
  return parsed !== undefined && parsed >= 0 && parsed <= 30 ? parsed : undefined;
};

const toHumidityPercent = (value: unknown): number | undefined => {
  const parsed = toFiniteNumber(value);
  if (parsed === undefined || parsed < 0 || parsed > 100) return undefined;
  return parsed;
};

const toText = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim()) return value.trim();
  return undefined;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const asArray = <T = unknown>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value === undefined || value === null) return [];
  return [value as T];
};

const toTimestamp = (value: unknown): string | undefined => {
  const text = toText(value);
  if (!text) return undefined;
  const timestamp = Date.parse(text);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined;
};

const toObservationTimestamp = (
  value: unknown,
  nowMs: number,
): string | undefined => {
  const timestamp = toTimestamp(value);
  if (!timestamp) return undefined;
  return Date.parse(timestamp) <= nowMs + MAX_FUTURE_SKEW_MS ? timestamp : undefined;
};

const findElementValue = (
  elements: unknown,
  names: string[],
  parser: (value: unknown) => number | undefined,
): number | undefined => {
  if (!Array.isArray(elements)) return undefined;

  for (const element of elements) {
    const record = asRecord(element);
    const name = toText(record.elementName) ?? toText(record.ElementName);
    if (name && names.includes(name)) {
      return parser(
        record.elementValue ??
          record.ElementValue ??
          asRecord(record.parameter).parameterName,
      );
    }
  }

  return undefined;
};

const latestIso = (dates: Array<string | undefined>): string | undefined =>
  dates
    .filter(
      (date): date is string =>
        typeof date === "string" && Number.isFinite(Date.parse(date)),
    )
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0];

const isObservationStale = (date: string | undefined, nowMs: number) =>
  date ? (nowMs - Date.parse(date)) / 60_000 > OBSERVATION_STALE_MINUTES : undefined;

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export const fetchCwaJson = async (
  dataId: string,
  apiKey: string,
): Promise<unknown> => {
  const url = new URL(`${CWA_BASE}/${dataId}`);
  url.searchParams.set("format", "JSON");
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), CWA_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        Authorization: apiKey,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`${dataId} HTTP ${response.status}`);
    }

    const json = (await response.json()) as { success?: string };
    if (json.success === "false") {
      throw new Error(`${dataId} returned success=false`);
    }
    return json;
  } finally {
    globalThis.clearTimeout(timeout);
  }
};

export const loadCwaBundle = async (apiKey?: string): Promise<{
  bundle: RawCwaBundle;
  errors: string[];
}> => {
  if (!apiKey?.trim()) {
    throw new CwaDataUnavailableError(
      "正式資料服務尚未設定，本站目前無法提供可靠的即時判讀。",
    );
  }

  const [observations, forecast] = await Promise.allSettled([
    fetchCwaJson("O-A0003-001", apiKey),
    fetchCwaJson("F-C0032-001", apiKey),
  ]);

  const errors: string[] = [];
  const bundle: RawCwaBundle = {};

  if (observations.status === "fulfilled") {
    const parsed = parseObservationPayload(observations.value);
    const hasCurrentValue = parsed.some(
      (item) => item.temperature !== undefined || item.uvIndex !== undefined,
    );
    if (hasCurrentValue) {
      bundle.observations = observations.value;
    } else {
      errors.push("O-A0003-001 測站觀測沒有具有效時間的可用 UV 或氣溫資料。");
    }
  } else {
    errors.push(`O-A0003-001 測站觀測讀取失敗：${errorText(observations.reason)}`);
  }

  if (forecast.status === "fulfilled") {
    const hasForecastValue = parseForecastPayload(forecast.value).some(
      (item) => item.maxTemperature !== undefined,
    );
    if (hasForecastValue) {
      bundle.forecast = forecast.value;
    } else {
      errors.push("F-C0032-001 36 小時預報沒有可用的最高溫時段。");
    }
  } else {
    errors.push(`F-C0032-001 36 小時預報讀取失敗：${errorText(forecast.reason)}`);
  }

  if (!bundle.observations) {
    throw new CwaDataUnavailableError(
      "中央氣象署測站觀測目前無法驗證；為避免把預報或範例誤當現在狀況，本站暫停風險判讀。",
    );
  }

  return { bundle, errors };
};

export const parseObservationPayload = (
  payload: unknown,
  nowMs = Date.now(),
): StationObservation[] => {
  const records = asRecord(asRecord(payload).records);
  const stations = asArray(
    records.Station ?? records.station ?? records.location ?? records.Location,
  );

  return stations
    .map((station): StationObservation | undefined => {
      const record = asRecord(station);
      const geo = asRecord(record.GeoInfo ?? record.geoInfo);
      const weather = asRecord(record.WeatherElement ?? record.weatherElement);
      const obsTime = asRecord(record.ObsTime ?? record.obsTime);
      const county = normalizeCountyName(
        toText(geo.CountyName) ??
          toText(record.CountyName) ??
          toText(record.countyName),
      );
      const observedAt = toObservationTimestamp(
        toText(obsTime.DateTime) ??
          toText(record.DateTime) ??
          toText(record.observedAt),
        nowMs,
      );

      if (!county || !observedAt) return undefined;

      const elements = record.weatherElement ?? record.WeatherElement;
      const temperature =
        toTemperature(weather.AirTemperature) ??
        findElementValue(elements, ["AirTemperature", "氣溫"], toTemperature);
      const humidity =
        toHumidityPercent(weather.RelativeHumidity) ??
        findElementValue(
          elements,
          ["RelativeHumidity", "相對濕度"],
          toHumidityPercent,
        );
      const uvIndex =
        toUvIndex(weather.UVIndex) ??
        toUvIndex(weather.UVI) ??
        findElementValue(elements, ["UVIndex", "UVI", "紫外線指數"], toUvIndex);

      if (temperature === undefined && humidity === undefined && uvIndex === undefined) {
        return undefined;
      }

      return {
        stationId:
          toText(record.StationId) ??
          toText(record.StationID) ??
          toText(record.stationId) ??
          "unknown",
        stationName:
          toText(record.StationName) ??
          toText(record.stationName) ??
          toText(record.locationName) ??
          "未知測站",
        county,
        town: toText(geo.TownName) ?? toText(record.TownName),
        observedAt,
        temperature,
        humidity,
        uvIndex,
      };
    })
    .filter((item): item is StationObservation => Boolean(item));
};

export const parseForecastPayload = (payload: unknown): CountyForecast[] => {
  const records = asRecord(asRecord(payload).records);
  const locations = asArray(records.location ?? records.Location);

  return locations
    .map((location): CountyForecast | undefined => {
      const record = asRecord(location);
      const county = normalizeCountyName(
        toText(record.locationName) ?? toText(record.LocationName),
      );
      if (!county) return undefined;

      const elements = asArray(record.weatherElement ?? record.WeatherElement);
      const getElement = (name: string) =>
        elements.find(
          (element) =>
            (toText(asRecord(element).elementName) ??
              toText(asRecord(element).ElementName)) === name,
        );
      const times = (element: unknown) =>
        asArray(asRecord(element).time ?? asRecord(element).Time).map(asRecord);
      const parameterName = (time: Record<string, unknown>) =>
        toText(asRecord(time.parameter ?? time.Parameter).parameterName) ??
        toText(asRecord(time.parameter ?? time.Parameter).ParameterName);

      const maxPeriods = times(getElement("MaxT"))
        .map((time) => ({
          value: toTemperature(parameterName(time)),
          startTime: toTimestamp(time.startTime ?? time.StartTime),
          endTime: toTimestamp(time.endTime ?? time.EndTime),
        }))
        .filter(
          (period): period is {
            value: number;
            startTime: string;
            endTime: string;
          } =>
            period.value !== undefined &&
            typeof period.startTime === "string" &&
            typeof period.endTime === "string" &&
            Date.parse(period.startTime) < Date.parse(period.endTime),
        );
      const maxPeriod = maxPeriods.sort((a, b) => b.value - a.value)[0];
      const minTemperature = times(getElement("MinT"))
        .map((time) => toTemperature(parameterName(time)))
        .filter((value): value is number => value !== undefined)
        .sort((a, b) => a - b)[0];
      const weatherTimes = times(getElement("Wx"));
      const weatherPeriod =
        weatherTimes.find(
          (time) =>
            toTimestamp(time.startTime ?? time.StartTime) === maxPeriod?.startTime,
        ) ?? weatherTimes[0];

      return {
        county,
        maxTemperature: maxPeriod?.value,
        minTemperature,
        weather: weatherPeriod ? parameterName(weatherPeriod) : undefined,
        startTime: maxPeriod?.startTime,
        endTime: maxPeriod?.endTime,
      };
    })
    .filter((item): item is CountyForecast => Boolean(item));
};

const pickMax = <T>(
  values: T[],
  selector: (item: T) => number | undefined,
): T | undefined =>
  values
    .filter((item) => selector(item) !== undefined)
    .sort((a, b) => (selector(b) ?? -Infinity) - (selector(a) ?? -Infinity))[0];

const pickLatest = <T>(
  values: T[],
  selector: (item: T) => string | undefined,
): T | undefined =>
  values
    .filter((item) => {
      const date = selector(item);
      return typeof date === "string" && Number.isFinite(Date.parse(date));
    })
    .sort((a, b) => Date.parse(selector(b) ?? "") - Date.parse(selector(a) ?? ""))[0];

export const buildDashboardData = (
  errors: string[],
  bundle: RawCwaBundle,
  nowMs = Date.now(),
): DashboardData => {
  const observations = parseObservationPayload(bundle.observations, nowMs);
  const forecasts = parseForecastPayload(bundle.forecast);
  const forecastByCounty = new Map(forecasts.map((item) => [item.county, item]));

  const countyRisks: CountyRisk[] = counties.map((meta) => {
    const countyObservations = observations.filter(
      (item) => item.county === meta.county,
    );
    const freshObservations = countyObservations.filter(
      (item) => isObservationStale(item.observedAt, nowMs) === false,
    );
    const freshHottest = pickMax(freshObservations, (item) => item.temperature);
    const staleHottest = pickLatest(
      countyObservations.filter((item) => item.temperature !== undefined),
      (item) => item.observedAt,
    );
    const hottest = freshHottest ?? staleHottest;
    const freshHeatIndex = pickMax(freshObservations, (item) =>
      heatIndexCelsius(item.temperature, item.humidity),
    );
    const staleHeatIndex = pickLatest(
      countyObservations.filter(
        (item) => heatIndexCelsius(item.temperature, item.humidity) !== undefined,
      ),
      (item) => item.observedAt,
    );
    const highestHeatIndex = freshHeatIndex ?? staleHeatIndex;
    const freshUv = pickMax(freshObservations, (item) => item.uvIndex);
    const staleUv = pickLatest(
      countyObservations.filter((item) => item.uvIndex !== undefined),
      (item) => item.observedAt,
    );
    const currentUv = freshUv ?? staleUv;
    const forecast = forecastByCounty.get(meta.county);
    const heatIndex = heatIndexCelsius(
      highestHeatIndex?.temperature,
      highestHeatIndex?.humidity,
    );
    const uvStale =
      currentUv?.uvIndex !== undefined
        ? isObservationStale(currentUv.observedAt, nowMs)
        : undefined;
    const temperatureStale =
      hottest?.temperature !== undefined
        ? isObservationStale(hottest.observedAt, nowMs)
        : undefined;
    const heatIndexStale =
      heatIndex !== undefined
        ? isObservationStale(highestHeatIndex?.observedAt, nowMs)
        : undefined;
    const uvIndex = currentUv?.uvIndex;
    const uvLevel = uvStale ? uvRiskLevel(undefined) : uvRiskLevel(uvIndex);
    const priorityLevel = uvLevel;
    const hasCurrentUv = uvIndex !== undefined && uvStale === false;
    const hasCurrentTemperature =
      hottest?.temperature !== undefined && temperatureStale === false;
    const dataQuality =
      hasCurrentUv && hasCurrentTemperature
        ? "complete"
        : hasCurrentUv || hasCurrentTemperature
          ? "partial"
          : "missing";
    const priorityScore =
      priorityLevel.score < 0
        ? -1
        : priorityLevel.score * 100 + (uvIndex ?? 0);
    const risk: CountyRisk = {
      ...meta,
      observedAt: latestIso([
        hottest?.observedAt,
        highestHeatIndex?.observedAt,
        currentUv?.observedAt,
      ]),
      stationCount: countyObservations.length,
      uvIndex,
      uvObservedAt: currentUv?.observedAt,
      uvStationName: currentUv?.stationName,
      uvStale,
      observedTemperature: hottest?.temperature,
      humidity: highestHeatIndex?.humidity ?? hottest?.humidity,
      heatIndex,
      heatIndexObservedAt: highestHeatIndex?.observedAt,
      heatIndexStationName: highestHeatIndex?.stationName,
      heatIndexStale,
      temperatureObservedAt: hottest?.observedAt,
      temperatureStationName: hottest?.stationName,
      temperatureStale,
      forecastMaxTemperature: forecast?.maxTemperature,
      forecastWeather: forecast?.weather,
      forecastStartTime: forecast?.startTime,
      forecastEndTime: forecast?.endTime,
      dataQuality,
      uvLevel,
      priorityLevel,
      priorityScore,
      stale:
        uvStale === true ||
        temperatureStale === true ||
        heatIndexStale === true,
      advice: [],
    };
    return { ...risk, advice: buildAdvice(risk) };
  });

  const sorted = [...countyRisks].sort(
    (a, b) => b.priorityScore - a.priorityScore,
  );
  const latestUpdate = latestIso(countyRisks.map((item) => item.observedAt));
  const freshUvCounties = countyRisks.filter(
    (item) => item.uvIndex !== undefined && item.uvStale === false,
  );
  const knownPriorityCounties = countyRisks.filter(
    (item) => item.priorityScore >= 0,
  );

  return {
    counties: sorted,
    stats: {
      totalCounties: countyRisks.length,
      highUvCounties: knownPriorityCounties.filter(
        (item) => item.priorityLevel.score >= 3,
      ).length,
      missingDataCount: countyRisks.filter(
        (item) => item.dataQuality === "missing",
      ).length,
      stale: countyRisks.some((item) => item.stale),
      latestUpdate,
      highestUv: pickMax(freshUvCounties, (item) => item.uvIndex),
      highestTemperature: pickMax(
        countyRisks.filter((item) => item.temperatureStale === false),
        (item) => item.observedTemperature,
      ),
      lowestUv: [...freshUvCounties].sort(
        (a, b) => (a.uvIndex ?? Infinity) - (b.uvIndex ?? Infinity),
      )[0],
      sourceSummary: "CWA O-A0003-001 測站觀測；F-C0032-001 預報另列",
      errors,
    },
  };
};
