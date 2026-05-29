import type { RiskLevel } from "../lib/types";

interface RiskPillProps {
  level: RiskLevel;
  label?: string;
}

export function RiskPill({ level, label }: RiskPillProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold",
        level.bgClass,
        level.borderClass,
        level.colorClass,
      ].join(" ")}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label ?? level.label}
    </span>
  );
}
