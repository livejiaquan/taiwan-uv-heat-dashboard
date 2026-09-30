import { afterEach, describe, expect, it, vi } from "vitest";
import { formatRelativeAge, formatTime } from "./format";

describe("source time display", () => {
  afterEach(() => vi.useRealTimers());
  it("does not fabricate midnight for a daily source date", () => {
    expect(formatTime("2026-09-30")).toBe("09/30");
  });
  it("displays observation time in Taiwan time regardless of client timezone", () => {
    expect(formatTime("2026-09-30T04:15:00Z")).toContain("12:15");
    expect(formatTime("2026-09-30 12:15:00")).toContain("12:15");
  });
  it("handles invalid and future timestamps without false recency", () => {
    vi.useFakeTimers();
    vi.setSystemTime("2026-09-30T04:00:00Z");
    expect(formatTime("invalid")).toBe("時間不明");
    expect(formatRelativeAge("invalid")).toBe("時間待確認");
    expect(formatRelativeAge("2099-01-01T00:00:00Z")).toBe("時間待確認");
    expect(formatRelativeAge("2026-09-30 11:50:00")).toBe("10 分鐘前");
  });
});
