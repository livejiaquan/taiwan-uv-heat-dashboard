import { describe, expect, it } from "vitest";
import { AGING_MAX_MS, LIVE_MAX_MS, OLD_MAX_MS, dataTimeLabel, freshnessOf } from "./freshness";

const t0 = "2026-10-23T08:00:00+08:00";
const at = (ms: number) => Date.parse(t0) + ms;

describe("freshness tiers", () => {
  it.each([
    [0, "live"],
    [LIVE_MAX_MS, "live"],
    [LIVE_MAX_MS + 1, "aging"],
    [AGING_MAX_MS, "aging"],
    [AGING_MAX_MS + 1, "old"],
    [OLD_MAX_MS, "old"],
    [OLD_MAX_MS + 1, "unusable"],
  ] as const)("data %i ms old is %s", (age, tier) => {
    expect(freshnessOf(t0, at(age))).toBe(tier);
  });

  it("treats data stamped slightly ahead of the device clock as current", () => {
    expect(freshnessOf(t0, at(-5 * 60_000))).toBe("live");
  });

  it("labels the data time and its age", () => {
    expect(dataTimeLabel(t0, at(3 * 60 * 60_000))).toBe("資料時間 08:00 · 3 小時前");
    expect(dataTimeLabel(t0, at(30 * 60 * 60_000))).toBe("資料時間 10/23 08:00 · 1 天前");
  });
});
