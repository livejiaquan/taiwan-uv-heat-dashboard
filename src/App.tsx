import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Flame,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  ThermometerSun,
  Waves,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "./components/EmptyState";
import { LoadingState } from "./components/LoadingState";
import { RiskPill } from "./components/RiskPill";
import { StatCard } from "./components/StatCard";
import { formatInteger, formatNumber, formatRelativeAge, formatTime } from "./lib/format";
import { loadDashboardData } from "./lib/cwa";
import type { CountyRisk, DashboardData, RegionKey, RiskTone } from "./lib/types";

type LoadStatus = "loading" | "ready" | "error";
type SortKey = "danger" | "uv" | "heat" | "safe";

const regionOptions: Array<{ key: RegionKey | "all"; label: string }> = [
  { key: "all", label: "全部" },
  { key: "north", label: "北部" },
  { key: "central", label: "中部" },
  { key: "south", label: "南部" },
  { key: "east", label: "東部" },
  { key: "islands", label: "外島" },
];

const sortOptions: Array<{ key: SortKey; label: string }> = [
  { key: "danger", label: "危險優先" },
  { key: "uv", label: "UV 最高" },
  { key: "heat", label: "熱風險最高" },
  { key: "safe", label: "較安全" },
];

const toneStyles: Record<RiskTone, string> = {
  low: "from-emerald-500 to-reef-500",
  moderate: "from-sun-300 to-sun-500",
  high: "from-orange-400 to-orange-600",
  "very-high": "from-heat-500 to-orange-600",
  extreme: "from-fuchsia-600 to-heat-700",
};

const apiKey = import.meta.env.VITE_CWA_API_KEY as string | undefined;

