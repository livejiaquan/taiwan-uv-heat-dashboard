import { AlertTriangle, Info, Sun, ThermometerSun } from "lucide-react";
import { StatCard } from "../../../components/StatCard";
import { formatInteger, formatNumber } from "../../../lib/format";
import type { DashboardData } from "../../../lib/types";

export function StatsGrid({ data }: { data: DashboardData }) {
  const demo = data.stats.dataMode === "demo";
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
        label={demo ? "範例最高 UV" : "最高可用 UV"}
        value={formatInteger(data.stats.highestUv?.uvIndex)}
        caption={data.stats.highestUv ? `${data.stats.highestUv.county} · ${demo ? "人工範例" : data.stats.highestUv.uvSource === "dailyMax" ? "當日日最大值（非即時）" : "45 分鐘內觀測"}` : "暫無 UV 資料"}
      />
      <StatCard
        icon={ThermometerSun}
        tone="heat"
        label={demo ? "範例熱指標最高值" : "熱指數 / 預報最高值"}
        value={formatNumber(highestHeat)}
        unit="°C"
        caption={data.stats.highestHeat ? `${data.stats.highestHeat.county} 熱指標最高` : "暫無熱風險資料"}
      />
      <StatCard
        icon={AlertTriangle}
        tone="ink"
        label={demo ? "範例高風險縣市" : "已知高風險縣市"}
        value={String(data.stats.dangerousCounties)}
        unit={`/ ${data.stats.totalCounties}`}
        caption={
          data.stats.missingDataCount
            ? `非常高/極端；${data.stats.missingDataCount} 縣市資料不足`
            : "達非常高或極端風險"
        }
      />
      <StatCard
        icon={Info}
        tone="ink"
        label="低風險縣市"
        value={data.stats.lowestRisk?.county ?? "--"}
        caption={data.stats.lowestRisk ? `${data.stats.lowestRisk.overallLevel.label}` : demo ? "示範資料不提供外出判斷" : "暫無觀測齊全且兩項皆低的縣市"}
      />
    </section>
  );
}
