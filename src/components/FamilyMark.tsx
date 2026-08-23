import { Waves } from "lucide-react";

export function FamilyMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-2 ${inverse ? "text-white" : "text-ink-900"}`}>
      <span
        className={`grid h-8 w-8 place-items-center rounded-xl ${
          inverse ? "bg-white/15 text-white" : "bg-reef-700 text-white"
        }`}
        aria-hidden="true"
      >
        <Waves className="h-4 w-4" />
      </span>
      <span className="leading-tight">
        <span className={`block text-[11px] font-bold tracking-[0.08em] ${inverse ? "text-white/70" : "text-ink-500"}`}>
          台灣生活資料誌
        </span>
        <span className="block text-sm font-black">紫外線與熱風險</span>
      </span>
    </div>
  );
}
