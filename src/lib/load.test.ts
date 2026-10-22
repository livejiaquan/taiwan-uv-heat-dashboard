import { afterEach, describe, expect, it, vi } from "vitest";
import { loadDashboardData } from "./load";

describe("loadDashboardData", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reports a malformed snapshot in plain words instead of a parser error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<!doctype html>", { status: 200 })));
    await expect(loadDashboardData()).rejects.toThrow("氣象資料快照格式錯誤");
  });
});
