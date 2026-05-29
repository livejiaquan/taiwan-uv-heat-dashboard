import type { CountyMeta, RegionKey } from "../lib/types";

const regionLabels: Record<RegionKey, string> = {
  north: "北部",
  central: "中部",
  south: "南部",
  east: "東部",
  islands: "外島",
};

const countyRows = [
  { county: "臺北市", region: "north", lat: 25.0375, lon: 121.5637 },
  { county: "新北市", region: "north", lat: 25.012, lon: 121.4657 },
  { county: "基隆市", region: "north", lat: 25.1276, lon: 121.7392 },
  { county: "桃園市", region: "north", lat: 24.9936, lon: 121.301 },
  { county: "新竹縣", region: "north", lat: 24.8387, lon: 121.0177 },
  { county: "新竹市", region: "north", lat: 24.8138, lon: 120.9675 },
  { county: "苗栗縣", region: "central", lat: 24.5602, lon: 120.8214 },
  { county: "臺中市", region: "central", lat: 24.1477, lon: 120.6736 },
  { county: "彰化縣", region: "central", lat: 24.0757, lon: 120.544 },
  { county: "南投縣", region: "central", lat: 23.9609, lon: 120.9719 },
  { county: "雲林縣", region: "central", lat: 23.7092, lon: 120.4313 },
  { county: "嘉義縣", region: "south", lat: 23.4518, lon: 120.2555 },
  { county: "嘉義市", region: "south", lat: 23.4801, lon: 120.4491 },
  { county: "臺南市", region: "south", lat: 22.9999, lon: 120.2269 },
  { county: "高雄市", region: "south", lat: 22.6273, lon: 120.3014 },
  { county: "屏東縣", region: "south", lat: 22.5519, lon: 120.5487 },
  { county: "宜蘭縣", region: "east", lat: 24.7021, lon: 121.7378 },
  { county: "花蓮縣", region: "east", lat: 23.9872, lon: 121.6015 },
  { county: "臺東縣", region: "east", lat: 22.7972, lon: 121.0714 },
  { county: "澎湖縣", region: "islands", lat: 23.5711, lon: 119.5793 },
  { county: "金門縣", region: "islands", lat: 24.4368, lon: 118.3186 },
  { county: "連江縣", region: "islands", lat: 26.1602, lon: 119.9517 },
] satisfies Array<Omit<CountyMeta, "regionLabel">>;

export const counties: CountyMeta[] = countyRows.map((county) => ({
  ...county,
  regionLabel: regionLabels[county.region],
}));

export const countyNameAliases = new Map<string, string>(
  counties.flatMap(({ county }) => [
    [county, county],
    [county.replace("臺", "台"), county],
  ]),
);

export const normalizeCountyName = (value?: string): string | undefined => {
  if (!value) return undefined;
  const compact = value.trim().replace(/\s/g, "");
  return countyNameAliases.get(compact) ?? countyNameAliases.get(compact.slice(0, 3));
};

export const getCountyMeta = (county: string): CountyMeta | undefined =>
  counties.find((item) => item.county === county);
