import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { counties } from "../../../data/counties";
import { summarizeDay } from "../../../lib/outlook";
import type { DashboardData } from "../../../lib/types";
import { StatusLine } from "./StatusLine";

const day = summarizeDay({ date: "2026-10-13", hours: Array.from({ length: 24 }, () => ({ observed: false })) });
const county = { ...counties[0], stationCount: 0, days: [day, day] as [typeof day, typeof day] };
const now = Date.parse("2026-10-13T12:00:00+08:00");
const render = (minutesAgo: number) => {
  const time = new Date(now - minutesAgo * 60_000).toISOString();
  const data: DashboardData = { mode: "live", counties: [county], generatedAt: time, dataTime: time, stale: false, issues: [] };
  return renderToStaticMarkup(<StatusLine data={data} county={county} now={now} refreshing={false} onRefresh={() => {}} />);
};

describe("data freshness label", () => {
  it("shows recent data with its time only", () => {
    const html = render(30);
    expect(html).toContain("is-live");
    expect(html).toContain("資料時間 11:30 · 30 分鐘前");
    expect(html).not.toContain("本站每 3–4 小時更新一次");
  });

  it("marks data a few hours old without explaining it away", () => {
    const html = render(180);
    expect(html).toContain("is-aging");
    expect(html).toContain("資料時間 09:00 · 3 小時前");
    expect(html).not.toContain("本站每 3–4 小時更新一次");
  });

  it("explains a delayed schedule and points to the official source", () => {
    const html = render(8 * 60);
    expect(html).toContain("is-old");
    expect(html).toContain("GitHub 排程延遲，最後成功更新 04:00");
    expect(html).toContain("本站每 3–4 小時更新一次");
    expect(html).toContain("cwa.gov.tw");
  });

  it("says how old the data is after a day, but still as a label", () => {
    const html = render(30 * 60);
    expect(html).toContain("is-unusable");
    expect(html).toContain("目前顯示的是 1 天前的資料");
    expect(html).not.toMatch(/已過期|非即時|無法判斷/);
  });
});
