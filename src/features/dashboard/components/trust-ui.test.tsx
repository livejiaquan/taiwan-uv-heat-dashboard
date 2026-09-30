import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildDashboardData } from "../../../lib/cwa";
import { AdviceSection } from "./AdviceSection";
import { CountyCard } from "./CountyCard";
import { DetailPanel } from "./DetailPanel";
import { Hero } from "./Hero";
import { RankingPanel } from "./RankingPanel";
import { StatsGrid } from "./StatsGrid";
import { StatusNotice } from "./StatusNotice";

const NOW = Date.parse("2026-09-30T12:00:00+08:00");
const noop = () => {};
const demo = buildDashboardData("demo", [], undefined, NOW);

describe("trust copy in rendered components (not browser visual QA)", () => {
  it("labels the demo prominently instead of displaying a fresh timestamp", () => {
    const html = renderToStaticMarkup(<><Hero data={demo} refreshing={false} onRefresh={noop} /><StatusNotice data={demo} /></>);
    expect(html).toContain("DEMO · 非即時資料");
    expect(html).toContain("人工範例，非即時官方資料");
    expect(html).toContain("示範資料・無觀測時間");
    expect(html).not.toContain("分鐘前");
    expect(html).not.toContain("Taiwan CWA Open Data");
    expect(html).toContain('href="https://www.cwa.gov.tw/"');
  });
  it("keeps demo labels and warnings in cards, detail, ranking, and recommendations", () => {
    const county = demo.counties[0];
    const html = renderToStaticMarkup(<>
      <CountyCard county={county} active={false} onSelect={noop} />
      <DetailPanel county={county} />
      <StatsGrid data={demo} />
      <RankingPanel counties={demo.counties.slice(0, 3)} demo onSelect={noop} />
      <AdviceSection counties={demo.counties} selected={county} />
    </>);
    expect(html).toContain("範例最高 UV");
    expect(html).toContain("示範風險排行");
    expect(html).toContain("示範模式不提供低風險推薦");
    expect(html).toContain("示範情境，請勿據此安排外出");
    expect(html).not.toContain("相對安全");
    expect(html).not.toContain("今日提醒");
    expect(html).not.toContain("分鐘前");
  });
  it("uses an empty state instead of recommending missing counties", () => {
    const empty = buildDashboardData("live", [], {}, NOW);
    const html = renderToStaticMarkup(<><StatusNotice data={empty} /><StatsGrid data={empty} /><AdviceSection counties={empty.counties} /></>);
    expect(html).toContain("0 / 22 縣市");
    expect(html).toContain("目前沒有符合條件的縣市");
    expect(html).not.toContain("資料新鮮度正常");
    expect(html).not.toContain("相對安全");
  });
  it("never suggests light activity from low UV with missing heat", () => {
    const partial = buildDashboardData("live", [], { observations: { records: { Station: [{
      GeoInfo: { CountyName: "臺北市" },
      ObsTime: { DateTime: "2026-09-30T11:50:00+08:00" },
      WeatherElement: { UVIndex: 1 },
    }] } } }, NOW);
    const county = partial.counties.find((item) => item.county === "臺北市")!;
    const html = renderToStaticMarkup(<DetailPanel county={county} />);
    expect(html).toContain("無法確認目前風險");
    expect(html).not.toContain("適合輕量活動");
    expect(html).not.toContain("戶外條件較穩定");
  });
});
