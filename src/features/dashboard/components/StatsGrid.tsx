import { AlertTriangle, ShieldCheck, Sun, ThermometerSun } from "lucide-react";
import { StatCard } from "../../../components/StatCard";
import { formatInteger, formatNumber } from "../../../lib/format";
import type { DashboardData } from "../../../lib/types";

export function StatsGrid({ data }: { data: DashboardData }) {
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
        caption={
          data.stats.missingDataCount
            ? `非常高/極端；${data.stats.missingDataCount} 縣市資料不足`
            : "達非常高或極端風險"
        }
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
