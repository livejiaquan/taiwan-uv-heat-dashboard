import { mkdir, rename, writeFile } from "node:fs/promises";
import { collectWeatherSnapshot } from "../src/lib/collection";

try {
  console.log(process.env.CWA_API_KEY ? "Collecting from CWA authenticated API." : "Collecting official public CWA files (no private key required).");
  const snapshot = await collectWeatherSnapshot(process.env.CWA_API_KEY);
  await mkdir("public/data", { recursive: true });
  await writeFile("public/data/weather.json.tmp", JSON.stringify(snapshot));
  await rename("public/data/weather.json.tmp", "public/data/weather.json");
  console.log(`Weather snapshot collected: ${snapshot.observations.length} stations, ${snapshot.forecasts.length} counties.`);
} catch {
  // Do not log upstream exceptions: they can contain credential-bearing URLs.
  console.error("Weather collection failed validation. Existing deployment is preserved.");
  process.exitCode = 1;
}
