import { afterEach, describe, expect, it, vi } from "vitest";
import { createWeatherSnapshot, parseWeatherSnapshot } from "./snapshot";
import { loadDashboardData } from "./load";
import { buildSnapshotDashboard } from "./outlook";
import * as fx from "./__fixtures__/cwa";

const sample = () => createWeatherSnapshot({ observations: fx.observations(), forecast3d: fx.forecast3dNew(), forecastWeek: fx.forecastWeek() }, [], fx.NOW);

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("public weather snapshot", () => {
  it("publishes only normalized weather fields", () => {
    const payload = { ...fx.observations(), Authorization: "private-token", requestUrl: "private-url" };
    const snapshot = createWeatherSnapshot({ observations: payload }, [], fx.NOW);
    expect(JSON.stringify(snapshot)).not.toMatch(/private-token|private-url|Authorization/);
    expect(parseWeatherSnapshot(JSON.parse(JSON.stringify(snapshot)))).toEqual(snapshot);
  });

  it.each([
    null,
    { schemaVersion: 2 },
    { ...sample(), fetchedAt: "invalid" },
    { ...sample(), forecasts: [{ county: "臺北市" }] },
    { ...sample(), observations: [{ ...sample().observations[0], uvIndex: -1 }] },
    { ...sample(), forecasts: [{ ...sample().forecasts[0], rain: [{ start: 10, end: 0, value: 60 }] }] },
    { ...sample(), forecasts: [{ ...sample().forecasts[0], uvDaily: [{ start: 1e30, end: 2e30, value: 5 }] }] },
  ])("rejects malformed public JSON", (input) => {
    expect(() => parseWeatherSnapshot(input)).toThrow();
  });

  it("rebuilds today and tomorrow across Taipei midnight", () => {
    const data = buildSnapshotDashboard(sample(), Date.parse("2026-10-07T00:01:00+08:00"));
    expect(data.counties[0].days.map((d) => d.date)).toEqual(["2026-10-07", "2026-10-08"]);
    expect(data.counties.every((c) => c.days[0].hours.every((h) => h.uv === undefined && h.apparent === undefined))).toBe(true);
    expect(data.issues).toContain("資料快照已超過 2 小時，暫停顯示數值與時段建議。");
  });

  it("expires observations as the clock advances and uses forecasts with their own source", () => {
    const snapshot = sample();
    const fresh = buildSnapshotDashboard(snapshot, fx.NOW).counties.find((c) => c.county === "臺北市")!;
    expect(fresh.days[0].hours[13].uvOrigin?.kind).toBe("observation");
    const later = buildSnapshotDashboard(snapshot, fx.NOW + 40 * 60_000).counties.find((c) => c.county === "臺北市")!;
    expect(later.days[0].hours.some((h) => h.uvOrigin?.kind === "observation")).toBe(false);
    expect(later.days[0].hours[14].uvOrigin?.kind).toBe("estimate");
  });

  it("does not mark estimated UV as an observation when only heat is observed", () => {
    const snapshot = sample();
    snapshot.observations.forEach((s) => { s.uvIndex = undefined; });
    const c = buildSnapshotDashboard(snapshot, fx.NOW).counties.find((c) => c.county === "臺北市")!;
    expect(c.days[0].hours[13].uvOrigin?.kind).toBe("estimate");
    expect(c.days[0].hours[13].apparentOrigin?.kind).toBe("observation");
  });

  it("does not let a future snapshot claim current readings", () => {
    const data = buildSnapshotDashboard(sample(), fx.NOW - 10 * 60_000);
    expect(data.counties[0].days[0].uvMax).toBeUndefined();
    expect(data.stale).toBe(true);
  });
});

describe("snapshot loading", () => {
  it("fetches same-site JSON without credentials", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => sample() });
    vi.stubGlobal("fetch", fetch);
    const snapshot = await loadDashboardData();
    expect(snapshot.schemaVersion).toBe(1);
    expect(fetch.mock.calls[0][0]).toMatch(/data\/weather\.json$/);
    expect(fetch.mock.calls[0][0]).not.toMatch(/Authorization|opendata\.cwa/);
  });

  it("fails closed when the snapshot is missing instead of generating demo weather", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(loadDashboardData()).rejects.toThrow();
  });
});
