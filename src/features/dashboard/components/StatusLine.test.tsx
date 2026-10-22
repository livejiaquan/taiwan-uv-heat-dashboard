import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { counties } from "../../../data/counties";
import { summarizeDay } from "../../../lib/outlook";
import type { DashboardData } from "../../../lib/types";
import { StatusLine } from "./StatusLine";

const day = summarizeDay({ date: "2026-10-13", hours: Array.from({ length: 24 }, () => ({ observed: false })) });
const county = { ...counties[0], stationCount: 0, days: [day, day] as [typeof day, typeof day] };
const data = (generatedAt: string): DashboardData => ({ mode: "live", counties: [county], generatedAt, stale: false, issues: [] });
const now = Date.parse("2026-10-13T12:00:00+08:00");
const render = (generatedAt: string) =>
  renderToStaticMarkup(<StatusLine data={data(generatedAt)} county={county} now={now} refreshing={false} onRefresh={() => {}} />);

describe("data freshness", () => {
  it("shows a recent snapshot as current with its validity window", () => {
    const html = render("2026-10-13T11:40:00+08:00");
    expect(html).toContain("資料最新");
    expect(html).toContain("有效至 13:40");
  });

  it("warns once the scheduled update is late", () => {
    const html = render("2026-10-13T11:00:00+08:00");
    expect(html).toContain("更新延遲");
    expect(html).toContain("停止顯示數值");
  });
});
