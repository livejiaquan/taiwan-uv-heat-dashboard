import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_PUBLIC_BASE_PATH,
  expectedAssetPrefix,
  resolvePublicBasePath,
} from "./public-build-config.mjs";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

test("uses a project-site path by default", () => {
  assert.equal(resolvePublicBasePath(undefined), DEFAULT_PUBLIC_BASE_PATH);
  assert.equal(
    expectedAssetPrefix(DEFAULT_PUBLIC_BASE_PATH),
    "/taiwan-uv-heat-dashboard/assets/",
  );
});

test("accepts a root custom-domain path", () => {
  assert.equal(resolvePublicBasePath("/"), "/");
  assert.equal(expectedAssetPrefix("/"), "/assets/");
});

test("rejects ambiguous or unsafe public base paths", () => {
  for (const value of [
    "",
    "project/",
    "/project",
    "https://example.com/project/",
    "/project/?q=1",
    "/project/#fragment",
    "/project/../",
    "/./",
    "//",
  ]) {
    assert.throws(() => resolvePublicBasePath(value), /PUBLIC_BASE_PATH/);
  }
});

test("rejects a client credential without logging it", () => {
  const secret = "CWA-DO-NOT-LOG-TEST-KEY";
  const result = spawnSync(process.execPath, ["scripts/build-public.mjs"], {
    cwd: projectRoot,
    encoding: "utf8",
    env: { ...process.env, VITE_CWA_API_KEY: secret },
  });
  const output = `${result.stdout}${result.stderr}`;

  assert.equal(result.status, 1);
  assert.match(output, /VITE_CWA_API_KEY must be empty/);
  assert.doesNotMatch(output, new RegExp(secret));
});

test("rejects an invalid public base before starting a build", () => {
  const result = spawnSync(process.execPath, ["scripts/build-public.mjs"], {
    cwd: projectRoot,
    encoding: "utf8",
    env: { ...process.env, PUBLIC_BASE_PATH: "https://example.com/project/" },
  });
  const output = `${result.stdout}${result.stderr}`;

  assert.equal(result.status, 1);
  assert.match(output, /PUBLIC_BASE_PATH must be an absolute path/);
  assert.doesNotMatch(output, /building client environment/);
});
