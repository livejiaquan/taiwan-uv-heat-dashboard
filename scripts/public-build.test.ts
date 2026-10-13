import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { assertPublicArtifacts, assertPublicBuildEnv } from "./public-artifacts.mjs";

const dirs: string[] = [];
afterEach(async () => { await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))); });

describe("public build safety", () => {
  it("rejects credential-bearing build environments", () => {
    expect(() => assertPublicBuildEnv({ VITE_CWA_API_KEY: "private" })).toThrow();
    expect(() => assertPublicBuildEnv({ CWA_API_KEY: "private" })).toThrow();
    expect(() => assertPublicBuildEnv({})).not.toThrow();
  });

  it("scans nested built assets and refuses credential-shaped data", async () => {
    const dir = await mkdtemp(join(tmpdir(), "uv-public-test-")); dirs.push(dir);
    await mkdir(join(dir, "data"));
    await writeFile(join(dir, "data", "weather.json"), '{"schemaVersion":1}');
    await expect(assertPublicArtifacts(dir)).resolves.toBeUndefined();
    await writeFile(join(dir, "data", "weather.json"), 'CWA-11111111-2222-3333-4444-555555555555');
    await expect(assertPublicArtifacts(dir)).rejects.toThrow();
  });
});
