import type { AdviceItem, CountyRisk, RiskLevel, RiskTone } from "./types";

const riskOrder: RiskTone[] = ["low", "moderate", "high", "very-high", "extreme"];

export const riskCopy: Record<RiskTone, Omit<RiskLevel, "score">> = {
  unknown: {
    tone: "unknown",
    label: "資料不足",
    shortLabel: "缺",
    colorClass: "text-slate-600",
    bgClass: "bg-slate-50",
    borderClass: "border-slate-200",
  },
  low: {
    tone: "low",
    label: "低風險",
    shortLabel: "低",
    colorClass: "text-emerald-700",
    bgClass: "bg-emerald-50",
    borderClass: "border-emerald-200",
  },
  moderate: {
    tone: "moderate",
    label: "中等風險",
    shortLabel: "中",
    colorClass: "text-sun-600",
    bgClass: "bg-sun-50",
    borderClass: "border-sun-300",
  },
  high: {
    tone: "high",
    label: "高風險",
    shortLabel: "高",
    colorClass: "text-orange-700",
    bgClass: "bg-orange-50",
    borderClass: "border-orange-200",
  },
  "very-high": {
    tone: "very-high",
    label: "非常高風險",
    shortLabel: "很高",
    colorClass: "text-heat-700",
    bgClass: "bg-heat-50",
    borderClass: "border-heat-100",
  },
  extreme: {
    tone: "extreme",
    label: "極端風險",
    shortLabel: "極端",
    colorClass: "text-fuchsia-800",
    bgClass: "bg-fuchsia-50",
    borderClass: "border-fuchsia-200",
  },
};

const level = (tone: RiskTone): RiskLevel => ({
  ...riskCopy[tone],
  score: tone === "unknown" ? -1 : riskOrder.indexOf(tone),
});

export const uvRiskLevel = (uv?: number): RiskLevel => {
  if (uv === undefined || Number.isNaN(uv)) return level("unknown");
  if (uv <= 2) return level("low");
  if (uv <= 5) return level("moderate");
  if (uv <= 7) return level("high");
  if (uv <= 10) return level("very-high");
  return level("extreme");
};

export const heatIndexCelsius = (
  temperature?: number,
  humidity?: number,
): number | undefined => {
  if (temperature === undefined || humidity === undefined) return undefined;
  if (temperature < 27 || humidity < 40) return temperature;

  const tempF = (temperature * 9) / 5 + 32;
  const rh = humidity;
  const hiF =
    -42.379 +
    2.04901523 * tempF +
    10.14333127 * rh -
    0.22475541 * tempF * rh -
    0.00683783 * tempF * tempF -
    0.05481717 * rh * rh +
    0.00122874 * tempF * tempF * rh +
    0.00085282 * tempF * rh * rh -
    0.00000199 * tempF * tempF * rh * rh;

  return Number((((hiF - 32) * 5) / 9).toFixed(1));
};

export const buildAdvice = (county: CountyRisk): AdviceItem[] => {
  const advice: AdviceItem[] = [];

  if (county.uvLevel.tone === "unknown") {
    advice.push({
      title: county.uvStale ? "UV 觀測已過期" : "UV 資料不足",
      body: county.uvStale
        ? "最近 UV 測站觀測已超過 45 分鐘，不再用來判斷目前風險；請查看中央氣象署正式資訊。"
        : "目前缺少具有效時間的 UV 測站觀測；缺資料不代表低風險，請查看中央氣象署正式資訊。",
      tone: "unknown",
    });
  } else if (county.uvLevel.score >= 3) {
    advice.push({
      title: "防曬升級",
      body: "上午 10 點到下午 2 點減少曝曬，補擦 SPF 30+ 防曬，帽子、太陽眼鏡與長袖一起使用。",
      tone: county.uvLevel.tone,
    });
  } else if (county.uvLevel.score >= 1) {
    advice.push({
      title: "基本防曬",
      body: "長時間在戶外仍建議擦防曬，安排陰影休息點，避免讓兒童連續曝曬。",
      tone: county.uvLevel.tone,
    });
  } else {
    advice.push({
      title: "目前測站 UV 較低",
      body: "這只表示此測站的 UV 曝曬較低，不代表高溫、官方警特報或其他戶外風險較低；山區、海邊與水面反射仍可能提高曝曬量。",
      tone: "low",
    });
  }

  return advice;
};
