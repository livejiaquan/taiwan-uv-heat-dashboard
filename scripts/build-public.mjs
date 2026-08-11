import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { expectedAssetPrefix, resolvePublicBasePath } from "./public-build-config.mjs";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const distRoot = join(projectRoot, "dist");

const fail = (message) => {
  console.error(`Public build guard failed: ${message}`);
  process.exit(1);
};

if (process.env.VITE_CWA_API_KEY?.trim()) {
  fail("VITE_CWA_API_KEY must be empty; public Pages cannot ship a client credential.");
}

let publicBasePath;
try {
  publicBasePath = resolvePublicBasePath(process.env.PUBLIC_BASE_PATH);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const build = spawnSync(npmCommand, ["run", "build"], {
  cwd: projectRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    VITE_BASE_PATH: publicBasePath,
    VITE_CWA_API_KEY: "",
  },
});

if (build.error) fail(build.error.message);
if (build.status !== 0) process.exit(build.status ?? 1);

if (!existsSync(distRoot)) fail("dist/ was not created.");

const collectFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(path) : [path];
  });

const files = collectFiles(distRoot);
const textExtensions = new Set([".css", ".html", ".js", ".json", ".map"]);
const textFiles = files.filter((file) => textExtensions.has(extname(file)));
const forbiddenMarkers = [
  ["DEMO-", "legacy demo station identifiers"],
  ["demoData", "legacy demo data module"],
  ["demoObservations", "legacy demo observations export"],
  ["demoForecasts", "legacy demo forecasts export"],
  ["正在顯示示範資料", "affirmative demo-data copy"],
  ["已切換為示範資料", "affirmative demo-data copy"],
  ["示範資料", "demo-data copy"],
  ["sample-ranking", "legacy sample ranking marker"],
  ["O-A0005-001", "daily-maximum UV dataset in the current-data bundle"],
];
const forbiddenCredentialPatterns = [
  [/CW[AB]-[A-Z0-9]{8}(?:-[A-Z0-9]{4}){3}-[A-Z0-9]{12}/, "CWA/CWB credential-shaped token"],
  [/your-cwa-(?:authorization-)?key/i, "CWA credential placeholder"],
  [/replace[-_ ]with[-_ ]cwa[-_ ]key/i, "CWA credential placeholder"],
];

const hits = [];
for (const file of textFiles) {
  const content = readFileSync(file, "utf8");
  for (const [marker, description] of forbiddenMarkers) {
    if (content.includes(marker)) {
      hits.push(`${description} (${relative(projectRoot, file)})`);
    }
  }
  for (const [pattern, description] of forbiddenCredentialPatterns) {
    if (pattern.test(content)) {
      hits.push(`${description} (${relative(projectRoot, file)})`);
    }
  }
}

if (hits.length > 0) {
  fail(`forbidden legacy content detected: ${hits.join(", ")}`);
}

const indexPath = join(distRoot, "index.html");
if (!existsSync(indexPath)) fail("dist/index.html is missing.");

const indexHtml = readFileSync(indexPath, "utf8");
const assetPrefix = expectedAssetPrefix(publicBasePath);
if (indexHtml.includes("/src/main.tsx") || !indexHtml.includes(assetPrefix)) {
  fail(`dist/index.html does not reference compiled assets under ${publicBasePath}.`);
}

console.log(
  `Public build guard passed: ${files.length} artifact files, base ${publicBasePath}, no client key, no legacy demo markers.`,
);
