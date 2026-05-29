import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  caption: string;
  tone: "sun" | "reef" | "heat" | "ink";
}

const toneClass = {
  sun: "border-l-sun-500 text-sun-600 bg-gradient-to-br from-white to-sun-50",
  reef: "border-l-reef-500 text-reef-700 bg-gradient-to-br from-white to-reef-50",
  heat: "border-l-heat-500 text-heat-700 bg-gradient-to-br from-white to-heat-50",
  ink: "border-l-ink-700 text-ink-700 bg-gradient-to-br from-white to-ink-100",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  caption,
  tone,
}: StatCardProps) {
  return (
    <article
      className={`relative overflow-hidden rounded-xl border border-white/80 border-l-4 p-4 shadow-card ${toneClass[tone]}`}
    >
      <div className="absolute right-3 top-3 rounded-full bg-white/70 p-2 text-current shadow-sm">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="pr-12 text-sm font-semibold text-ink-500">{label}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <strong className="text-3xl font-black leading-none text-ink-900">
          {value}
        </strong>
        {unit ? <span className="text-sm font-bold text-ink-500">{unit}</span> : null}
      </div>
      <p className="mt-2 text-sm leading-5 text-ink-500">{caption}</p>
    </article>
  );
}
