import { HEAT_LEVELS, UV_LEVELS, burnMinutes, heatAlertFor, heatLevel, uvLevel } from "./levels";
import { pad2 } from "./time";
import type { DayOutlook } from "./types";

export type HourRange = [number, number];
export type Audience = "general" | "family" | "sport" | "work";

const HOT = 32; // apparent temperature where heat guidance starts (警戒)
const PROTECT_UV = 3; // UV index where sun protection is recommended

/** Group consecutive true hours into inclusive [start, end] ranges. */
export const ranges = (flags: boolean[]): HourRange[] => {
  const out: HourRange[] = [];
  let start: number | null = null;
  flags.forEach((on, hour) => {
    if (on && start === null) start = hour;
    if (!on && start !== null) {
      out.push([start, hour - 1]);
      start = null;
    }
  });
  if (start !== null) out.push([start, flags.length - 1]);
  return out;
};

/** "08–16 時" (end shown exclusive, i.e. until the end of the last hour) or "08 時". */
export const formatRange = ([a, b]: HourRange): string =>
  a === b ? `${pad2(a)} 時` : `${pad2(a)}–${pad2(b + 1)} 時`;

export const formatRanges = (list: HourRange[]): string => list.map(formatRange).join("、");

export interface DayFacts {
  protect: HourRange[];
  hot: HourRange[];
  wet: HourRange[];
  peakHour?: number;
  exercise: string[];
  rainWord: string;
}

export const factsFor = (day: DayOutlook): DayFacts => {
  const { hours } = day;
  const protect = ranges(hours.map((h) => (h.uv ?? 0) >= PROTECT_UV));
  const hot = ranges(hours.map((h) => (h.apparent ?? -Infinity) >= HOT));
  const wet = ranges(hours.map((h) => (h.rain ?? 0) >= 50));

  let peakHour: number | undefined;
  hours.forEach((h, hour) => {
    if (h.apparent === undefined) return;
    if (peakHour === undefined || h.apparent > (hours[peakHour].apparent ?? -Infinity)) peakHour = hour;
  });

  // Good for exercise: daylight-ish hours with known, low UV and known, mild heat.
  const ok = hours.map(
    (h, hour) => hour >= 5 && hour <= 21 && h.uv !== undefined && h.uv < PROTECT_UV && h.apparent !== undefined && h.apparent < HOT,
  );
  const exercise: string[] = [];
  if (peakHour !== undefined) {
    const morning = ok.slice(0, peakHour).lastIndexOf(true);
    if (morning >= 5) exercise.push(`${pad2(morning + 1)} 時前`);
    const evening = ok.findIndex((good, hour) => good && hour > peakHour!);
    if (evening >= 0) exercise.push(`${pad2(evening)} 時後`);
  }

  const rainWord = day.weather?.includes("雷") ? "雷陣雨" : "陣雨";
  return { protect, hot, wet, peakHour, exercise, rainWord };
};

export interface Verdict {
  title: string;
  lede: string;
  uv?: number;
  apparent?: number;
  uvIndex: number;
  heatIndex: number;
  protectText: string;
}

