import { afterEach, describe, expect, it, vi } from "vitest";
import { buildDashboardData, loadCwaBundle, parseForecastPayload } from "./cwa";
import { heatRiskLevel, overallRiskLevel, uvRiskLevel } from "./risk";

describe("risk levels", () => {
  it("does not classify missing UV data as low risk", () => {
    expect(uvRiskLevel(undefined).tone).toBe("unknown");
  });

  it("does not classify missing heat data as low risk", () => {
    expect(heatRiskLevel(undefined, undefined).tone).toBe("unknown");
  });

  it("keeps overall risk unknown only when both dimensions are missing", () => {
    const missing = uvRiskLevel(undefined);
    const highHeat = heatRiskLevel(35, undefined);

    expect(overallRiskLevel(missing, missing).tone).toBe("unknown");
    expect(overallRiskLevel(missing, highHeat).tone).toBe("very-high");
  });
});

describe("CWA bundle loading", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("falls back to demo mode when successful responses have counties but no risk values", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url: string) => ({
        ok: true,
        json: async () => {
          if (url.includes("O-A0003-001")) {
            return {
              success: "true",
              records: { Station: [{ GeoInfo: { CountyName: "臺北市" } }] },
            };
          }
          if (url.includes("O-A0005-001")) {
            return {
              success: "true",
              records: { weatherElement: { location: [{ CountyName: "臺北市" }] } },
            };
          }
          return {
            success: "true",
            records: { location: [{ locationName: "臺北市" }] },
          };
        },
      })),
    );

    const result = await loadCwaBundle("test-key");

    expect(result.mode).toBe("demo");
    expect(result.bundle).toBeUndefined();
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("沒有可用資料"),
        "CWA 即時資料無法使用，已切換為示範資料。",
      ]),
    );
  });

  it("keeps live mode when at least one response contains usable records", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url: string) => ({
        ok: true,
        json: async () =>
          url.includes("F-C0032-001")
            ? {
                success: "true",
                records: {
                  location: [
                    {
                      locationName: "臺北市",
                      weatherElement: [
                        {
                          elementName: "MaxT",
                          time: [{ parameter: { parameterName: "35" } }],
                        },
                      ],
                    },
                  ],
                },
              }
            : { success: "true", records: {} },
      })),
    );

    const result = await loadCwaBundle("test-key");

    expect(result.mode).toBe("live");
    expect(result.bundle?.forecast).toBeDefined();
    expect(result.bundle?.observations).toBeUndefined();
    expect(result.bundle?.dailyUv).toBeUndefined();
    expect(result.errors).toHaveLength(2);
  });
});

describe("forecast parsing", () => {
  it("uses the hottest temperature across the full 36-hour forecast", () => {
    const [forecast] = parseForecastPayload({
      records: {
        location: [
          {
            locationName: "臺北市",
            weatherElement: [
              {
                elementName: "MaxT",
                time: [
                  {
                    startTime: "2026-08-15T06:00:00+08:00",
                    endTime: "2026-08-15T18:00:00+08:00",
                    parameter: { parameterName: "31" },
                  },
                  {
                    startTime: "2026-08-15T18:00:00+08:00",
                    endTime: "2026-08-16T06:00:00+08:00",
                    parameter: { parameterName: "36" },
                  },
                  {
                    startTime: "2026-08-16T06:00:00+08:00",
                    endTime: "2026-08-16T18:00:00+08:00",
                    parameter: { parameterName: "34" },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(forecast.maxTemperature).toBe(36);
  });
});

describe("dashboard data quality", () => {
  it("marks counties with no usable live payload as missing instead of safe", () => {
    const dashboard = buildDashboardData("live", [], {});

    expect(dashboard.stats.missingDataCount).toBe(dashboard.stats.totalCounties);
    expect(dashboard.stats.safest).toBeUndefined();
    expect(dashboard.counties.every((county) => county.overallLevel.tone === "unknown")).toBe(
      true,
    );
  });
});
