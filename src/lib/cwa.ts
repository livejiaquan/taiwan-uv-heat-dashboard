import { normalizeCountyName } from "../data/counties";
import { parseForecastPayload } from "./forecast";
import { asArray, asRecord, toNumber, toText } from "./parse";
import type { RawCwaBundle, StationObservation } from "./types";

const CWA_BASE = "https://opendata.cwa.gov.tw/api/v1/rest/datastore";
const CWA_REQUEST_TIMEOUT_MS = 15_000;

export const DATASETS = {
  observations: "O-A0003-001",
  dailyUv: "O-A0005-001",
  forecast36h: "F-C0032-001",
  forecast3d: "F-D0047-089",
  forecastWeek: "F-D0047-091",
} as const;

const DATASET_LABELS: Record<keyof typeof DATASETS, string> = {
  observations: "即時觀測",
  dailyUv: "每日紫外線最大值",
  forecast36h: "36 小時預報",
  forecast3d: "3 天逐 3 小時預報",
  forecastWeek: "一週預報",
};

const findElementValue = (elements: unknown, names: string[]): number | undefined => {
  if (!Array.isArray(elements)) return undefined;
  for (const element of elements) {
    const record = asRecord(element);
    const name = toText(record.elementName) ?? toText(record.ElementName);
    if (name && names.includes(name)) {
      return toNumber(record.elementValue ?? record.ElementValue ?? asRecord(record.parameter).parameterName);
    }
  }
  return undefined;
};

