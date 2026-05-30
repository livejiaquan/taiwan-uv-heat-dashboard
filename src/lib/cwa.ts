import { counties, normalizeCountyName } from "../data/counties";
import { demoForecasts, demoObservations } from "../data/demoData";
import {
  buildAdvice,
  heatIndexCelsius,
  heatRiskLevel,
  overallRiskLevel,
  uvRiskLevel,
} from "./risk";
import type {
  CountyForecast,
  CountyRisk,
  DashboardData,
  DataMode,
  RawCwaBundle,
  StationObservation,
} from "./types";

const CWA_BASE = "https://opendata.cwa.gov.tw/api/v1/rest/datastore";

const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined) return undefined;
  const parsed = Number(String(value).trim());
  if (!Number.isFinite(parsed) || parsed <= -90) return undefined;
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

const findElementValue = (
  elements: unknown,
  names: string[],
): number | undefined => {
  if (!Array.isArray(elements)) return undefined;

  for (const element of elements) {
    const record = asRecord(element);
    const name = toText(record.elementName) ?? toText(record.ElementName);
    if (name && names.includes(name)) {
      return toNumber(
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
    .filter((date): date is string => Boolean(date))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

export const fetchCwaJson = async (
  dataId: string,
  apiKey: string,
): Promise<unknown> => {
  const url = new URL(`${CWA_BASE}/${dataId}`);
  url.searchParams.set("Authorization", apiKey);
  url.searchParams.set("format", "JSON");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`${dataId} HTTP ${response.status}`);
  }

  const json = (await response.json()) as { success?: string };
  if (json.success === "false") {
    throw new Error(`${dataId} returned success=false`);
  }
  return json;
};

export const loadCwaBundle = async (apiKey?: string): Promise<{
  mode: DataMode;
  bundle?: RawCwaBundle;
  errors: string[];
}> => {
  if (!apiKey) {
    return {
      mode: "demo",
      errors: ["未設定 VITE_CWA_API_KEY，正在顯示示範資料。"],
    };
  }

  const [observations, dailyUv, forecast] = await Promise.allSettled([
    fetchCwaJson("O-A0003-001", apiKey),
    fetchCwaJson("O-A0005-001", apiKey),
    fetchCwaJson("F-C0032-001", apiKey),
  ]);

  const errors: string[] = [];
  const bundle: RawCwaBundle = {};

  if (observations.status === "fulfilled") bundle.observations = observations.value;
  else errors.push(`10分鐘觀測資料讀取失敗：${observations.reason}`);

  if (dailyUv.status === "fulfilled") bundle.dailyUv = dailyUv.value;
  else errors.push(`每日最大 UV 資料讀取失敗：${dailyUv.reason}`);

  if (forecast.status === "fulfilled") bundle.forecast = forecast.value;
  else errors.push(`36小時預報資料讀取失敗：${forecast.reason}`);

  if (!bundle.observations && !bundle.dailyUv && !bundle.forecast) {
    return {
      mode: "demo",
      errors: [...errors, "CWA 即時資料無法使用，已切換為示範資料。"],
    };
  }

  return { mode: "live", bundle, errors };
};

export const parseObservationPayload = (payload: unknown): StationObservation[] => {
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

      if (!county) return undefined;

      const elements = record.weatherElement ?? record.WeatherElement;
      const temperature =
        toNumber(weather.AirTemperature) ??
        findElementValue(elements, ["AirTemperature", "氣溫"]);
      const humidity =
        toNumber(weather.RelativeHumidity) ??
        findElementValue(elements, ["RelativeHumidity", "相對濕度"]);
      const uvIndex =
        toNumber(weather.UVIndex) ??
        toNumber(weather.UVI) ??
        findElementValue(elements, ["UVIndex", "UVI", "紫外線指數"]);

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
        observedAt:
          toText(obsTime.DateTime) ??
          toText(record.DateTime) ??
          toText(record.observedAt) ??
          new Date().toISOString(),
        temperature,
        humidity,
        uvIndex,
      };
    })
    .filter((item): item is StationObservation => Boolean(item));
};

