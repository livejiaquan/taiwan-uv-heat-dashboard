export type RegionKey = "north" | "central" | "south" | "east" | "islands";

export type DataMode = "live" | "demo";

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
  observedAt?: string;
  temperature?: number;
  humidity?: number;
  uvIndex?: number;
  windSpeed?: number;
}

/** A forecast value valid at one instant (epoch ms). */
export interface SeriesPoint {
  time: number;
  value: number;
}

/** A forecast value valid over [start, end) (epoch ms). */
export interface SeriesBlock {
  start: number;
  end: number;
  value: number;
}

export interface TextBlock {
  start: number;
  end: number;
  text: string;
}

/** Forecast series for one county, merged from the CWA forecast datasets. */
export interface CountyForecast {
  county: string;
  temperature: SeriesPoint[];
  apparent: SeriesPoint[];
  humidity: SeriesPoint[];
  rain: SeriesBlock[];
  weather: TextBlock[];
  uvDaily: SeriesBlock[];
  maxTemperature: SeriesBlock[];
}

export interface HourPoint {
  /** UV index; estimated from the day's forecast maximum unless observed. */
  uv?: number;
  /** Apparent temperature (°C), CWA 體感溫度. */
  apparent?: number;
  /** Air temperature (°C). */
  temperature?: number;
  /** Probability of precipitation (%). */
  rain?: number;
  /** True when this hour carries live station readings instead of forecasts. */
  observed: boolean;
}

export interface DayOutlook {
  /** Taipei calendar date, YYYY-MM-DD. */
  date: string;
  weather?: string;
  hours: HourPoint[];
  uvMax?: number;
  apparentMax?: number;
  airMax?: number;
}

export interface CountyOutlook extends CountyMeta {
  observedAt?: string;
  stationCount: number;
  /** [today, tomorrow] in Taipei time. */
  days: [DayOutlook, DayOutlook];
}

export interface DashboardData {
  mode: DataMode;
  counties: CountyOutlook[];
  generatedAt: string;
  latestObservation?: string;
  stale: boolean;
  /** Human-readable problems with the sources, shown in the status line. */
  issues: string[];
}

export interface RawCwaBundle {
  observations?: unknown;
  dailyUv?: unknown;
  forecast36h?: unknown;
  forecast3d?: unknown;
  forecastWeek?: unknown;
}