export const verdictFor = (
  day: DayOutlook,
  hour: number,
  dayWord: string,
  skinMed: number,
): Verdict => {
  const facts = factsFor(day);
  const point = day.hours[hour];
  const uv = point?.uv;
  const apparent = point?.apparent;
  const ul = uvLevel(uv);
  const tl = heatLevel(apparent);
  const protectText = facts.protect.length ? formatRanges(facts.protect) : day.uvMax === undefined ? "資料不足" : `${dayWord}不需特別防曬`;
  const base = { uv, apparent, uvIndex: ul, heatIndex: tl, protectText };

  if (ul < 0 && tl < 0) {
    return { ...base, title: "這個時段資料不足", lede: "目前沒有這個時段的紫外線與體感溫度資料，出門前請以中央氣象署最新資訊為準。" };
  }

  const sunDown = (uv ?? 0) === 0 && (hour >= 17 || hour < 7);
  if (sunDown && hour >= 17) {
    return {
      ...base,
      title: tl >= 2 ? "日曬已結束，但仍然悶熱" : "日曬已結束，適合散步與運動",
      lede: `${dayWord}的防曬時段是 ${protectText}，這個時間不需要防曬。${tl >= 2 ? `體感 ${Math.round(apparent!)}°，運動時降低強度、多補水。` : ""}`,
    };
  }
  if (sunDown && hour < 5) {
    return {
      ...base,
      title: tl >= 2 ? "夜間沒有日曬，但仍然悶熱" : "夜間沒有日曬",
      lede: `${dayWord}的防曬時段預計是 ${protectText}，白天出門前先擦好防曬。`,
    };
  }
  if (sunDown) {
    return {
      ...base,
      title: tl >= 2 ? "太陽還沒變強，但已經悶熱" : "太陽還沒變強，適合晨間運動",
      lede: `${dayWord}的防曬時段預計是 ${protectText}，出門前先擦好防曬。`,
    };
  }

  const severity = Math.max(ul >= 3 ? 3 : ul, tl);
  const title =
    severity >= 3
      ? "現在不建議長時間在戶外"
      : severity === 2
        ? "可以出門，做好防曬與補水"
        : severity === 1
          ? "可以出門，留意防曬"
          : "現在很適合外出";

  const parts: string[] = [];
  if (uv !== undefined && ul >= 3) {
    parts.push(`紫外線 ${Math.round(uv)}，是${UV_LEVELS[ul].name}，以你的膚質約 ${burnMinutes(uv, skinMed)} 分鐘就會曬紅`);
  } else if (uv !== undefined && ul >= 1) {
    parts.push(`紫外線 ${Math.round(uv)}，長時間在戶外要擦防曬`);
  }
  if (apparent !== undefined && tl >= 3) parts.push(`體感 ${Math.round(apparent)}°，戶外活動要每 15 到 20 分鐘補水並找陰涼處休息`);
  else if (apparent !== undefined && tl === 2) parts.push(`體感 ${Math.round(apparent)}°，悶熱，活動時放慢節奏`);
  if ((point?.rain ?? 0) >= 50) parts.push(`這個時段降雨機率 ${point!.rain}%，可能有${facts.rainWord}`);
  const lede = parts.length ? `${parts.join("；")}。` : "紫外線和溫度都在舒適範圍。";

  return { ...base, title, lede };
};

export type PackItem = [item: string, why: string];

export const packFor = (day: DayOutlook): PackItem[] => {
  const facts = factsFor(day);
  const protect = formatRanges(facts.protect);
  const wet = formatRanges(facts.wet);
  const uvMax = day.uvMax ?? 0;
  const heat = day.apparentMax;
  const items: PackItem[] = [];
  if (uvMax >= 3) items.push(["防曬乳", `SPF 30 以上，${protect}之間每 2 小時補擦`]);
  if (uvMax >= 6 && wet) items.push(["晴雨兩用傘", `中午擋太陽，${wet}擋${facts.rainWord}`]);
  else if (uvMax >= 6) items.push(["陽傘或寬簷帽", "遮住臉和後頸"]);
  else if (wet) items.push(["雨傘", `${wet}可能有${facts.rainWord}`]);
  if (uvMax >= 6) items.push(["太陽眼鏡", "選有抗 UV 標示的鏡片"]);
  if (heat !== undefined && heat >= 36) items.push(["水壺", `體感會到 ${Math.round(heat)}°，戶外每 15 到 20 分鐘喝幾口`]);
  else if (heat !== undefined && heat >= HOT) items.push(["水壺", "天氣悶熱，隨身帶水"]);
  return items;
};

export type AdviceItem = [when: string, title: string, body: string];

