import type { RegionKey } from "../../lib/types";

export type LoadStatus = "loading" | "ready" | "error";
export type SortKey = "danger" | "uv" | "heat" | "safe";
export type RegionFilter = RegionKey | "all";
