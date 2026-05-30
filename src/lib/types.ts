export type RegionKey = "north" | "central" | "south" | "east" | "islands";

export type RiskTone =
  | "unknown"
  | "low"
  | "moderate"
  | "high"
  | "very-high"
  | "extreme";

export type DataMode = "live" | "demo";

export interface RiskLevel {
  tone: RiskTone;
  label: string;
  shortLabel: string;
  score: number;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export interface CountyMeta {
  county: string;
  region: RegionKey;
  regionLabel: string;
  lat: number;
  lon: number;
}

export interface StationObservation {
  stationId: string;
  stationName: string;
  county: string;
  town?: string;
  observedAt: string;
  temperature?: number;
  humidity?: number;
  uvIndex?: number;
}

export interface CountyForecast {
  county: string;
  maxTemperature?: number;
  minTemperature?: number;
  weather?: string;
  startTime?: string;
  endTime?: string;
}

export interface CountyRisk {
  county: string;
  region: RegionKey;
  regionLabel: string;
  lat: number;
  lon: number;
  observedAt?: string;
  stationCount: number;
  uvIndex?: number;
  uvSource: "current" | "dailyMax" | "demo" | "missing";
  observedTemperature?: number;
  humidity?: number;
  heatIndex?: number;
  forecastMaxTemperature?: number;
  forecastWeather?: string;
  dataQuality: "complete" | "partial" | "missing";
  uvLevel: RiskLevel;
  heatLevel: RiskLevel;
  overallLevel: RiskLevel;
  overallScore: number;
  advice: AdviceItem[];
}

export interface AdviceItem {
  title: string;
  body: string;
  tone: RiskTone;
}

export interface DashboardStats {
  totalCounties: number;
  dangerousCounties: number;
  missingDataCount: number;
  stale: boolean;
  latestUpdate?: string;
  highestUv?: CountyRisk;
  highestHeat?: CountyRisk;
  safest?: CountyRisk;
  dataMode: DataMode;
  sourceSummary: string;
  errors: string[];
}

export interface DashboardData {
  counties: CountyRisk[];
  stats: DashboardStats;
}

export interface RawCwaBundle {
  observations?: unknown;
  dailyUv?: unknown;
  forecast?: unknown;
}