function App() {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<string>("臺北市");
  const [region, setRegion] = useState<RegionKey | "all">("all");
  const [sort, setSort] = useState<SortKey>("danger");
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const nextData = await loadDashboardData(apiKey);
      setData(nextData);
      setSelectedCounty((current) =>
        nextData.counties.some((item) => item.county === current)
          ? current
          : nextData.counties[0]?.county ?? "臺北市",
      );
      setStatus("ready");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
      setStatus("error");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        const nextData = await loadDashboardData(apiKey);
        if (cancelled) return;
        setData(nextData);
        setSelectedCounty(nextData.counties[0]?.county ?? "臺北市");
        setStatus("ready");
      } catch (nextError) {
        if (cancelled) return;
        setError(nextError instanceof Error ? nextError.message : String(nextError));
        setStatus("error");
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    };

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(
    () =>
      data?.counties.find((item) => item.county === selectedCounty) ??
      data?.counties[0],
    [data, selectedCounty],
  );

  const visibleCounties = useMemo(() => {
    const source =
      region === "all"
        ? data?.counties ?? []
        : (data?.counties ?? []).filter((item) => item.region === region);

    return [...source].sort((a, b) => {
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
  }, [data, region, sort]);

  if (status === "loading") return <LoadingState />;

  if (status === "error" || !data) {
    return (
      <main className="grid min-h-screen place-items-center bg-sun-field px-4">
        <section className="max-w-lg rounded-2xl border border-heat-100 bg-white p-8 text-center shadow-card">
          <AlertTriangle className="mx-auto h-10 w-10 text-heat-700" />
          <h1 className="mt-4 text-2xl font-black text-ink-900">資料載入失敗</h1>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            {error ?? "目前無法建立儀表板資料。"}
          </p>
          <button className="btn-primary mt-6" onClick={() => void refresh()}>
            <RefreshCw className="h-4 w-4" />
            重新整理
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-sun-field text-ink-900">
      <Hero
        data={data}
        refreshing={refreshing}
        onRefresh={() => void refresh()}
      />

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

        <section className="mt-8 rounded-2xl border border-white/75 bg-white/80 p-4 shadow-card backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold text-sun-600">County Risk Cards</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-ink-900">
                縣市 UV / 高溫風險
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
                以縣市彙整測站資料，排序和區域篩選可快速找出最危險與相對安全的戶外活動地點。
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:min-w-[520px]">
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
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

function Hero({
  data,
  refreshing,
  onRefresh,
}: {
  data: DashboardData;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const updateTone = data.stats.stale ? "text-heat-700" : "text-reef-700";

  return (
    <header className="relative overflow-hidden pb-12 pt-8 sm:pt-10">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(245,158,11,0.20),rgba(20,184,166,0.15)_45%,rgba(239,68,68,0.13))]" />
      <div className="sun-rays absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1 text-sm font-bold text-sun-600 shadow-sm backdrop-blur">
              <Sun className="h-4 w-4" aria-hidden="true" />
              Taiwan CWA Open Data
            </div>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-ink-900 sm:text-5xl">
              台灣 UV 與高溫風險儀表板
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink-700">
              快速判斷現在出門的紫外線、悶熱與熱傷害風險，並找出最需要避開或較適合戶外活動的縣市。
            </p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-card backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-500">
                  Latest Update
                </p>
                <p className={`mt-1 text-lg font-black ${updateTone}`}>
                  {formatTime(data.stats.latestUpdate)}
                </p>
                <p className="mt-1 text-xs font-semibold text-ink-500">
                  {formatRelativeAge(data.stats.latestUpdate)} · {data.stats.sourceSummary}
                </p>
              </div>
              <button
                className="icon-button"
                onClick={onRefresh}
                disabled={refreshing}
                title="重新整理資料"
                aria-label="重新整理資料"
              >
                <RefreshCw
                  className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatusNotice({ data }: { data: DashboardData }) {
  if (!data.stats.errors.length && !data.stats.stale && data.stats.dataMode === "live") {
    return (
      <div className="rounded-2xl border border-reef-100 bg-white/80 p-4 text-sm font-semibold text-reef-700 shadow-card backdrop-blur">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          CWA 即時資料已載入，資料新鮮度正常。
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-sun-300 bg-white/85 p-4 shadow-card backdrop-blur">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-sun-600" />
        <div className="text-sm leading-6 text-ink-700">
          <p className="font-black text-ink-900">
            {data.stats.dataMode === "demo" ? "目前顯示示範資料" : "資料狀態需要留意"}
          </p>
          <p>
            {data.stats.stale
              ? "最新觀測時間已超過 45 分鐘，請以中央氣象署正式發布為準。"
              : "部分 CWA 來源可能未回應，介面已保留可用欄位並標示資料來源。"}
          </p>
          {data.stats.errors.length ? (
            <ul className="mt-2 grid gap-1 text-xs text-ink-500">
              {data.stats.errors.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StatsGrid({ data }: { data: DashboardData }) {
  const highestHeat = data.stats.highestHeat
    ? Math.max(
        data.stats.highestHeat.heatIndex ?? -Infinity,
        data.stats.highestHeat.forecastMaxTemperature ?? -Infinity,
      )
    : undefined;

  return (
    <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={Sun}
        tone="sun"
        label="最高 UV"
        value={formatInteger(data.stats.highestUv?.uvIndex)}
        caption={data.stats.highestUv ? `${data.stats.highestUv.county} 曝曬最強` : "暫無 UV 資料"}
      />
      <StatCard
        icon={ThermometerSun}
        tone="heat"
        label="最高熱指數"
        value={formatNumber(highestHeat)}
        unit="°C"
        caption={data.stats.highestHeat ? `${data.stats.highestHeat.county} 體感最熱` : "暫無熱風險資料"}
      />
      <StatCard
        icon={AlertTriangle}
        tone="ink"
        label="高風險縣市"
        value={String(data.stats.dangerousCounties)}
        unit={`/ ${data.stats.totalCounties}`}
        caption="達非常高或極端風險"
      />
      <StatCard
        icon={ShieldCheck}
        tone="reef"
        label="相對安全"
        value={data.stats.safest?.county ?? "--"}
        caption={data.stats.safest ? `${data.stats.safest.overallLevel.label}` : "需要更多資料"}
      />
    </section>
  );
}

function RankingPanel({
  counties,
  selectedCounty,
  onSelect,
}: {
  counties: CountyRisk[];
  selectedCounty?: string;
  onSelect: (county: string) => void;
}) {
  const max = Math.max(...counties.map((item) => item.overallScore), 1);

  return (
    <section className="rounded-2xl border border-white/75 bg-white/80 p-5 shadow-card backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-heat-700">Risk Ranking</p>
          <h2 className="mt-1 text-2xl font-black text-ink-900">目前最需要避開的區域</h2>
        </div>
        <Flame className="h-8 w-8 text-heat-700" aria-hidden="true" />
      </div>
      <div className="mt-5 grid gap-3">
        {counties.map((county, index) => (
          <button
            key={county.county}
            className={`ranking-row ${county.county === selectedCounty ? "is-active" : ""}`}
            onClick={() => onSelect(county.county)}
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink-900 text-sm font-black text-white">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="flex items-center gap-2">
                <strong className="text-base text-ink-900">{county.county}</strong>
                <RiskPill level={county.overallLevel} label={county.overallLevel.shortLabel} />
              </span>
              <span className="mt-2 block h-2 overflow-hidden rounded-full bg-ink-100">
                <span
                  className={`block h-full rounded-full bg-gradient-to-r ${toneStyles[county.overallLevel.tone]}`}
                  style={{ width: `${Math.max(8, (county.overallScore / max) * 100)}%` }}
                />
              </span>
            </span>
            <span className="text-right text-sm font-bold text-ink-500">
              UV {formatInteger(county.uvIndex)}
              <br />
              {formatNumber(Math.max(county.heatIndex ?? -1, county.forecastMaxTemperature ?? -1))}
              °C
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function DetailPanel({ county }: { county: CountyRisk }) {
  return (
    <section className="rounded-2xl border border-white/75 bg-white/85 p-5 shadow-card backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1 text-sm font-bold text-reef-700">
            <MapPin className="h-4 w-4" />
            {county.regionLabel}
          </p>
          <h2 className="mt-1 text-3xl font-black text-ink-900">{county.county}</h2>
        </div>
        <RiskPill level={county.overallLevel} />
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-white bg-gradient-to-br from-sun-100 via-white to-reef-100 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricBlock
            icon={Sun}
            label="紫外線指數"
            value={formatInteger(county.uvIndex)}
            unit={county.uvSource === "dailyMax" ? "日最大" : "目前"}
            level={county.uvLevel.label}
          />
          <MetricBlock
            icon={ThermometerSun}
            label="熱指數 / 高溫"
            value={formatNumber(
              Math.max(
                county.heatIndex ?? -Infinity,
                county.forecastMaxTemperature ?? -Infinity,
                county.observedTemperature ?? -Infinity,
              ),
            )}
            unit="°C"
            level={county.heatLevel.label}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <DetailItem label="觀測溫度" value={`${formatNumber(county.observedTemperature)} °C`} />
        <DetailItem label="相對濕度" value={`${formatInteger(county.humidity)} %`} />
        <DetailItem label="36小時最高溫" value={`${formatNumber(county.forecastMaxTemperature)} °C`} />
        <DetailItem label="測站數" value={`${county.stationCount} 站`} />
      </div>

      <div className="mt-5 rounded-xl border border-ink-100 bg-white/70 p-4">
        <p className="text-sm font-black text-ink-900">戶外活動建議</p>
        <div className="mt-3 grid gap-3">
          {county.advice.map((item) => (
            <div key={item.title} className="flex gap-3">
              <span
                className={`mt-1 h-2.5 w-2.5 flex-none rounded-full bg-gradient-to-br ${toneStyles[item.tone]}`}
              />
              <div>
                <p className="text-sm font-black text-ink-900">{item.title}</p>
                <p className="text-sm leading-6 text-ink-500">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs font-semibold text-ink-500">
        更新：{formatTime(county.observedAt)} · {county.forecastWeather ?? "天氣描述暫缺"}
      </p>
    </section>
  );
}

function MetricBlock({
  icon: Icon,
  label,
  value,
  unit,
  level,
}: {
  icon: typeof Sun;
  label: string;
  value: string;
  unit: string;
  level: string;
}) {
  return (
    <div className="rounded-xl bg-white/80 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-bold text-ink-500">
        <Icon className="h-4 w-4 text-sun-600" />
        {label}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <strong className="text-4xl font-black leading-none text-ink-900">{value}</strong>
        <span className="pb-1 text-sm font-black text-ink-500">{unit}</span>
      </div>
      <p className="mt-2 text-sm font-bold text-heat-700">{level}</p>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white/70 p-3">
      <p className="text-xs font-bold text-ink-500">{label}</p>
      <p className="mt-1 text-lg font-black text-ink-900">{value}</p>
    </div>
  );
}

function CountyCard({
  county,
  active,
  onSelect,
}: {
  county: CountyRisk;
  active: boolean;
  onSelect: () => void;
}) {
  const heatValue = Math.max(
    county.heatIndex ?? -Infinity,
    county.forecastMaxTemperature ?? -Infinity,
    county.observedTemperature ?? -Infinity,
  );

  return (
    <button
      className={`county-card ${active ? "is-active" : ""}`}
      onClick={onSelect}
      aria-pressed={active}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="text-left">
          <span className="text-xs font-bold text-ink-500">{county.regionLabel}</span>
          <strong className="mt-1 block text-xl font-black text-ink-900">
            {county.county}
          </strong>
        </span>
        <RiskPill level={county.overallLevel} label={county.overallLevel.shortLabel} />
      </span>

      <span className="mt-4 grid grid-cols-2 gap-3">
        <span className="mini-metric">
          <Sun className="h-4 w-4 text-sun-600" />
          <span>
            <span className="block text-xs font-bold text-ink-500">UV</span>
            <span className="text-lg font-black text-ink-900">{formatInteger(county.uvIndex)}</span>
          </span>
        </span>
        <span className="mini-metric">
          <ThermometerSun className="h-4 w-4 text-heat-700" />
          <span>
            <span className="block text-xs font-bold text-ink-500">熱指數</span>
            <span className="text-lg font-black text-ink-900">{formatNumber(heatValue)}°</span>
          </span>
        </span>
      </span>

      <span className="mt-4 block h-2 overflow-hidden rounded-full bg-ink-100">
        <span
          className={`block h-full rounded-full bg-gradient-to-r ${toneStyles[county.overallLevel.tone]}`}
          style={{ width: `${Math.min(100, Math.max(10, county.overallScore / 1.8))}%` }}
        />
      </span>
      <span className="mt-3 flex items-center justify-between text-xs font-semibold text-ink-500">
        <span>{county.stationCount ? `${county.stationCount} 測站` : "測站暫缺"}</span>
        <span>{formatRelativeAge(county.observedAt)}</span>
      </span>
    </button>
  );
}

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ key: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold text-ink-500">{label}</p>
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-ink-100 bg-ink-100/70 p-1">
        {options.map((option) => (
          <button
            key={option.key}
            className={`segment-button ${value === option.key ? "is-active" : ""}`}
            onClick={() => onChange(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function AdviceSection({
  counties,
  selected,
}: {
  counties: CountyRisk[];
  selected?: CountyRisk;
}) {
  const safest = [...counties].sort((a, b) => a.overallScore - b.overallScore).slice(0, 3);
  const danger = counties.slice(0, 3);

  return (
    <section className="mt-8 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-2xl border border-white/75 bg-white/80 p-5 shadow-card backdrop-blur">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-reef-700" />
          <h2 className="text-2xl font-black text-ink-900">相對安全排行</h2>
        </div>
        <div className="mt-4 grid gap-3">
          {safest.map((county) => (
            <div key={county.county} className="flex items-center justify-between rounded-xl border border-reef-100 bg-reef-50/60 p-3">
              <span>
                <strong className="block text-ink-900">{county.county}</strong>
                <span className="text-xs font-semibold text-ink-500">
                  UV {formatInteger(county.uvIndex)} · {county.heatLevel.label}
                </span>
              </span>
              <ArrowDown className="h-5 w-5 text-reef-700" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/75 bg-white/80 p-5 shadow-card backdrop-blur">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-heat-700" />
          <h2 className="text-2xl font-black text-ink-900">今日提醒</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {danger.map((county) => (
            <div key={county.county} className="rounded-xl border border-heat-100 bg-heat-50/50 p-3">
              <div className="flex items-center justify-between">
                <strong className="text-ink-900">{county.county}</strong>
                <ArrowUp className="h-4 w-4 text-heat-700" />
              </div>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                {county.advice[0]?.body}
              </p>
            </div>
          ))}
        </div>
        {selected ? (
          <div className="mt-4 rounded-xl border border-sun-300 bg-sun-50/80 p-3 text-sm leading-6 text-ink-700">
            <strong className="text-ink-900">{selected.county}：</strong>
            {selected.advice.map((item) => item.title).join("、")}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-8 rounded-2xl border border-white/75 bg-ink-900 p-5 text-white shadow-card">
      <div className="grid gap-5 md:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="flex items-center gap-2">
            <Waves className="h-5 w-5 text-reef-100" />
            <h2 className="text-lg font-black">台灣 UV 與高溫風險儀表板</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
            資料來源以交通部中央氣象署開放資料為主。本專案非官方服務，風險提示供戶外活動規劃參考，正式警特報與健康指引請以主管機關公告為準。
          </p>
        </div>
        <div className="grid gap-2 text-sm font-semibold text-white/75">
          <a href="https://opendata.cwa.gov.tw/" target="_blank" rel="noreferrer">
            中央氣象署開放資料平臺
          </a>
          <a href="https://www.cwa.gov.tw/" target="_blank" rel="noreferrer">
            中央氣象署
          </a>
          <a href="https://data.gov.tw/" target="_blank" rel="noreferrer">
            政府資料開放平臺
          </a>
        </div>
      </div>
    </footer>
  );
}

export default App;
