import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildDashboardData,
  fetchCwaJson,
  loadCwaBundle,
  parseForecastPayload,
  parseObservationPayload,
} from "./cwa";
import { heatIndexCelsius, uvRiskLevel } from "./risk";

const NOW = Date.parse("2026-08-09T04:00:00.000Z");

const observationPayload = (
  stations: Array<{
    county?: string;
    station?: string;
    at?: string;
    temperature?: unknown;
    humidity?: unknown;
    uv?: unknown;
  }>,
) => ({
  success: "true",
  records: {
    Station: stations.map((item, index) => ({
      StationId: `S${index + 1}`,
      StationName: item.station ?? `測站 ${index + 1}`,
      GeoInfo: { CountyName: item.county },
      ObsTime: item.at ? { DateTime: item.at } : {},
      WeatherElement: {
        AirTemperature: item.temperature,
        RelativeHumidity: item.humidity,
        UVIndex: item.uv,
      },
    })),
  },
});

const forecastPayload = (periods: Array<{ value: string; start: string; end: string }>) => ({
  success: "true",
  records: {
    location: [
      {
        locationName: "臺北市",
        weatherElement: [
          {
            elementName: "MaxT",
            time: periods.map((period) => ({
              startTime: period.start,
              endTime: period.end,
              parameter: { parameterName: period.value },
            })),
          },
          {
            elementName: "Wx",
            time: periods.map((period, index) => ({
              startTime: period.start,
              endTime: period.end,
              parameter: { parameterName: index === 1 ? "炎熱" : "晴時多雲" },
            })),
          },
        ],
      },
    ],
  },
});

describe("UV and derived heat calculations", () => {
  it("does not classify missing UV data as low risk", () => {
    expect(uvRiskLevel(undefined).tone).toBe("unknown");
  });

  it("keeps the official UV category boundaries", () => {
    expect(uvRiskLevel(0).tone).toBe("low");
    expect(uvRiskLevel(3).tone).toBe("moderate");
    expect(uvRiskLevel(6).tone).toBe("high");
    expect(uvRiskLevel(8).tone).toBe("very-high");
    expect(uvRiskLevel(11).tone).toBe("extreme");
  });

  it("does not call temperature alone a heat-index estimate", () => {
    expect(heatIndexCelsius(35, undefined)).toBeUndefined();
    expect(heatIndexCelsius(35, 70)).toBeGreaterThan(35);
  });
});

describe("CWA observation contracts", () => {
  it("accepts night-time UVI zero and preserves official percentage humidity", () => {
    const parsed = parseObservationPayload(
      observationPayload([
        {
          county: "台北市",
          at: "2026-08-09T03:50:00.000Z",
          temperature: "30",
          humidity: "0.8",
          uv: "0",
        },
        {
          county: "新北市",
          at: "2026-08-09T03:50:00.000Z",
          temperature: "30",
          humidity: "75",
          uv: "1",
        },
      ]),
      NOW,
    );

    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({
      county: "臺北市",
      temperature: 30,
      humidity: 0.8,
      uvIndex: 0,
    });
    expect(parsed[1]).toMatchObject({ county: "新北市", humidity: 75, uvIndex: 1 });
  });

  it("rejects sentinels, impossible domains, blank fields, and text placeholders", () => {
    const parsed = parseObservationPayload(
      observationPayload([
        {
          county: "臺北市",
          at: "2026-08-09T03:50:00.000Z",
          temperature: "999",
          humidity: "999",
          uv: "-99",
        },
        {
          county: "新北市",
          at: "2026-08-09T03:50:00.000Z",
          temperature: "X",
          humidity: "-999",
          uv: "X",
        },
        {
          county: "桃園市",
          at: "2026-08-09T03:50:00.000Z",
          temperature: " ",
          humidity: "",
          uv: "  ",
        },
        {
          county: "新竹市",
          at: "2026-08-09T03:50:00.000Z",
          temperature: false,
          humidity: true,
          uv: false,
        },
      ]),
      NOW,
    );

    expect(parsed).toEqual([]);
  });

  it("rejects missing, invalid, and materially future observation times", () => {
    const parsed = parseObservationPayload(
      observationPayload([
        { county: "臺北市", temperature: 30, uv: 5 },
        { county: "新北市", at: "not-a-date", temperature: 30, uv: 5 },
        {
          county: "桃園市",
          at: "2026-08-09T04:06:00.000Z",
          temperature: 30,
          uv: 5,
        },
      ]),
      NOW,
    );

    expect(parsed).toEqual([]);
  });
});

