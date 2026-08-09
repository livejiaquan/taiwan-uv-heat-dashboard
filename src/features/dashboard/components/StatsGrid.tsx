import { AlertTriangle, ArrowDownRight, Sun, ThermometerSun } from "lucide-react";
import { StatCard } from "../../../components/StatCard";
import { formatInteger, formatNumber } from "../../../lib/format";
import type { DashboardData } from "../../../lib/types";

export function StatsGrid({ data }: { data: DashboardData }) {
  return (
    <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={Sun}
        tone="sun"
        label="最高有效 UV 觀測"
        value={formatInteger(data.stats.highestUv?.uvIndex)}
        caption={data.stats.highestUv ? `${data.stats.highestUv.county} 曝曬最強` : "暫無 UV 資料"}
      />
      <StatCard
        icon={ThermometerSun}
        tone="heat"
        label="最高有效氣溫觀測"
        value={formatNumber(data.stats.highestTemperature?.observedTemperature)}
        unit="°C"
        caption={
          data.stats.highestTemperature
            ? `${data.stats.highestTemperature.county}；非官方高溫燈號`
            : "暫無未過期氣溫觀測"
        }
      />
      <StatCard
        icon={AlertTriangle}
        tone="ink"
        label="非常高／極端 UV"
        value={String(data.stats.highUvCounties)}
        unit={`/ ${data.stats.totalCounties}`}
        caption={
          data.stats.missingDataCount
            ? `${data.stats.missingDataCount} 縣市目前資料不足`
            : "只計未過期的 UV 測站觀測"
        }
      />
      <StatCard
        icon={ArrowDownRight}
        tone="reef"
        label="目前 UV 觀測較低"
        value={data.stats.lowestUv?.county ?? "--"}
        caption={
          data.stats.lowestUv
            ? `${data.stats.lowestUv.uvLevel.label}；不代表適合戶外活動`
            : "需要更多有效 UV 觀測"
        }
      />
    </section>
  );
}
