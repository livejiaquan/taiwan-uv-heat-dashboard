import { describe, expect, it } from "vitest";
import { buildDashboardData, parseObservationPayload, parseForecastPayload } from "./cwa";
import { isCurrentObservation, isTodaysDailyUv, isUsableForecast, lowRiskCounties, sourceTimestamp } from "./freshness";
import { heatRiskLevel, overallRiskLevel, uvRiskLevel } from "./risk";
import type { RawCwaBundle } from "./types";

const NOW = Date.parse("2026-09-30T12:00:00+08:00");
const FRESH = "2026-09-30T11:50:00+08:00";
const OLD = "2026-09-30T10:00:00+08:00";
const station = (county: string, time: string | undefined, values: Record<string, unknown> = { AirTemperature: 22, RelativeHumidity: 60, UVIndex: 1 }) => ({
  StationId: county,
  StationName: county,
  GeoInfo: { CountyName: county },
  ObsTime: { DateTime: time },
  WeatherElement: values,
});
const observations = (...stations: ReturnType<typeof station>[]): RawCwaBundle => ({ observations: { records: { Station: stations } } });
const taipei = (bundle: RawCwaBundle, now = NOW) => buildDashboardData("live", [], bundle, now).counties.find((county) => county.county === "臺北市")!;
const daily = (date: string | undefined, uv = 1): RawCwaBundle => ({ dailyUv: { records: { weatherElement: { location: [{ CountyName: "臺北市", Date: date, UVIndex: uv }] } } } });
const forecast = (endTime: string | undefined, max = 24): RawCwaBundle => ({ forecast: { records: { location: [{ locationName: "臺北市", weatherElement: [{ elementName: "MaxT", time: [{ startTime: "2026-09-30T06:00:00+08:00", endTime, parameter: { parameterName: String(max) } }] }] }] } } });

describe("source time validity", () => {
  it("uses Taiwan time for source strings without a timezone", () => {
    expect(sourceTimestamp("2026-09-30 11:50:00")).toBe(Date.parse(FRESH));
  });
  it.each([undefined, "not-a-date", "2026-02-30T10:00:00+08:00", "2026-09-30", "2026-09-30T24:00:00+08:00"])("does not infer fresh observation time from %s", (value) => {
    expect(isCurrentObservation(value, NOW)).toBe(false);
  });
  it("honors the 45 minute boundary and rejects implausible future values", () => {
    expect(isCurrentObservation("2026-09-30T11:15:00+08:00", NOW)).toBe(true);
    expect(isCurrentObservation("2026-09-30T11:14:59+08:00", NOW)).toBe(false);
    expect(isCurrentObservation("2026-09-30T12:06:00+08:00", NOW)).toBe(false);
  });
  it("uses the Taiwan calendar day for daily UV rather than treating it as a current observation", () => {
    expect(isTodaysDailyUv("2026-09-30", NOW)).toBe(true);
    expect(isTodaysDailyUv("2026-09-29", NOW)).toBe(false);
    expect(isTodaysDailyUv("2026-10-01", NOW)).toBe(false);
    expect(isTodaysDailyUv("2026-09-29T17:00:00Z", NOW)).toBe(true);
  });
  it("requires a non-expired bounded forecast window", () => {
    expect(isUsableForecast("2026-09-30 06:00:00", "2026-09-30 18:00:00", NOW)).toBe(true);
    expect(isUsableForecast("2026-09-30 06:00:00", "2026-09-30 12:00:00", NOW)).toBe(false);
    expect(isUsableForecast(undefined, undefined, NOW)).toBe(false);
    expect(isUsableForecast("2099-01-01 06:00:00", "2099-01-01 18:00:00", NOW)).toBe(false);
  });
});

