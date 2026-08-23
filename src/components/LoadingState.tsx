import { SunMedium } from "lucide-react";
import { FamilyMark } from "./FamilyMark";

export function LoadingState() {
  return (
    <div className="grid min-h-screen place-items-center bg-sun-field px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white/85 p-6 text-center shadow-card backdrop-blur sm:p-8" role="status" aria-live="polite">
        <div className="text-left"><FamilyMark /></div>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sun-100 text-sun-600 shadow-inner">
          <SunMedium className="h-8 w-8 animate-spin [animation-duration:3.5s]" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-ink-900">載入氣象風險資料</h1>
        <p className="mt-2 text-sm leading-6 text-ink-500">
          正在整理紫外線、溫度、濕度與縣市預報。
        </p>
        <div className="mt-6 grid gap-2">
          <div className="h-3 animate-pulse rounded-full bg-ink-100" />
          <div className="h-3 w-4/5 animate-pulse rounded-full bg-ink-100" />
          <div className="h-3 w-2/3 animate-pulse rounded-full bg-ink-100" />
        </div>
      </div>
    </div>
  );
}
