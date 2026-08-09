import type { LucideIcon } from "lucide-react";
import { MapPin, Sun, ThermometerSun } from "lucide-react";
import { RiskPill } from "../../../components/RiskPill";
import { formatInteger, formatNumber, formatTime } from "../../../lib/format";
import type { CountyRisk } from "../../../lib/types";
import { toneStyles } from "../constants";

export function DetailPanel({ county }: { county: CountyRisk }) {
  const dataQuality = dataQualityCopy[county.dataQuality];
  const usesHeatIndex = county.heatIndex !== undefined;
  const heatValue = usesHeatIndex ? county.heatIndex : county.observedTemperature;
  const heatStale = usesHeatIndex ? county.heatIndexStale : county.temperatureStale;
  const heatStationName = usesHeatIndex
    ? county.heatIndexStationName
    : county.temperatureStationName;
  const heatObservedAt = usesHeatIndex
    ? county.heatIndexObservedAt
    : county.temperatureObservedAt;
  const hasValidForecast =
    county.forecastMaxTemperature !== undefined &&
    Boolean(county.forecastStartTime) &&
    Boolean(county.forecastEndTime);

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
        <RiskPill level={county.priorityLevel} label={`UV ${county.priorityLevel.label}`} />
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-white bg-gradient-to-br from-sun-100 via-white to-reef-100 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricBlock
            icon={Sun}
            label="UV 測站觀測"
            value={formatInteger(county.uvIndex)}
            unit="UVI"
            level={county.uvStale ? "觀測已超過 45 分鐘" : county.uvLevel.label}
            helper={`CWA O-A0003-001 · ${county.uvStationName ?? "測站未知"} · ${formatTime(county.uvObservedAt)}`}
          />
          <MetricBlock
            icon={ThermometerSun}
            label={usesHeatIndex ? "目前體感估算" : "目前氣溫觀測"}
            value={formatNumber(heatValue)}
            unit="°C"
            level={
              heatStale
                ? "觀測已超過 45 分鐘"
                : usesHeatIndex
                  ? "本站估算，非官方高溫燈號"
                  : "測站氣溫，非熱傷害分級"
            }
            helper={`CWA O-A0003-001 · ${heatStationName ?? "測站未知"} · ${formatTime(heatObservedAt)}`}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <DetailItem label="觀測溫度" value={`${formatNumber(county.observedTemperature)} °C`} />
        <DetailItem
          label={usesHeatIndex ? "體感估算相對濕度" : "相對濕度"}
          value={`${formatInteger(county.humidity)} %`}
        />
        <DetailItem label="測站數" value={`${county.stationCount} 站`} />
        <DetailItem label="資料品質" value={dataQuality.label} helper={dataQuality.body} />
      </div>

      <div className="mt-5 rounded-2xl border border-reef-100 bg-reef-50/60 p-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-reef-700">
          Forecast · CWA F-C0032-001
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black text-ink-900">未來 36 小時最高溫預報</p>
            <p className="mt-1 text-xs leading-5 text-ink-500">
              {hasValidForecast
                ? `有效時段：${formatTime(county.forecastStartTime)} 至 ${formatTime(county.forecastEndTime)}`
                : "目前未取得具有效時段的預報，未顯示數值。"}
            </p>
          </div>
          {hasValidForecast ? (
            <p className="text-3xl font-black text-ink-900">
              {formatNumber(county.forecastMaxTemperature)}
              <span className="ml-1 text-sm text-ink-500">°C</span>
            </p>
          ) : null}
        </div>
        <p className="mt-2 text-xs leading-5 text-ink-500">
          {hasValidForecast ? county.forecastWeather ?? "天氣描述暫缺" : "預報欄位不足"} · 此值是未來時段預報，不參與目前 UV 分級或目前體感估算。
        </p>
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

      <p className="mt-4 text-xs font-semibold leading-5 text-ink-500">
        縣市摘要的最新一筆觀測：{formatTime(county.observedAt)}。不同指標可能來自不同測站，請以各數值旁的時間為準。
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
  helper,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  unit: string;
  level: string;
  helper: string;
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
      <p className="mt-2 text-xs leading-5 text-ink-500">{helper}</p>
    </div>
  );
}

const dataQualityCopy: Record<CountyRisk["dataQuality"], { label: string; body: string }> = {
  complete: {
    label: "兩項觀測可用",
    body: "未過期 UV 與氣溫觀測皆可用；不代表整個縣市狀況一致",
  },
  partial: {
    label: "一項觀測可用",
    body: "只有未過期 UV 或氣溫其中一項；另一項維持未知",
  },
  missing: {
    label: "不足",
    body: "目前沒有具有效時間的 UV 或氣溫觀測支撐判讀",
  },
};

function DetailItem({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white/70 p-3">
      <p className="text-xs font-bold text-ink-500">{label}</p>
      <p className="mt-1 text-lg font-black text-ink-900">{value}</p>
      {helper ? <p className="mt-1 text-xs leading-5 text-ink-500">{helper}</p> : null}
    </div>
  );
}
