export type RegionKey = "north" | "central" | "south" | "east" | "islands";

export type RiskTone =
  | "unknown"
  | "low"
  | "moderate"
  | "high"
  | "very-high"
  | "extreme";

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
  uvObservedAt?: string;
  uvStationName?: string;
  uvStale?: boolean;
  observedTemperature?: number;
  humidity?: number;
  heatIndex?: number;
  heatIndexObservedAt?: string;
  heatIndexStationName?: string;
  heatIndexStale?: boolean;
  temperatureObservedAt?: string;
  temperatureStationName?: string;
  temperatureStale?: boolean;
  forecastMaxTemperature?: number;
  forecastWeather?: string;
  forecastStartTime?: string;
  forecastEndTime?: string;
  dataQuality: "complete" | "partial" | "missing";
  uvLevel: RiskLevel;
  priorityLevel: RiskLevel;
  priorityScore: number;
  stale: boolean;
  advice: AdviceItem[];
}

export interface AdviceItem {
  title: string;
  body: string;
  tone: RiskTone;
}

export interface DashboardStats {
  totalCounties: number;
  highUvCounties: number;
  missingDataCount: number;
  stale: boolean;
  latestUpdate?: string;
  highestUv?: CountyRisk;
  highestTemperature?: CountyRisk;
  lowestUv?: CountyRisk;
  sourceSummary: string;
  errors: string[];
}

export interface DashboardData {
  counties: CountyRisk[];
  stats: DashboardStats;
}

export interface RawCwaBundle {
  observations?: unknown;
  forecast?: unknown;
}