describe("demo provenance", () => {
  it("never invents a current observation or a safe county at any clock time", () => {
    const first = buildDashboardData("demo", [], undefined, NOW);
    const later = buildDashboardData("demo", [], undefined, NOW + 86_400_000);
    expect(first).toEqual(later);
    expect(first.stats.latestUpdate).toBeUndefined();
    expect(first.stats.currentCountyCount).toBe(0);
    expect(first.stats.hasLimitedCoverage).toBe(true);
    expect(first.stats.lowestRisk).toBeUndefined();
    for (const county of first.counties) {
      expect(county.dataMode).toBe("demo");
      expect(county.dataStatus).toBe("demo");
      expect(county.observedAt).toBeUndefined();
      expect(county.uvObservedAt).toBeUndefined();
      expect(county.forecastStartTime).toBeUndefined();
      expect(county.advice[0].title).toContain("示範情境");
    }
  });
});

describe("county trust and low-risk eligibility", () => {
  it("only recommends a county with current full coverage and two low dimensions", () => {
    const dashboard = buildDashboardData("live", [], observations(station("臺北市", FRESH)), NOW);
    expect(dashboard.stats.lowestRisk?.county).toBe("臺北市");
    expect(dashboard.stats.currentCountyCount).toBe(1);
    expect(dashboard.stats.hasLimitedCoverage).toBe(true); // One current county cannot freshen the rest.
    expect(lowRiskCounties(dashboard.counties).map((county) => county.county)).toEqual(["臺北市"]);
  });
  it("does not call the least dangerous high-risk county safe", () => {
    const dashboard = buildDashboardData("live", [], observations(station("臺北市", FRESH, { AirTemperature: 31, RelativeHumidity: 50, UVIndex: 8 })), NOW);
    expect(dashboard.stats.lowestRisk).toBeUndefined();
    expect(lowRiskCounties(dashboard.counties)).toEqual([]);
  });
  it.each([OLD, undefined, "invalid", "2099-01-01T00:00:00+08:00"])("excludes non-current measurements (%s) from risk and reassurance", (time) => {
    const county = taipei(observations(station("臺北市", time)));
    expect(county.dataStatus).toBe("stale");
    expect(county.uvIndex).toBeUndefined();
    expect(county.heatIndex).toBeUndefined();
    expect(county.overallLevel.tone).toBe("unknown");
    expect(county.advice[0].title).toBe("無法確認目前風險");
  });
  it("keeps a fresh low UV station from masking old heat observations", () => {
    const county = taipei(observations(station("臺北市", OLD, { AirTemperature: 22, RelativeHumidity: 60 }), station("臺北市", FRESH, { UVIndex: 1 })));
    expect(county.uvIndex).toBe(1);
    expect(county.heatIndex).toBeUndefined();
    expect(county.dataStatus).toBe("limited");
    expect(county.overallLevel.tone).toBe("unknown");
  });
  it("does not let a current station make another county's observations current", () => {
    const dashboard = buildDashboardData("live", [], observations(station("臺北市", FRESH), station("新北市", OLD)), NOW);
    expect(dashboard.counties.find((county) => county.county === "新北市")?.dataStatus).toBe("stale");
    expect(dashboard.stats.currentCountyCount).toBe(1);
  });
  it("re-evaluates retained payloads after the clock passes freshness without refetching", () => {
    const bundle = observations(station("臺北市", FRESH));
    expect(taipei(bundle).dataStatus).toBe("current");
    expect(taipei(bundle, NOW + 36 * 60_000).dataStatus).toBe("stale");
  });
  it("does not give a low overall rating with missing humidity", () => {
    const county = taipei(observations(station("臺北市", FRESH, { AirTemperature: 22, UVIndex: 1 })));
    expect(county.dataStatus).toBe("limited");
    expect(county.overallLevel.tone).toBe("unknown");
    expect(county.heatLevel.tone).toBe("unknown");
  });
  it("retains known high risks when the other dimension is missing", () => {
    const county = taipei(observations(station("臺北市", FRESH, { UVIndex: 11 })));
    expect(county.overallLevel.tone).toBe("extreme");
    expect(county.advice[0].title).toBe("無法確認目前風險");
  });
  it("never turns empty strings, negative UV, or impossible humidity into low risk evidence", () => {
    const payload = observations(station("臺北市", FRESH, { AirTemperature: " ", UVIndex: -1, RelativeHumidity: 101 }));
    const [parsed] = parseObservationPayload(payload.observations);
    expect(parsed.temperature).toBeUndefined();
    expect(parsed.uvIndex).toBeUndefined();
    expect(parsed.humidity).toBeUndefined();
    expect(taipei(payload).overallLevel.tone).toBe("unknown");
    expect(uvRiskLevel(Infinity).tone).toBe("unknown");
    expect(uvRiskLevel(-1).tone).toBe("unknown");
    expect(overallRiskLevel(uvRiskLevel(1), heatRiskLevel(undefined)).tone).toBe("unknown");
  });
  it("never creates a heat maximum from all missing values", () => {
    expect(buildDashboardData("live", [], {}, NOW).stats.highestHeat).toBeUndefined();
  });
});

