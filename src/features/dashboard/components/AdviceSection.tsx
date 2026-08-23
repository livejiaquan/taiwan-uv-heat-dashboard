import { Activity, ArrowDown, ArrowUp, Sparkles } from "lucide-react";
import { formatInteger } from "../../../lib/format";
import type { CountyRisk } from "../../../lib/types";

interface AdviceSectionProps {
  counties: CountyRisk[];
  selected?: CountyRisk;
}

export function AdviceSection({ counties, selected }: AdviceSectionProps) {
  const ranked = counties.filter((county) => county.priorityScore >= 0);
  const lowerUv = [...ranked]
    .sort((a, b) => a.priorityScore - b.priorityScore)
    .slice(0, 3);
  const higherUv = ranked.slice(0, 3);

  return (
    <section className="mt-8 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-2xl border border-line bg-white/80 p-5 shadow-card backdrop-blur">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-reef-700" />
          <h2 className="text-2xl font-black text-ink-900">目前 UV 觀測較低</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-ink-500">
          僅比較有效測站觀測；數值較低不代表整個縣市或其他戶外風險安全。
        </p>
        <div className="mt-4 grid gap-3">
          {lowerUv.map((county) => (
            <div
              key={county.county}
              className="flex items-center justify-between rounded-xl border border-reef-100 bg-reef-50/60 p-3"
            >
              <span>
                <strong className="block text-ink-900">{county.county}</strong>
                <span className="text-xs font-semibold text-ink-500">
                  UV {formatInteger(county.uvIndex)} · {county.uvLevel.label}
                </span>
              </span>
              <ArrowDown className="h-5 w-5 text-reef-700" />
            </div>
          ))}
          {!lowerUv.length ? (
            <p className="rounded-xl border border-ink-100 bg-ink-100/40 p-3 text-sm text-ink-500">
              目前沒有可比較的未過期 UV 觀測。
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white/80 p-5 shadow-card backdrop-blur">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-heat-700" />
          <h2 className="text-2xl font-black text-ink-900">UV 防護提醒</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {higherUv.map((county) => (
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