describe("CWA forecast contracts", () => {
  it("finds the maximum across all forecast periods and keeps its valid window", () => {
    const parsed = parseForecastPayload(
      forecastPayload([
        {
          value: "30",
          start: "2026-08-09T06:00:00+08:00",
          end: "2026-08-09T18:00:00+08:00",
        },
        {
          value: "38",
          start: "2026-08-09T18:00:00+08:00",
          end: "2026-08-10T06:00:00+08:00",
        },
        {
          value: "34",
          start: "2026-08-10T06:00:00+08:00",
          end: "2026-08-10T18:00:00+08:00",
        },
      ]),
    );

    expect(parsed[0]).toMatchObject({
      county: "臺北市",
      maxTemperature: 38,
      weather: "炎熱",
      startTime: "2026-08-09T10:00:00.000Z",
      endTime: "2026-08-09T22:00:00.000Z",
    });
  });

  it("omits forecast values without a complete, ordered valid window", () => {
    const parsed = parseForecastPayload(
      forecastPayload([
        { value: "39", start: "", end: "2026-08-09T18:00:00+08:00" },
        {
          value: "38",
          start: "2026-08-10T06:00:00+08:00",
          end: "2026-08-09T18:00:00+08:00",
        },
      ]),
    );

    expect(parsed[0]).toMatchObject({
      county: "臺北市",
      maxTemperature: undefined,
      startTime: undefined,
      endTime: undefined,
    });
  });
});

describe("CWA bundle loading", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("fails closed when no credential is configured", async () => {
    await expect(loadCwaBundle()).rejects.toThrow("無法提供可靠的即時判讀");
  });

  it("fails closed when observations are semantically empty even if forecast exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url: string) => ({
        ok: true,
        json: async () =>
          url.includes("O-A0003-001")
            ? observationPayload([{ county: "臺北市" }])
            : forecastPayload([
                {
                  value: "35",
                  start: "2026-08-09T06:00:00+08:00",
                  end: "2026-08-09T18:00:00+08:00",
                },
              ]),
      })),
    );

    await expect(loadCwaBundle("test-key")).rejects.toThrow(
      "避免把預報或範例誤當現在狀況",
    );
  });

  it("keeps usable observations when forecast is unavailable and never requests daily UV", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => ({
      ok: true,
      json: async () =>
        url.includes("O-A0003-001")
          ? observationPayload([
              {
                county: "臺北市",
                at: new Date(Date.now() - 10 * 60_000).toISOString(),
                temperature: 31,
                humidity: 70,
                uv: 5,
              },
            ])
          : { success: "true", records: {} },
    }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await loadCwaBundle("test-key");

    expect(result.bundle.observations).toBeDefined();
    expect(result.bundle.forecast).toBeUndefined();
    expect(result.errors).toEqual([
      "F-C0032-001 36 小時預報沒有可用的最高溫時段。",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map(([url]) => String(url)).join(" ")).not.toContain(
      "O-A0005-001",
    );
  });

  it.each([401, 429, 500])("reports HTTP %s without returning a payload", async (status) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status }),
    );

    await expect(fetchCwaJson("O-A0003-001", "test-key")).rejects.toThrow(
      `HTTP ${status}`,
    );
  });

  it("aborts a source request after the timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
      ),
    );

    const expectation = expect(
      fetchCwaJson("O-A0003-001", "test-key"),
    ).rejects.toThrow("aborted");
    await vi.advanceTimersByTimeAsync(12_000);
    await expectation;
  });
});

