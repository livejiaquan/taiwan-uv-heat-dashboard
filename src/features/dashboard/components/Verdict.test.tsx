import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { counties } from "../../../data/counties";
import { summarizeDay } from "../../../lib/outlook";
import { Verdict } from "./Verdict";

describe("partial-data rendering", () => {
  it("does not describe tomorrow's selected hour as now", () => {
    const day = summarizeDay({ date: "2026-10-14", hours: Array.from({ length: 24 }, () => ({ observed: false, uv: 10, apparent: 35 })) });
    const html = renderToStaticMarkup(<Verdict county={{ ...counties[0], stationCount: 0, days: [day, day] }} day={day} hour={10} dayIndex={1} dayWord="明天" isNow={false} skin={1} demo sectionRef={createRef()} titleRef={createRef()} onSkin={() => {}} onDay={() => {}} />);
    expect(html).toContain("明天 10 時");
    expect(html).not.toContain("現在不建議");
    expect(html).toContain("這個時段不建議");
  });

  it("does not tell the reader no preparation is needed when most hours are missing", () => {
    const day = summarizeDay({ date: "2026-10-13", hours: Array.from({ length: 24 }, (_, hour) => ({ observed: false, ...(hour === 10 ? { apparent: 25 } : {}) })) });
    const html = renderToStaticMarkup(<Verdict county={{ ...counties[0], stationCount: 1, days: [day, day] }} day={day} hour={10} dayIndex={0} dayWord="今天" isNow skin={1} demo={false} sectionRef={createRef()} titleRef={createRef()} onSkin={() => {}} onDay={() => {}} />);
    expect(html).not.toContain("不需要特別準備");
    expect(html).toContain("清單");
    expect(html).toContain("資料不足");
    expect(html).toContain("已知最高");
  });

  it("shows the actual temperature station when apparent temperature is a forecast", () => {
    const day = summarizeDay({ date: "2026-10-13", hours: Array.from({ length: 24 }, () => ({ observed: false, uv: 1, apparent: 25, temperature: 33, apparentOrigin: { kind: "forecast" as const }, temperatureOrigin: { kind: "observation" as const, stationName: "氣溫實測站", observedAt: "2026-10-13T10:00:00+08:00" } })) });
    const html = renderToStaticMarkup(<Verdict county={{ ...counties[0], stationCount: 1, days: [day, day] }} day={day} hour={10} dayIndex={0} dayWord="今天" isNow skin={1} demo={false} sectionRef={createRef()} titleRef={createRef()} onSkin={() => {}} onDay={() => {}} />);
    expect(html).toContain("氣溫實測站");
    expect(html).toContain("10/13 10:00");
    expect(html).toContain("氣象署預報");
  });
});
