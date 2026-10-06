import { describe, expect, it } from "vitest";
import { buildDemoDashboard } from "../data/demo";
import { adviceFor, factsFor, packFor, shareText, verdictFor, type Audience } from "./guidance";
import { apparentTemperature, burnMinutes, heatAlertFor, heatLevel, uvDayShape, uvLevel } from "./levels";
import { buildLiveDashboard } from "./outlook";
import type { DayOutlook, HourPoint } from "./types";
import * as fx from "./__fixtures__/cwa";

const live = () =>
  buildLiveDashboard(
    {
      observations: fx.observations(),
      dailyUv: fx.dailyUv(),
      forecast3d: fx.forecast3dNew(),
      forecastWeek: fx.forecastWeek(),
      forecast36h: fx.forecast36h(),
    },
    [],
    fx.NOW,
  );

const day = (hours: Partial<HourPoint>[], extra: Partial<DayOutlook> = {}): DayOutlook => {
  const full = Array.from({ length: 24 }, (_, i) => ({ observed: false, ...hours[i] }));
  const max = (key: "uv" | "apparent" | "temperature") => {
    const values = full.map((h) => h[key]).filter((v): v is number => v !== undefined);
    return values.length ? Math.max(...values) : undefined;
  };
  return { date: "2026-10-06", hours: full, uvMax: max("uv"), apparentMax: max("apparent"), airMax: max("temperature"), ...extra };
};

describe("levels", () => {
  it("returns -1 for missing values instead of a low level", () => {
    expect(uvLevel(undefined)).toBe(-1);
    expect(heatLevel(undefined)).toBe(-1);
    expect(uvLevel(10.4)).toBe(3);
    expect(uvLevel(10.6)).toBe(4);
  });

  it("computes CWA apparent temperature", () => {
    // 33°C, 60% RH, calm: 1.04·33 + 0.2·30.1 − 2.7 ≈ 37.6
    expect(apparentTemperature(33, 60)).toBeCloseTo(37.6, 1);
    expect(apparentTemperature(33, 60, 3)).toBe(35.7); // 37.65 − 0.65·3
    expect(apparentTemperature(33, undefined)).toBeUndefined();
  });

  it("estimates burn time and heat-alert thresholds", () => {
    expect(burnMinutes(10, 350)).toBe(23);
    expect(heatAlertFor(35.9)).toBeNull();
    expect(heatAlertFor(36)?.level).toBe(1);
    expect(heatAlertFor(38.2)?.level).toBe(2);
  });

  it("puts the UV peak around midday and zero at night", () => {
    expect(uvDayShape(11)).toBeGreaterThan(0.98);
    expect(uvDayShape(11)).toBeCloseTo(uvDayShape(12), 10); // symmetric about 11:30
    expect(uvDayShape(3)).toBe(0);
    expect(uvDayShape(19)).toBe(0);
  });
});

describe("live outlook", () => {
  it("uses station readings for the current hour", () => {
    const taipei = live().counties.find((c) => c.county === "臺北市")!;
    const now = taipei.days[0].hours[13];
    expect(now.observed).toBe(true);
    expect(now.uv).toBe(8);
    // the most oppressive fresh station wins: 33°C/60%/1 m/s
    expect(now.apparent).toBeCloseTo(apparentTemperature(33, 60, 1)!, 1);
    expect(now.temperature).toBe(33);
  });

  it("estimates hourly UV from the forecast daily maximum", () => {
    const taipei = live().counties.find((c) => c.county === "臺北市")!;
    expect(taipei.days[0].hours[11].uv).toBe(9);
    expect(taipei.days[0].hours[11].observed).toBe(false);
    expect(taipei.days[0].hours[2].uv).toBe(0);
    expect(taipei.days[1].uvMax).toBe(6);
  });

  it("interpolates forecast apparent temperature and leaves past hours empty", () => {
    const taipei = live().counties.find((c) => c.county === "臺北市")!;
    expect(taipei.days[0].hours[15].apparent).toBe(36);
    expect(taipei.days[0].hours[16].apparent).toBeCloseTo(35.3, 1);
    expect(taipei.days[0].hours[10].apparent).toBeUndefined();
    expect(taipei.days[1].hours[12].apparent).toBe(35);
    expect(taipei.days[0].hours[15].rain).toBe(60);
  });

  it("combines forecast maximum temperatures into the day's air maximum", () => {
    const taipei = live().counties.find((c) => c.county === "臺北市")!;
    expect(taipei.days[0].airMax).toBe(34);
    expect(taipei.days[1].airMax).toBe(36);
    expect(heatAlertFor(taipei.days[1].airMax)?.level).toBe(1);
  });

  it("does not present a stale station as the current reading", () => {
    const kaohsiung = live().counties.find((c) => c.county === "高雄市")!;
    expect(kaohsiung.days[0].hours[13].observed).toBe(false);
    expect(kaohsiung.observedAt).toBeUndefined();
    // today's observed daily maximum still provides the UV estimate
    expect(kaohsiung.days[0].uvMax).toBe(10);
  });

  it("reports counties without data and marks old observations stale", () => {
    const data = live();
    expect(data.mode).toBe("live");
    expect(data.issues.at(-1)).toMatch(/^20 個縣市目前缺少/);
    expect(data.stale).toBe(false);
    const later = buildLiveDashboard({ observations: fx.observations() }, [], fx.NOW + 60 * 60_000);
    expect(later.stale).toBe(true);
  });
});

