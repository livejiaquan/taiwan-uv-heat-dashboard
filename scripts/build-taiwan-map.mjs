// Builds src/data/taiwan-map.json: county outlines pre-projected to SVG paths,
// with Matsu and Kinmen in inset boxes. County boundaries come from the
// Ministry of the Interior via the taiwan-atlas package (MIT).
//
// Usage:
//   npm install --no-save taiwan-atlas topojson-client topojson-simplify d3-geo
//   node scripts/build-taiwan-map.mjs
import fs from "node:fs";
import { feature } from "topojson-client";
import { presimplify, simplify, quantile } from "topojson-simplify";
import { geoMercator, geoPath, geoCentroid } from "d3-geo";

const topoPath = new URL("../node_modules/taiwan-atlas/counties-10t.json", import.meta.url);
let topo = JSON.parse(fs.readFileSync(topoPath));
topo = presimplify(topo);
topo = simplify(topo, quantile(topo, 0.12));
const fc = feature(topo, topo.objects.counties);

const inBox = (c, [x0, y0, x1, y1]) => c[0] >= x0 && c[0] <= x1 && c[1] >= y0 && c[1] <= y1;
const MAIN = [119.25, 21.85, 122.2, 25.4];
const KINMEN = [118.1, 24.3, 118.6, 24.6];
const MATSU = [119.8, 25.85, 120.6, 26.45];

// split each county into polygons, keep those whose centroid lies in a region box
const parts = { main: [], kinmen: [], matsu: [] };
for (const f of fc.features) {
  const name = f.properties.COUNTYNAME.replace(/^台/, "臺");
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const [key, box] of [["main", MAIN], ["kinmen", KINMEN], ["matsu", MATSU]]) {
    const kept = polys.filter((p) => inBox(geoCentroid({ type: "Polygon", coordinates: p }), box));
    if (key === "main" && (name === "金門縣" || name === "連江縣")) continue; // e.g. Wuqiu islets
    if (kept.length) parts[key].push({ type: "Feature", properties: { name }, geometry: { type: "MultiPolygon", coordinates: kept } });
  }
}
const fit = (features, extent) => {
  const proj = geoMercator().fitExtent(extent, { type: "FeatureCollection", features });
  const path = geoPath(proj).digits(1);
  return features.map((f) => ({ name: f.properties.name, d: path(f), c: path.centroid(f).map((v) => Math.round(v)) }));
};
const W = 520, H = 700;
const out = {
  viewBox: [0, 0, W, H],
  main: fit(parts.main, [[150, 16], [W - 16, H - 16]]),
  matsu: fit(parts.matsu, [[26, 50], [138, 154]]),
  kinmen: fit(parts.kinmen, [[26, 222], [138, 292]]),
};
fs.writeFileSync(new URL("../src/data/taiwan-map.json", import.meta.url), JSON.stringify(out));
console.log(`wrote ${out.main.length + out.matsu.length + out.kinmen.length} county shapes`);
