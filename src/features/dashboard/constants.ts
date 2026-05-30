import type { RiskTone } from "../../lib/types";
import type { RegionFilter, SortKey } from "./types";

export const regionOptions: Array<{ key: RegionFilter; label: string }> = [
  { key: "all", label: "全部" },
  { key: "north", label: "北部" },
  { key: "central", label: "中部" },
  { key: "south", label: "南部" },
  { key: "east", label: "東部" },
  { key: "islands", label: "外島" },
];

export const sortOptions: Array<{ key: SortKey; label: string }> = [
  { key: "danger", label: "危險優先" },
  { key: "uv", label: "UV 最高" },
  { key: "heat", label: "熱風險最高" },
  { key: "safe", label: "較安全" },
];

export const toneStyles: Record<RiskTone, string> = {
  unknown: "from-slate-300 to-slate-500",
  low: "from-emerald-500 to-reef-500",
  moderate: "from-sun-300 to-sun-500",
  high: "from-orange-400 to-orange-600",
  "very-high": "from-heat-500 to-orange-600",
  extreme: "from-fuchsia-600 to-heat-700",
};