describe("dashboard freshness and time semantics", () => {
  it("keeps county freshness independent instead of letting one fresh county mask another", () => {
    const dashboard = buildDashboardData(
      [],
      {
        observations: observationPayload([
          {
            county: "臺北市",
            station: "臺北",
            at: "2026-08-09T03:50:00.000Z",
            temperature: 32,
            humidity: 70,
            uv: 6,
          },
          {
            county: "新北市",
            station: "板橋",
            at: "2020-01-01T00:00:00.000Z",
            temperature: 31,
            humidity: 70,
            uv: 5,
          },
        ]),
      },
      NOW,
    );

    const taipei = dashboard.counties.find((county) => county.county === "臺北市");
    const newTaipei = dashboard.counties.find((county) => county.county === "新北市");

    expect(taipei).toMatchObject({ stale: false, uvStale: false, dataQuality: "complete" });
    expect(newTaipei).toMatchObject({
      stale: true,
      uvStale: true,
      dataQuality: "missing",
      priorityScore: -1,
    });
    expect(dashboard.stats.stale).toBe(true);
  });

  it("prefers fresh measurements over a higher stale measurement in the same county", () => {
    const dashboard = buildDashboardData(
      [],
      {
        observations: observationPayload([
          {
            county: "臺北市",
            station: "舊高值站",
            at: "2026-08-09T02:00:00.000Z",
            temperature: 40,
            humidity: 80,
            uv: 11,
          },
          {
            county: "臺北市",
            station: "新鮮站",
            at: "2026-08-09T03:50:00.000Z",
            temperature: 31,
            humidity: 70,
            uv: 5,
          },
        ]),
      },
      NOW,
    );
    const taipei = dashboard.counties.find((county) => county.county === "臺北市");

    expect(taipei).toMatchObject({
      uvIndex: 5,
      uvStationName: "新鮮站",
      uvStale: false,
      observedTemperature: 31,
      temperatureStationName: "新鮮站",
      temperatureStale: false,
      priorityLevel: { tone: "moderate" },
    });
  });

  it("keeps derived heat value, station, timestamp, and stale state on one observation", () => {
    const dashboard = buildDashboardData(
      [],
      {
        observations: observationPayload([
          {
            county: "臺北市",
            station: "高濕度站",
            at: "2026-08-09T03:45:00.000Z",
            temperature: 34,
            humidity: 90,
            uv: 4,
          },
          {
            county: "臺北市",
            station: "最高氣溫站",
            at: "2026-08-09T03:50:00.000Z",
            temperature: 39,
            humidity: 40,
            uv: 5,
          },
        ]),
      },
      NOW,
    );
    const taipei = dashboard.counties.find((county) => county.county === "臺北市");

    expect(taipei).toMatchObject({
      temperatureStationName: "最高氣溫站",
      heatIndexStationName: "高濕度站",
      heatIndexObservedAt: "2026-08-09T03:45:00.000Z",
      heatIndexStale: false,
    });
    expect(taipei?.heatIndex).toBeGreaterThan(39);
  });

  it("reclassifies the same cached observation as stale after the TTL elapses", () => {
    const bundle = {
      observations: observationPayload([
        {
          county: "臺北市",
          at: "2026-08-09T03:50:00.000Z",
          temperature: 31,
          humidity: 70,
          uv: 5,
        },
      ]),
    };

    const fresh = buildDashboardData([], bundle, NOW);
    const stale = buildDashboardData([], bundle, NOW + 46 * 60_000);
    const freshTaipei = fresh.counties.find((county) => county.county === "臺北市");
    const staleTaipei = stale.counties.find((county) => county.county === "臺北市");

    expect(freshTaipei).toMatchObject({ uvStale: false, priorityScore: 105 });
    expect(staleTaipei).toMatchObject({ uvStale: true, priorityScore: -1 });
  });

  it("never lets future forecast temperature establish a current risk level", () => {
    const dashboard = buildDashboardData(
      [],
      {
        observations: observationPayload([
          {
            county: "臺北市",
            at: "2026-08-09T03:50:00.000Z",
            temperature: 40,
            humidity: 80,
          },
        ]),
        forecast: forecastPayload([
          {
            value: "45",
            start: "2026-08-09T06:00:00+08:00",
            end: "2026-08-09T18:00:00+08:00",
          },
        ]),
      },
      NOW,
    );
    const taipei = dashboard.counties.find((county) => county.county === "臺北市");

    expect(taipei).toMatchObject({
      forecastMaxTemperature: 45,
      priorityScore: -1,
    });
    expect(taipei?.priorityLevel.tone).toBe("unknown");
    expect(dashboard.stats.lowestUv).toBeUndefined();
  });

  it("marks every county unknown when no current observation is usable", () => {
    const dashboard = buildDashboardData([], {}, NOW);

    expect(dashboard.stats.missingDataCount).toBe(dashboard.stats.totalCounties);
    expect(dashboard.stats.lowestUv).toBeUndefined();
    expect(
      dashboard.counties.every((county) => county.priorityLevel.tone === "unknown"),
    ).toBe(true);
  });
});