describe("daily UV and forecast are not current observations", () => {
  it("keeps same-day daily UV labeled but not eligible for low-risk recommendations", () => {
    const county = taipei({ ...daily("2026-09-30"), ...observations(station("臺北市", FRESH, { AirTemperature: 22, RelativeHumidity: 50 })) });
    expect(county.uvSource).toBe("dailyMax");
    expect(county.dataStatus).toBe("limited");
    expect(county.overallLevel.tone).toBe("unknown");
    expect(lowRiskCounties([county])).toEqual([]);
  });
  it("does not use daily UV as latest current observation time", () => {
    const dashboard = buildDashboardData("live", [], daily("2026-09-30", 11), NOW);
    expect(dashboard.stats.latestUpdate).toBeUndefined();
    expect(dashboard.stats.currentCountyCount).toBe(0);
    expect(taipei(daily("2026-09-30", 11)).overallLevel.tone).toBe("extreme");
  });
  it.each(["2026-09-29", undefined, "2099-01-01"])("rejects stale/unverifiable daily UV %s", (date) => {
    expect(taipei(daily(date)).uvIndex).toBeUndefined();
  });
  it("keeps forecast-only cool temperatures unknown, and hot temperatures as a warning", () => {
    expect(taipei(forecast("2026-09-30 18:00:00")).overallLevel.tone).toBe("unknown");
    const hot = taipei(forecast("2026-09-30 18:00:00", 38));
    expect(hot.overallLevel.tone).toBe("extreme");
    expect(hot.dataStatus).toBe("limited");
    expect(hot.observedAt).toBeUndefined();
  });
  it.each(["2026-09-30 12:00:00", undefined])("excludes expired or untimed forecasts (%s)", (endTime) => {
    expect(taipei(forecast(endTime, 38)).forecastMaxTemperature).toBeUndefined();
  });
  it("selects the hottest unexpired forecast period, excluding older peaks", () => {
    const payload = { records: { location: [{ locationName: "臺北市", weatherElement: [{ elementName: "MaxT", time: [
      { startTime: "2026-09-29 18:00:00", endTime: "2026-09-30 06:00:00", parameter: { parameterName: "40" } },
      { startTime: "2026-09-30 06:00:00", endTime: "2026-09-30 18:00:00", parameter: { parameterName: "32" } },
    ] }] }] } };
    expect(parseForecastPayload(payload, NOW)[0].maxTemperature).toBe(32);
  });
});

describe("forecast weather provenance", () => {
  it("does not keep an expired weather description beside current observations", () => {
    const payload = { records: { location: [{ locationName: "臺北市", weatherElement: [{ elementName: "Wx", time: [
      { startTime: "2026-09-29 18:00:00", endTime: "2026-09-30 06:00:00", parameter: { parameterName: "expired weather" } },
    ] }] }] } };
    expect(parseForecastPayload(payload, NOW)[0].weather).toBeUndefined();
  });
});