export const parseDailyUvPayload = (payload: unknown): StationObservation[] => {
  const records = asRecord(asRecord(payload).records);
  const weatherElement = records.weatherElement ?? records.WeatherElement;
  const locations = asArray(
    asRecord(weatherElement).location ??
      asRecord(weatherElement).Location ??
      records.location,
  );

  return locations
    .map((location): StationObservation | undefined => {
      const record = asRecord(location);
      const county = normalizeCountyName(
        toText(record.CountyName) ??
          toText(record.countyName) ??
          toText(record.parameterName),
      );
      if (!county) return undefined;

      return {
        stationId:
          toText(record.StationID) ??
          toText(record.StationId) ??
          toText(record.stationId) ??
          "daily-uv",
        stationName:
          toText(record.StationName) ??
          toText(record.stationName) ??
          toText(record.locationName) ??
          county,
        county,
        observedAt:
          toText(record.Date) ??
          toText(record.DateTime) ??
          toText(record.time) ??
          new Date().toISOString(),
        uvIndex:
          toNumber(record.UVIndex) ??
          toNumber(record.UVI) ??
          findElementValue(record.weatherElement, ["UVIndex", "UVI", "紫外線指數"]),
      };
    })
    .filter((item): item is StationObservation => Boolean(item));
};

export const parseForecastPayload = (payload: unknown): CountyForecast[] => {
  const locations = asArray(asRecord(asRecord(payload).records).location);

  return locations
    .map((location): CountyForecast | undefined => {
      const record = asRecord(location);
      const county = normalizeCountyName(toText(record.locationName));
      if (!county) return undefined;

      const elements = asArray(record.weatherElement);
      const getElement = (name: string) =>
        elements.find((element) => asRecord(element).elementName === name);
      const firstTime = (element: unknown) =>
        asRecord(asArray(asRecord(element).time)[0]);
      const parameterName = (time: Record<string, unknown>) =>
        toText(asRecord(time.parameter).parameterName);

      const maxTime = firstTime(getElement("MaxT"));
      const minTime = firstTime(getElement("MinT"));
      const weatherTime = firstTime(getElement("Wx"));

      return {
        county,
        maxTemperature: toNumber(parameterName(maxTime)),
        minTemperature: toNumber(parameterName(minTime)),
        weather: parameterName(weatherTime),
        startTime:
          toText(maxTime.startTime) ??
          toText(weatherTime.startTime) ??
          toText(minTime.startTime),
        endTime:
          toText(maxTime.endTime) ??
          toText(weatherTime.endTime) ??
          toText(minTime.endTime),
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

export const buildDashboardData = (
  mode: DataMode,
  errors: string[],
  bundle?: RawCwaBundle,
): DashboardData => {
  const observations =
    mode === "demo" ? demoObservations : parseObservationPayload(bundle?.observations);
  const dailyUv =
    mode === "demo" ? [] : parseDailyUvPayload(bundle?.dailyUv);
  const forecasts =
    mode === "demo" ? demoForecasts : parseForecastPayload(bundle?.forecast);
  const forecastByCounty = new Map(forecasts.map((item) => [item.county, item]));

  const countyRisks: CountyRisk[] = counties.map((meta) => {
    const countyObservations = observations.filter(
      (item) => item.county === meta.county,
    );
    const countyDailyUv = dailyUv.filter((item) => item.county === meta.county);
    const hottest = pickMax(countyObservations, (item) => item.temperature);
    const mostHumidHeat = pickMax(countyObservations, (item) =>
      heatIndexCelsius(item.temperature, item.humidity),
    );
    const currentUv = pickMax(countyObservations, (item) => item.uvIndex);
    const dailyMaxUv = pickMax(countyDailyUv, (item) => item.uvIndex);
    const forecast = forecastByCounty.get(meta.county);
    const heatIndex = heatIndexCelsius(
      mostHumidHeat?.temperature ?? hottest?.temperature,
      mostHumidHeat?.humidity ?? hottest?.humidity,
    );
    const uvIndex = currentUv?.uvIndex ?? dailyMaxUv?.uvIndex;
    const uvSource =
      mode === "demo"
        ? "demo"
        : currentUv?.uvIndex !== undefined
          ? "current"
          : dailyMaxUv?.uvIndex !== undefined
            ? "dailyMax"
            : "missing";
    const uvLevel = uvRiskLevel(uvIndex);
    const heatLevel = heatRiskLevel(heatIndex, forecast?.maxTemperature);
    const overallLevel = overallRiskLevel(uvLevel, heatLevel);
    const hasUvData = uvIndex !== undefined;
    const hasHeatData =
      heatIndex !== undefined ||
      forecast?.maxTemperature !== undefined ||
      hottest?.temperature !== undefined;
    const dataQuality =
      hasUvData && hasHeatData
        ? "complete"
        : hasUvData || hasHeatData
          ? "partial"
          : "missing";
    const risk: CountyRisk = {
      ...meta,
      observedAt: latestIso([
        hottest?.observedAt,
        mostHumidHeat?.observedAt,
        currentUv?.observedAt,
        dailyMaxUv?.observedAt,
      ]),
      stationCount: countyObservations.length,
      uvIndex,
      uvSource,
      observedTemperature: hottest?.temperature,
      humidity: mostHumidHeat?.humidity ?? hottest?.humidity,
      heatIndex,
      forecastMaxTemperature: forecast?.maxTemperature,
      forecastWeather: forecast?.weather,
      dataQuality,
      uvLevel,
      heatLevel,
      overallLevel,
      overallScore:
        overallLevel.score < 0
          ? -1
          : overallLevel.score * 100 +
            (uvIndex ?? 0) * 4 +
            Math.max(heatIndex ?? 0, forecast?.maxTemperature ?? 0),
      advice: [],
    };
    return { ...risk, advice: buildAdvice(risk) };
  });

  const sorted = [...countyRisks].sort((a, b) => b.overallScore - a.overallScore);
  const latestUpdate = latestIso(countyRisks.map((item) => item.observedAt));
  const latestAgeMinutes = latestUpdate
    ? (Date.now() - new Date(latestUpdate).getTime()) / 60000
    : Infinity;
  const highestUv = pickMax(countyRisks, (item) => item.uvIndex);
  const highestHeat = pickMax(countyRisks, (item) =>
    Math.max(
      item.heatIndex ?? -Infinity,
      item.forecastMaxTemperature ?? -Infinity,
      item.observedTemperature ?? -Infinity,
    ),
  );
  const knownRiskCounties = countyRisks.filter((item) => item.overallScore >= 0);

  return {
    counties: sorted,
    stats: {
      totalCounties: countyRisks.length,
      dangerousCounties: countyRisks.filter((item) => item.overallLevel.score >= 3)
        .length,
      missingDataCount: countyRisks.filter((item) => item.dataQuality === "missing")
        .length,
      stale: mode === "live" ? latestAgeMinutes > 45 : false,
      latestUpdate,
      highestUv,
      highestHeat,
      safest: [...knownRiskCounties].sort((a, b) => a.overallScore - b.overallScore)[0],
      dataMode: mode,
      sourceSummary:
        mode === "live"
          ? "中央氣象署 O-A0003、O-A0005、F-C0032"
          : "內建示範資料，欄位結構對齊 CWA 開放資料",
      errors,
    },
  };
};

export const loadDashboardData = async (apiKey?: string): Promise<DashboardData> => {
  const { mode, bundle, errors } = await loadCwaBundle(apiKey);
  return buildDashboardData(mode, errors, bundle);
};
