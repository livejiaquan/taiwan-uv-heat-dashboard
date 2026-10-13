import { afterEach, describe, expect, it, vi } from "vitest";
import { collectWeatherSnapshot } from "./collection";
import * as fx from "./__fixtures__/cwa";

afterEach(() => vi.unstubAllGlobals());

describe("Actions data collection", () => {
  it("publishes an honest unavailable snapshot without a configured secret", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const snapshot = await collectWeatherSnapshot(undefined, fx.NOW);
    expect(fetch).not.toHaveBeenCalled();
    expect(snapshot.observations).toEqual([]);
    expect(snapshot.forecasts).toEqual([]);
    expect(snapshot.issues.join(" ")).toContain("尚無可用氣象資料");
  });

  it("does not overwrite the published snapshot with fabricated data during an upstream outage", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("outage")));
    await expect(collectWeatherSnapshot("private-token", fx.NOW)).rejects.toThrow("沒有有效氣象資料");
  });

  it("keeps working sources and never publishes credentials in errors", async () => {
    const key = "private-token";
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("O-A0003-001")) return { ok: true, json: async () => fx.observations() };
      throw new Error(`fetch failed: ${url}`);
    }));
    const snapshot = await collectWeatherSnapshot(key, fx.NOW);
    expect(snapshot.observations.length).toBeGreaterThan(0);
    expect(snapshot.issues.length).toBeGreaterThan(0);
    expect(JSON.stringify(snapshot)).not.toContain(key);
    expect(JSON.stringify(snapshot)).not.toContain("Authorization=");
  });

  it("refuses a snapshot made entirely of obsolete measurements", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url: string) => ({
      ok: true, json: async () => url.includes("O-A0003-001") ? fx.observations() : {},
    })));
    await expect(collectWeatherSnapshot("private-token", fx.NOW + 24 * 3600_000)).rejects.toThrow("沒有有效氣象資料");
  });

  it("drops impossible readings without discarding other healthy sources", async () => {
    const observations = fx.observations();
    observations.records.Station[0].WeatherElement.UVIndex = "-1";
    observations.records.Station[0].WeatherElement.RelativeHumidity = "101";
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url: string) => ({
      ok: true,
      json: async () => url.includes("O-A0003-001") ? observations : url.includes("F-D0047-089") ? fx.forecast3dNew() : {},
    })));
    const snapshot = await collectWeatherSnapshot("private-token", fx.NOW);
    expect(snapshot.forecasts.length).toBeGreaterThan(0);
    expect(snapshot.observations[0].uvIndex).toBeUndefined();
    expect(snapshot.observations[0].humidity).toBeUndefined();
  });
});