describe("guidance", () => {
  it("says so when an hour has no data at all", () => {
    const v = verdictFor(day([]), 13, "今天", 350);
    expect(v.title).toBe("這個時段資料不足");
    expect(v.protectText).toBe("資料不足");
  });

  it("separates late night, early morning and evening", () => {
    const d = day(Array.from({ length: 24 }, (_, h) => ({ uv: h >= 7 && h <= 16 ? 5 : 0, apparent: 26 })));
    expect(verdictFor(d, 1, "今天", 350).title).toBe("夜間沒有日曬");
    expect(verdictFor(d, 6, "今天", 350).title).toBe("太陽還沒變強，適合晨間運動");
    expect(verdictFor(d, 20, "今天", 350).title).toBe("日曬已結束，適合散步與運動");
    expect(verdictFor(d, 12, "今天", 350).title).toBe("可以出門，留意防曬");
  });

  it("warns at high UV even when the heat is mild", () => {
    const d = day(Array.from({ length: 24 }, (_, h) => ({ uv: h === 12 ? 9 : 0, apparent: 25 })));
    const v = verdictFor(d, 12, "今天", 350);
    expect(v.title).toBe("現在不建議長時間在戶外");
    expect(v.lede).toContain("約 26 分鐘就會曬紅");
  });

  it("finds exercise windows on both sides of the hottest hour", () => {
    const apparent = [26, 26, 26, 26, 26, 27, 28, 30, 32, 34, 36, 37, 38, 38, 37, 35, 33, 31, 30, 29, 28, 28, 27, 27];
    const uv = [0, 0, 0, 0, 0, 0, 1, 2, 4, 6, 8, 9, 9, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0];
    const facts = factsFor(day(apparent.map((a, i) => ({ apparent: a, uv: uv[i] }))));
    expect(facts.peakHour).toBe(12);
    expect(facts.exercise).toEqual(["08 時前", "17 時後"]);
    expect(facts.protect).toEqual([[8, 15]]);
  });

  it("builds a packing list and a shareable message", () => {
    const d = day(
      Array.from({ length: 24 }, (_, h) => ({ uv: h >= 9 && h <= 14 ? 9 : 0, apparent: 37, temperature: 36, rain: h >= 14 && h <= 16 ? 70 : 10 })),
      { weather: "晴午後雷陣雨" },
    );
    expect(packFor(d).map(([item]) => item)).toEqual(["防曬乳", "晴雨兩用傘", "太陽眼鏡", "水壺"]);
    const text = shareText("屏東縣", d, "明天", false);
    expect(text).toContain("【屏東縣・明天曬熱提醒】");
    expect(text).toContain("降雨：14–17 時可能有雷陣雨");
    expect(text).toContain("達氣象署高溫資訊黃色燈號門檻");
    expect(text).toContain("資料來源：中央氣象署");
  });

  it("never renders placeholders as text for any county, day, hour or audience", () => {
    const data = buildDemoDashboard([], fx.NOW);
    const audiences: Audience[] = ["general", "family", "sport", "work"];
    for (const county of data.counties) {
      for (const [index, d] of county.days.entries()) {
        const word = index ? "明天" : "今天";
        const texts = [
          shareText(county.county, d, word, true),
          ...audiences.flatMap((a) => adviceFor(d, a, word).flat()),
          ...Array.from({ length: 24 }, (_, h) => Object.values(verdictFor(d, h, word, 350)).join(" ")),
        ];
        for (const text of texts) expect(text).not.toMatch(/NaN|undefined|Infinity|null/);
      }
    }
  });
});

describe("demo data", () => {
  it("covers every county for today and tomorrow", () => {
    const data = buildDemoDashboard(["示範"], fx.NOW);
    expect(data.mode).toBe("demo");
    expect(data.counties).toHaveLength(22);
    expect(data.counties[0].days.map((d) => d.date)).toEqual(["2026-10-06", "2026-10-07"]);
    for (const county of data.counties) for (const d of county.days) expect(d.hours.every((h) => h.uv !== undefined && h.apparent !== undefined)).toBe(true);
  });
});
