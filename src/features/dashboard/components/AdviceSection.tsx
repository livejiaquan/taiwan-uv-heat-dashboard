import { Activity, ArrowDown, ArrowUp, Sparkles } from "lucide-react";
import { formatInteger } from "../../../lib/format";
import type { CountyRisk } from "../../../lib/types";

interface AdviceSectionProps {
  counties: CountyRisk[];
  selected?: CountyRisk;
}

export function AdviceSection({ counties, selected }: AdviceSectionProps) {
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
            <div
              key={county.county}
              className="flex items-center justify-between rounded-xl border border-reef-100 bg-reef-50/60 p-3"
            >
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