export const adviceFor = (day: DayOutlook, audience: Audience, dayWord: string): AdviceItem[] => {
  const facts = factsFor(day);
  const uvHigh = uvLevel(day.uvMax) >= 3;
  const heatHigh = heatLevel(day.apparentMax) >= 3;
  const protect = facts.protect.length ? formatRanges(facts.protect) : "全天";
  const hot = facts.hot.length ? formatRanges(facts.hot) : undefined;
  const exercise = facts.exercise.length ? facts.exercise.join("、") : `${dayWord}沒有理想時段`;
  const peak = facts.peakHour === undefined ? "最熱時段" : `${pad2(facts.peakHour)} 時前後`;
  const peakBody =
    day.apparentMax === undefined
      ? "體感溫度資料不足，出門前請再確認中央氣象署預報。"
      : `${dayWord}體感最高約 ${Math.round(day.apparentMax)}°，盡量把通勤和採買排在這個時段之外。`;

  const sets: Record<Audience, AdviceItem[]> = {
    general: [
      [protect, "防曬", uvHigh ? "撐傘或戴寬簷帽，擦 SPF 30 以上防曬，每 2 小時補擦，流汗擦汗後也要補。" : "長時間在戶外仍建議擦防曬。"],
      [hot ?? "全天", "補水", heatHigh ? "不要等口渴才喝水，外出隨身帶水，室內外進出避免溫差太大。" : "一般補水即可，活動久了記得休息。"],
      [peak, "最熱時段", peakBody],
    ],
    family: [
      [protect, "避開正午", "幼兒和長者對曝曬與高溫更敏感，這段時間的戶外行程改到室內或陰涼處。"],
      ["全天", "室內也要注意", heatHigh ? "長者在家也可能中暑，留意室溫、開風扇或冷氣，定時提醒喝水。" : "保持室內通風，定時提醒長者喝水。"],
      ["上下學", "接送", "車內溫度上升很快，任何時候都不要把孩子留在車內。"],
    ],
    sport: [
      [exercise, "建議時段", "避開紫外線和體感溫度都偏高的時段，戶外訓練排在清晨或傍晚。"],
      ["運動中", "補水節奏", "每 15 到 20 分鐘補充約 150 到 250 毫升水分，流汗多時補充電解質。"],
      ["警訊", "立刻停下", "出現頭暈、噁心、皮膚發燙不再流汗時，移到陰涼處降溫，必要時就醫。"],
    ],
    work: [
      [hot ?? "高溫時段", "調整作業", "依勞動部高氣溫戶外作業熱危害預防指引，安排遮蔭休息、輪班與補水。"],
      [protect, "防曬裝備", "穿透氣長袖、戴帽簷遮頸的帽子，曝曬部位擦防曬。"],
      ["新進或剛復工", "循序適應", "前幾天降低工作量，讓身體逐步適應高溫環境。"],
    ],
  };
  return sets[audience];
};

export const shareText = (county: string, day: DayOutlook, dayWord: string, demo: boolean): string => {
  const facts = factsFor(day);
  const lines = [`【${county}・${dayWord}曬熱提醒】`];
  if (day.uvMax !== undefined) {
    const protect = facts.protect.length ? formatRanges(facts.protect) : "不需特別防曬";
    lines.push(`防曬時段：${protect}（最高 UV ${Math.round(day.uvMax)}，${UV_LEVELS[uvLevel(day.uvMax)].name}）`);
  }
  if (facts.peakHour !== undefined && day.apparentMax !== undefined) {
    lines.push(`最熱：${pad2(facts.peakHour)} 時，體感 ${Math.round(day.apparentMax)}°`);
  }
  const alert = heatAlertFor(day.airMax);
  if (alert) lines.push(`高溫：最高氣溫約 ${Math.round(day.airMax!)}°C，達氣象署高溫資訊${alert.name}`);
  if (facts.wet.length) lines.push(`降雨：${formatRanges(facts.wet)}可能有${facts.rainWord}`);
  if (facts.peakHour !== undefined) {
    lines.push(`適合運動：${facts.exercise.length ? facts.exercise.join("、") : `${dayWord}全天偏熱，改室內`}`);
  }
  const pack = packFor(day).map(([item]) => item);
  if (pack.length) lines.push(`出門帶：${pack.join("、")}`);
  lines.push(demo ? "（台灣曬熱指南・示範資料）" : "（台灣曬熱指南・資料來源：中央氣象署）");
  return lines.join("\n");
};

export { HEAT_LEVELS, UV_LEVELS };
