import type { CountyForecast, StationObservation } from "../lib/types";

const baseDate = new Date(Date.now() - 12 * 60 * 1000).toISOString();
const forecastStart = new Date(Date.now() - 30 * 60 * 1000).toISOString();
const forecastEnd = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();

const rows = [
  ["臺北市", "中正區", "臺北", 33.2, 62, 8, 35, "多雲午後短暫雷陣雨"],
  ["新北市", "板橋區", "板橋", 34.1, 58, 8, 35, "晴時多雲"],
  ["基隆市", "中正區", "基隆", 30.2, 75, 6, 31, "多雲"],
  ["桃園市", "桃園區", "桃園", 33.8, 60, 9, 36, "晴時多雲"],
  ["新竹縣", "竹北市", "竹北", 33.5, 55, 9, 35, "晴時多雲"],
  ["新竹市", "東區", "新竹", 32.8, 57, 9, 34, "晴時多雲"],
  ["苗栗縣", "苗栗市", "苗栗", 34.6, 53, 10, 36, "晴朗炎熱"],
  ["臺中市", "西屯區", "臺中", 35.4, 52, 10, 37, "晴朗炎熱"],
  ["彰化縣", "彰化市", "彰化", 34.9, 57, 10, 36, "晴時多雲"],
  ["南投縣", "南投市", "南投", 35.6, 50, 11, 37, "晴朗炎熱"],
  ["雲林縣", "斗六市", "斗六", 35.9, 54, 11, 37, "晴朗炎熱"],
  ["嘉義縣", "太保市", "太保", 35.8, 56, 11, 37, "晴朗炎熱"],
  ["嘉義市", "東區", "嘉義", 35.3, 55, 11, 36, "晴朗炎熱"],
  ["臺南市", "安平區", "臺南", 34.7, 63, 10, 36, "晴時多雲"],
  ["高雄市", "前鎮區", "高雄", 34.9, 66, 10, 36, "晴時多雲"],
  ["屏東縣", "屏東市", "屏東", 36.1, 61, 12, 38, "晴朗炎熱"],
  ["宜蘭縣", "宜蘭市", "宜蘭", 31.2, 74, 6, 32, "多雲短暫陣雨"],
  ["花蓮縣", "花蓮市", "花蓮", 31.7, 72, 7, 32, "多雲"],
  ["臺東縣", "臺東市", "臺東", 32.6, 69, 9, 34, "晴時多雲"],
  ["澎湖縣", "馬公市", "馬公", 31.9, 70, 10, 33, "晴時多雲"],
  ["金門縣", "金城鎮", "金門", 32.4, 67, 9, 34, "晴時多雲"],
  ["連江縣", "南竿鄉", "馬祖", 29.8, 78, 7, 31, "多雲"],
] as const;

const demoRows = rows.map(([county, town, station, temp, humidity, uv, forecast, weather]) => ({
  county,
  town,
  station,
  temp,
  humidity,
  uv,
  forecast,
  weather,
}));

export const demoObservations: StationObservation[] = demoRows.map((row, index) => ({
  stationId: `DEMO-${String(index + 1).padStart(2, "0")}`,
  stationName: row.station,
  county: row.county,
  town: row.town,
  observedAt: baseDate,
  temperature: row.temp,
  humidity: row.humidity,
  uvIndex: row.uv,
}));

export const demoForecasts: CountyForecast[] = demoRows.map((row) => ({
  county: row.county,
  maxTemperature: row.forecast,
  weather: row.weather,
  startTime: forecastStart,
  endTime: forecastEnd,
}));
