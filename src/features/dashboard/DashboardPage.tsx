import { useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import type { CountyRisk, DashboardData } from "../../lib/types";
import { AdviceSection } from "./components/AdviceSection";
import { CountyCard } from "./components/CountyCard";
import { DetailPanel } from "./components/DetailPanel";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { RankingPanel } from "./components/RankingPanel";
import { SegmentedControl } from "./components/SegmentedControl";
import { StatsGrid } from "./components/StatsGrid";
import { StatusNotice } from "./components/StatusNotice";
import { regionOptions, sortOptions } from "./constants";
import type { RegionFilter, SortKey } from "./types";

interface DashboardPageProps {
  data: DashboardData;
  refreshing: boolean;
  onRefresh: () => void;
}

export function DashboardPage({ data, refreshing, onRefresh }: DashboardPageProps) {
  const [selectedCounty, setSelectedCounty] = useState<string>(
    data.counties[0]?.county ?? "臺北市",
  );
  const [region, setRegion] = useState<RegionFilter>("all");
  const [sort, setSort] = useState<SortKey>("danger");

  const selected = useMemo(
    () =>
      data.counties.find((item) => item.county === selectedCounty) ??
      data.counties[0],
    [data.counties, selectedCounty],
  );

  const visibleCounties = useMemo(
    () => sortCounties(filterCounties(data.counties, region), sort),
    [data.counties, region, sort],
  );

  return (
    <main className="min-h-screen bg-sun-field text-ink-900">
      <Hero data={data} refreshing={refreshing} onRefresh={onRefresh} />

      <section className="mx-auto -mt-6 max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <StatusNotice data={data} />
        <StatsGrid data={data} />

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <RankingPanel
            counties={data.counties.slice(0, 8)}
            onSelect={setSelectedCounty}
            selectedCounty={selected?.county}
          />
          {selected ? <DetailPanel county={selected} /> : null}
        </div>

        <section className="mt-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold text-sun-600">Risk Explorer</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-ink-900">
                縣市 UV / 高溫風險
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
                用區域和排序快速縮小範圍，卡片保留最需要掃描的風險、UV、熱感與資料更新狀態。
              </p>
            </div>
            <div className="control-toolbar lg:min-w-[620px]">
              <SegmentedControl
                label="區域"
                value={region}
                options={regionOptions}
                onChange={setRegion}
              />
              <SegmentedControl
                label="排序"
                value={sort}
                options={sortOptions}
                onChange={setSort}
              />
            </div>
          </div>

          {visibleCounties.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleCounties.map((county) => (
                <CountyCard
                  key={county.county}
                  county={county}
                  active={county.county === selected?.county}
                  onSelect={() => setSelectedCounty(county.county)}
                />
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="此區域暫無可用資料"
                body="CWA 即時資料可能缺少縣市測站或欄位，請切換區域或重新整理。"
              />
            </div>
          )}
        </section>

        <AdviceSection counties={data.counties} selected={selected} />
        <Footer />
      </section>
    </main>
  );
}

const filterCounties = (counties: CountyRisk[], region: RegionFilter) =>
  region === "all" ? counties : counties.filter((item) => item.region === region);

const sortCounties = (counties: CountyRisk[], sort: SortKey) =>
  [...counties].sort((a, b) => {
    if (sort === "uv") return (b.uvIndex ?? -1) - (a.uvIndex ?? -1);
    if (sort === "heat") {
      return (
        Math.max(b.heatIndex ?? -1, b.forecastMaxTemperature ?? -1) -
        Math.max(a.heatIndex ?? -1, a.forecastMaxTemperature ?? -1)
      );
    }
    if (sort === "safe") return a.overallScore - b.overallScore;
    return b.overallScore - a.overallScore;
  });
