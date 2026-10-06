import { summarizeDay } from "../lib/outlook";
import { uvDayShape } from "../lib/levels";
import { addDays, taipeiDate } from "../lib/time";
import type { CountyOutlook, DashboardData, DayOutlook, HourPoint } from "../lib/types";
import { counties } from "./counties";

type Showers = false | "pm" | "front";
/** [peak UV, peak apparent temp, overnight apparent temp, peak air temp, showers, weather] */
type DayRow = [number, number, number, number, Showers, string];

// A hot early-autumn day with afternoon storms, then a front bringing rain to the north.
const ROWS: Record<string, [DayRow, DayRow]> = {
  臺北市: [[8, 37, 27, 34, "pm", "多雲午後雷陣雨"], [5, 33, 26, 31, "front", "鋒面接近，午前轉雨"]],
  新北市: [[8, 36, 26, 33, "pm", "多雲午後雷陣雨"], [5, 32, 25, 30, "front", "鋒面接近，午前轉雨"]],
  基隆市: [[6, 32, 25, 30, "pm", "多雲短暫陣雨"], [4, 30, 24, 28, "front", "陰有陣雨"]],
  桃園市: [[8, 35, 26, 33, "pm", "晴午後雷陣雨"], [6, 32, 25, 30, "front", "多雲時陰陣雨"]],
  新竹縣: [[9, 34, 25, 32, false, "晴時多雲"], [7, 33, 25, 31, "pm", "多雲午後陣雨"]],
  新竹市: [[9, 34, 26, 32, false, "晴時多雲"], [7, 33, 25, 31, "pm", "多雲午後陣雨"]],
  苗栗縣: [[9, 35, 25, 33, false, "晴時多雲"], [9, 34, 25, 32, "pm", "晴午後雷陣雨"]],
  臺中市: [[10, 36, 26, 34, false, "晴"], [10, 36, 26, 34, false, "晴"]],
  彰化縣: [[10, 36, 26, 33, false, "晴"], [10, 36, 26, 33, false, "晴"]],
  南投縣: [[10, 35, 23, 33, "pm", "晴午後雷陣雨"], [10, 35, 23, 33, "pm", "晴午後雷陣雨"]],
  雲林縣: [[10, 36, 26, 33, false, "晴"], [10, 36, 26, 33, false, "晴"]],
  嘉義縣: [[10, 37, 26, 34, false, "晴"], [10, 37, 26, 34, false, "晴"]],
  嘉義市: [[10, 37, 26, 34, false, "晴"], [10, 37, 26, 34, false, "晴"]],
  臺南市: [[10, 38, 27, 34, false, "晴時多雲"], [11, 38, 27, 35, false, "晴"]],
  高雄市: [[11, 38, 28, 33, "pm", "晴午後雷陣雨"], [11, 39, 28, 35, false, "晴"]],
  屏東縣: [[11, 39, 27, 36, "pm", "晴午後雷陣雨"], [11, 40, 27, 36, false, "晴，炎熱"]],
  宜蘭縣: [[7, 33, 25, 31, "pm", "多雲短暫陣雨"], [5, 31, 24, 29, "front", "多雲時陰陣雨"]],
  花蓮縣: [[8, 34, 26, 32, false, "晴時多雲"], [8, 34, 26, 32, "pm", "多雲午後陣雨"]],
  臺東縣: [[10, 35, 27, 32, false, "晴時多雲"], [10, 36, 27, 33, false, "晴時多雲"]],
  澎湖縣: [[9, 32, 27, 30, false, "晴時多雲"], [9, 32, 27, 30, false, "晴時多雲"]],
  金門縣: [[8, 33, 25, 31, false, "晴時多雲"], [7, 32, 25, 30, "pm", "多雲午後陣雨"]],
  連江縣: [[7, 29, 23, 27, false, "多雲"], [5, 28, 22, 26, "front", "陰有雨"]],
};

const RAIN: Record<"pm" | "front", Record<number, number>> = {
  pm: { 13: 40, 14: 60, 15: 70, 16: 70, 17: 50 },
  front: { 10: 30, 11: 50, 12: 60, 13: 70, 14: 80, 15: 80, 16: 70, 17: 60, 18: 50, 19: 40 },
};

const demoDay = (date: string, [uvPeak, htPeak, htMin, airPeak, showers, weather]: DayRow): DayOutlook => {
  const hours: HourPoint[] = Array.from({ length: 24 }, (_, h) => {
    let uv = uvPeak * uvDayShape(h);
    if (showers === "pm" && h >= 14 && h <= 16) uv *= 0.5;
    if (showers === "front" && h >= 11) uv *= 0.6;
    const t = h < 5 ? h + 24 : h;
    const shape = t <= 13 ? (1 - Math.cos((Math.PI * (t - 5)) / 8)) / 2 : (1 + Math.cos((Math.PI * (t - 13)) / 16)) / 2;
    let apparent = htMin + (htPeak - htMin) * shape;
    if (showers === "pm" && h >= 15 && h <= 17) apparent -= 2;
    return {
      uv: Math.round(uv),
      apparent: Math.round(apparent),
      temperature: Math.round(apparent - (htPeak - airPeak) * shape),
      rain: showers ? (RAIN[showers][h] ?? 10) : 10,
      observed: false,
    };
  });
  return summarizeDay({ date, weather, hours });
};

export const buildDemoDashboard = (issues: string[], now = Date.now()): DashboardData => {
  const today = taipeiDate(now);
  const tomorrow = addDays(today, 1);
  const outlooks: CountyOutlook[] = counties.map((meta) => {
    const [todayRow, tomorrowRow] = ROWS[meta.county];
    return {
      ...meta,
      stationCount: 0,
      days: [demoDay(today, todayRow), demoDay(tomorrow, tomorrowRow)],
    };
  });
  return {
    mode: "demo",
    counties: outlooks,
    generatedAt: new Date(now).toISOString(),
    stale: false,
    issues,
  };
};