// O-A0005-001 publishes a bare yyyy-MM-dd; anchor it to Taiwan time instead of UTC.
const toTaipeiDate = (value?: string): string | undefined =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00+08:00` : value;

export const fetchCwaJson = async (dataId: string, apiKey: string): Promise<unknown> => {
  const url = new URL(`${CWA_BASE}/${dataId}`);
  url.searchParams.set("Authorization", apiKey);
  url.searchParams.set("format", "JSON");

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), CWA_REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) throw new Error(`${dataId} request timed out`);
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
  }

  if (!response.ok) throw new Error(`${dataId} HTTP ${response.status}`);
  const json = (await response.json()) as { success?: string };
  if (json.success === "false") throw new Error(`${dataId} returned success=false`);
  return json;
};

export const parseObservationPayload = (payload: unknown): StationObservation[] => {
  const records = asRecord(asRecord(payload).records);
  const stations = asArray(records.Station ?? records.station ?? records.location ?? records.Location);

  return stations
    .map((station): StationObservation | undefined => {
      const record = asRecord(station);
      const geo = asRecord(record.GeoInfo ?? record.geoInfo);
      const weather = asRecord(record.WeatherElement ?? record.weatherElement);
      const obsTime = asRecord(record.ObsTime ?? record.obsTime);
      const county = normalizeCountyName(toText(geo.CountyName) ?? toText(record.CountyName) ?? toText(record.countyName));
      if (!county) return undefined;

      const elements = record.weatherElement ?? record.WeatherElement;
      return {
        stationId: toText(record.StationId) ?? toText(record.StationID) ?? toText(record.stationId) ?? "unknown",
        stationName: toText(record.StationName) ?? toText(record.stationName) ?? toText(record.locationName) ?? "未知測站",
        county,
        town: toText(geo.TownName) ?? toText(record.TownName),
        observedAt: toText(obsTime.DateTime) ?? toText(record.DateTime) ?? toText(record.observedAt),
        temperature: toNumber(weather.AirTemperature) ?? findElementValue(elements, ["AirTemperature", "氣溫"]),
        humidity: toNumber(weather.RelativeHumidity) ?? findElementValue(elements, ["RelativeHumidity", "相對濕度"]),
        uvIndex: toNumber(weather.UVIndex) ?? toNumber(weather.UVI) ?? findElementValue(elements, ["UVIndex", "UVI", "紫外線指數"]),
        windSpeed: toNumber(weather.WindSpeed) ?? findElementValue(elements, ["WindSpeed", "風速"]),
      };
    })
    .filter((item): item is StationObservation => Boolean(item));
};

// O-A0005-001 locations only carry StationID + UVIndex, so the county has to be
// looked up from the O-A0003-001 station metadata.
export const stationCountyMap = (observationPayload: unknown): Map<string, string> =>
  new Map(
    parseObservationPayload(observationPayload)
      .filter((item) => item.stationId !== "unknown")
      .map((item) => [item.stationId, item.county]),
  );

export const parseDailyUvPayload = (
  payload: unknown,
  stationCounties: Map<string, string> = new Map(),
): StationObservation[] => {
  const records = asRecord(asRecord(payload).records);
  const weatherElement = asRecord(records.weatherElement ?? records.WeatherElement);
  const date = toText(weatherElement.Date) ?? toText(weatherElement.date);
  const locations = asArray(weatherElement.location ?? weatherElement.Location ?? records.location);

  return locations
    .map((location): StationObservation | undefined => {
      const record = asRecord(location);
      const stationId = toText(record.StationID) ?? toText(record.StationId) ?? toText(record.stationId);
      const county =
        normalizeCountyName(toText(record.CountyName) ?? toText(record.countyName) ?? toText(record.parameterName)) ??
        (stationId ? stationCounties.get(stationId) : undefined);
      if (!county) return undefined;

      return {
        stationId: stationId ?? "daily-uv",
        stationName: toText(record.StationName) ?? toText(record.stationName) ?? toText(record.locationName) ?? county,
        county,
        observedAt: toTaipeiDate(toText(record.Date) ?? toText(record.DateTime) ?? toText(record.time) ?? date),
        uvIndex:
          toNumber(record.UVIndex) ??
          toNumber(record.UVI) ??
          findElementValue(record.weatherElement, ["UVIndex", "UVI", "紫外線指數"]),
      };
    })
    .filter((item): item is StationObservation => Boolean(item));
};

export interface CwaBundleResult {
  bundle: RawCwaBundle;
  issues: string[];
  usable: boolean;
}

/** Fetch every dataset independently; a failing source only drops its own fields. */
export const loadCwaBundle = async (apiKey: string): Promise<CwaBundleResult> => {
  const keys = Object.keys(DATASETS) as Array<keyof typeof DATASETS>;
  const results = await Promise.allSettled(keys.map((key) => fetchCwaJson(DATASETS[key], apiKey)));
  const bundle: RawCwaBundle = {};
  const issues: string[] = [];

  results.forEach((result, index) => {
    const key = keys[index];
    if (result.status === "rejected") {
      issues.push(`${DATASET_LABELS[key]}讀取失敗（${String(result.reason?.message ?? result.reason)}）`);
      return;
    }
    if (!hasUsableData(key, result.value, bundle.observations)) {
      issues.push(`${DATASET_LABELS[key]}沒有可用資料`);
      return;
    }
    bundle[key] = result.value;
  });

  // Daily UV needs station metadata from the observations to find its counties.
  if (bundle.dailyUv && !bundle.observations) {
    delete bundle.dailyUv;
    issues.push("每日紫外線最大值缺少測站對照，暫不使用");
  }

  const usable = Boolean(bundle.observations || bundle.forecast3d || bundle.forecast36h);
  return { bundle, issues, usable };
};

const hasUsableData = (key: keyof typeof DATASETS, payload: unknown, observations: unknown): boolean => {
  switch (key) {
    case "observations":
      return parseObservationPayload(payload).some((s) => s.temperature !== undefined || s.uvIndex !== undefined);
    case "dailyUv":
      // Checked against station metadata later; here only require some UV values.
      return parseDailyUvPayload(payload, stationCountyMap(observations)).some((s) => s.uvIndex !== undefined) ||
        asArray(asRecord(asRecord(asRecord(payload).records).weatherElement).location).length > 0;
    default:
      return parseForecastPayload(payload).some(
        (f) => f.apparent.length || f.temperature.length || f.maxTemperature.length || f.uvDaily.length,
      );
  }
};
