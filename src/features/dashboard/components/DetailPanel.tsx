import type { LucideIcon } from "lucide-react";
import { MapPin, Sun, ThermometerSun } from "lucide-react";
import { RiskPill } from "../../../components/RiskPill";
import { formatInteger, formatNumber, formatTime } from "../../../lib/format";
import type { CountyRisk } from "../../../lib/types";
import { toneStyles } from "../constants";

export function DetailPanel({ county }: { county: CountyRisk }) {
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
  icon: LucideIcon;
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
