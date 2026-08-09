import { useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import type { CountyRisk, DashboardData } from "../../lib/types";
import { AdviceSection } from "./components/AdviceSection";
import { CountyCard } from "./components/CountyCard";
import { DetailPanel } from "./components/DetailPanel";
import { Footer } from "./components/Footer";
import { HealthSafetyNotice } from "./components/HealthSafetyNotice";
import { Hero } from "./components/Hero";
import { RankingPanel } from "./components/RankingPanel";
import { SegmentedControl } from "./components/SegmentedControl";
import { StatsGrid } from "./components/StatsGrid";
import { StatusNotice } from "./components/StatusNotice";
import { TaiwanRiskMap } from "./components/TaiwanRiskMap";
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
        <HealthSafetyNotice />
        <StatsGrid data={data} />

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
          <TaiwanRiskMap
            counties={data.counties}
            onSelect={setSelectedCounty}
            selectedCounty={selected?.county}
          />
          {selected ? <DetailPanel county={selected} /> : null}
        </div>

        <div className="mt-6">
          <RankingPanel
            counties={data.counties.slice(0, 8)}
            onSelect={setSelectedCounty}
            selectedCounty={selected?.county}
          />
        </div>

        <section className="mt-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold text-sun-600">Risk Explorer</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-ink-900">
                縣市觀測與預報
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
                UV 分級只使用具有效時間的測站觀測；氣溫觀測與 36 小時預報分開呈現。
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
    if (sort === "uv") return freshUvValue(b) - freshUvValue(a);
    if (sort === "heat") {
      return freshHeatValue(b) - freshHeatValue(a);
    }
    if (sort === "safe") {
      const safeScoreA = a.priorityScore < 0 ? Number.POSITIVE_INFINITY : a.priorityScore;
      const safeScoreB = b.priorityScore < 0 ? Number.POSITIVE_INFINITY : b.priorityScore;
      return safeScoreA - safeScoreB;
    }
    return b.priorityScore - a.priorityScore;
  });

const freshUvValue = (county: CountyRisk) =>
  county.uvStale ? -1 : county.uvIndex ?? -1;

const freshHeatValue = (county: CountyRisk) => {
  if (county.heatIndex !== undefined && county.heatIndexStale === false) {
    return county.heatIndex;
  }
  if (county.observedTemperature !== undefined && county.temperatureStale === false) {
    return county.observedTemperature;
  }
  return -1;
};
