import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCwaJson, loadCwaBundle, parseDailyUvPayload, parseObservationPayload, stationCountyMap } from "./cwa";
import { blockAt, mergeForecasts, parseForecastPayload, valueAt } from "./forecast";
import { addDays, hourStart, parseCwaTime, taipeiDate, taipeiHour } from "./time";
import * as fx from "./__fixtures__/cwa";

describe("Taipei time helpers", () => {
  it("uses UTC+8 dates and hours", () => {
    const ms = Date.parse("2026-10-06T17:30:00Z"); // 01:30 next day in Taipei
    expect(taipeiDate(ms)).toBe("2026-10-07");
    expect(taipeiHour(ms)).toBe(1);
  });

  it("reads CWA timestamps with and without an offset", () => {
    expect(parseCwaTime("2026-10-06 18:00:00")).toBe(Date.parse("2026-10-06T18:00:00+08:00"));
    expect(parseCwaTime("2026-10-06T18:00:00+08:00")).toBe(Date.parse("2026-10-06T10:00:00Z"));
    expect(parseCwaTime("")).toBeUndefined();
    expect(parseCwaTime("not a date")).toBeUndefined();
  });

  it("adds days across month ends", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(hourStart("2026-10-06", 0)).toBe(Date.parse("2026-10-05T16:00:00Z"));
  });
});

describe("observation parsing", () => {
  it("treats blank and sentinel values as missing", () => {
    const [blank] = parseObservationPayload({
      records: { Station: [{ StationId: "X", GeoInfo: { CountyName: "臺北市" }, WeatherElement: { AirTemperature: "31", UVIndex: "" } }] },
    });
    expect(blank.uvIndex).toBeUndefined();
    const stations = parseObservationPayload(fx.observations());
    expect(stations.find((s) => s.stationId === "466910")?.uvIndex).toBeUndefined();
    expect(stations.find((s) => s.stationId === "466920")?.windSpeed).toBe(1);
  });

  it("maps station-only daily UV rows to counties", () => {
    const rows = parseDailyUvPayload(fx.dailyUv(), stationCountyMap(fx.observations()));
    expect(rows.map((r) => [r.county, r.uvIndex])).toEqual([
      ["臺北市", 9.3],
      ["高雄市", 10.1],
    ]);
    expect(rows[0].observedAt).toBe("2026-10-06T00:00:00+08:00");
    expect(parseDailyUvPayload(fx.dailyUv())).toEqual([]);
  });
});

describe("forecast parsing", () => {
  it("reads the current F-D0047 format", () => {
    const [taipei, ...rest] = parseForecastPayload(fx.forecast3dNew());
    expect(rest).toHaveLength(0); // town-level names are ignored
    expect(taipei.county).toBe("臺北市");
    expect(taipei.apparent[0]).toEqual({ time: Date.parse("2026-10-06T15:00:00+08:00"), value: 36 });
    expect(taipei.temperature).toHaveLength(12);
    expect(taipei.rain[0].value).toBe(60);
    expect(taipei.weather[0].text).toBe("多雲午後短暫雷陣雨");
  });

  it("reads the older F-D0047 format with local timestamps", () => {
    const [kaohsiung] = parseForecastPayload(fx.forecast3dOld());
    expect(kaohsiung.county).toBe("高雄市");
    expect(kaohsiung.apparent.map((p) => p.value)).toEqual([37, 36, 35, 34]);
    expect(kaohsiung.rain).toEqual([
      { start: Date.parse("2026-10-06T15:00:00+08:00"), end: Date.parse("2026-10-06T21:00:00+08:00"), value: 20 },
    ]);
    expect(kaohsiung.weather[0].text).toBe("晴時多雲");
  });

  it("reads daily UV and max temperature from the week forecast", () => {
    const [taipei] = parseForecastPayload(fx.forecastWeek());
    expect(taipei.uvDaily.map((b) => b.value)).toEqual([9, 6]);
    expect(taipei.maxTemperature[0].value).toBe(36);
  });

  it("reads F-C0032-001 parameters", () => {
    const [taipei] = parseForecastPayload(fx.forecast36h());
    expect(taipei.weather[0].text).toBe("多雲時晴");
    expect(taipei.maxTemperature[0].value).toBe(34);
    expect(taipei.rain[0].value).toBe(30);
  });

  it("prefers earlier sources when merging overlapping blocks", () => {
    const merged = mergeForecasts(parseForecastPayload(fx.forecast3dNew()), parseForecastPayload(fx.forecast36h())).get("臺北市")!;
    const at1630 = Date.parse("2026-10-06T16:30:00+08:00");
    expect(blockAt(merged.rain, at1630)?.value).toBe(60);
    // the 36-hour forecast fills the hours before the 3-day forecast starts
    expect(blockAt(merged.rain, Date.parse("2026-10-06T13:30:00+08:00"))?.value).toBe(30);
    expect(blockAt(merged.weather, Date.parse("2026-10-06T13:30:00+08:00"))?.text).toBe("多雲時晴");
    expect(blockAt(merged.weather, at1630)?.text).toBe("多雲午後短暫雷陣雨");
  });

  it("interpolates between 3-hourly points but not across gaps", () => {
    const points = [
      { time: 0, value: 30 },
      { time: 3 * 3600_000, value: 36 },
    ];
    expect(valueAt(points, 3600_000)).toBe(32);
    expect(valueAt(points, -1)).toBeUndefined();
    expect(valueAt([{ time: 0, value: 30 }, { time: 12 * 3600_000, value: 20 }], 3600_000)).toBeUndefined();
  });
});

describe("CWA requests", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("aborts a stalled request", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        (_url: string, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
          }),
      ),
    );
    const request = fetchCwaJson("O-A0003-001", "key");
    const rejection = expect(request).rejects.toThrow("O-A0003-001 request timed out");
    await vi.advanceTimersByTimeAsync(15_000);
    await rejection;
  });

  it("keeps the datasets that answer and reports the rest", async () => {
    const payloads: Record<string, unknown> = {
      "O-A0003-001": fx.observations(),
      "O-A0005-001": fx.dailyUv(),
      "F-D0047-089": fx.forecast3dNew(),
      "F-D0047-091": { success: "true", records: {} },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url: string) => {
        const id = Object.keys(payloads).find((key) => url.includes(key));
        if (!id) return { ok: false, status: 503, json: async () => ({}) };
        return { ok: true, json: async () => payloads[id] };
      }),
    );
    const { bundle, issues, usable } = await loadCwaBundle("key");
    expect(usable).toBe(true);
    expect(Object.keys(bundle).sort()).toEqual(["dailyUv", "forecast3d", "observations"]);
    expect(issues).toEqual(["36 小時預報讀取失敗（F-C0032-001 HTTP 503）", "一週預報沒有可用資料"]);
  });

  it("drops daily UV when observations are missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url: string) =>
        url.includes("O-A0005-001")
          ? { ok: true, json: async () => fx.dailyUv() }
          : url.includes("F-D0047-089")
            ? { ok: true, json: async () => fx.forecast3dNew() }
            : { ok: false, status: 500, json: async () => ({}) },
      ),
    );
    const { bundle, issues } = await loadCwaBundle("key");
    expect(bundle.dailyUv).toBeUndefined();
    expect(issues).toContain("每日紫外線最大值缺少測站對照，暫不使用");
  });
});
