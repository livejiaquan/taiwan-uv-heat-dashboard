import { spawnSync } from "node:child_process";
import { assertPublicArtifacts, assertPublicBuildEnv } from "./public-artifacts.mjs";

assertPublicBuildEnv(process.env);
const result = spawnSync("npm", ["run", "build"], { stdio: "inherit", shell: process.platform === "win32" });
if (result.status !== 0) process.exit(result.status ?? 1);
await assertPublicArtifacts("dist");
console.log("Public artifacts checked: no credential markers or direct CWA API calls.");
