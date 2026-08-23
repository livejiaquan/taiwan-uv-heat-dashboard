import { ExternalLink, HeartPulse } from "lucide-react";

export function HealthSafetyNotice() {
  return (
    <aside
      className="mt-5 rounded-2xl border border-heat-100 bg-heat-50/45 p-5 shadow-card backdrop-blur"
      aria-labelledby="heat-safety-title"
    >
      <div className="flex gap-3">
        <HeartPulse className="mt-0.5 h-6 w-6 flex-none text-heat-700" aria-hidden="true" />
        <div>
          <h2 id="heat-safety-title" className="text-lg font-black text-ink-900">
            熱傷害不只看單一溫度
          </h2>
          <p className="mt-1 text-sm leading-6 text-ink-700">
            長者、嬰幼兒、孕婦、慢性病患者、服用特定藥物者與戶外工作者需特別留意。
            保持涼爽、適量補水並避開上午 10 點至下午 2 點曝曬；需要限制飲水者請依醫囑。
          </p>
          <p className="mt-2 text-sm font-bold leading-6 text-heat-700">
            意識混亂、昏厥、呼吸困難或體溫持續升高：立即降溫並撥打 119；只有意識清楚時才可喝水。
          </p>
          <a
            className="mt-3 inline-flex items-center gap-1 text-sm font-black text-reef-700 underline decoration-2 underline-offset-4"
            href="https://www.hpa.gov.tw/Pages/Detail.aspx?nodeid=577&pid=10751&sid=10740"
            target="_blank"
            rel="noreferrer"
          >
            查看國民健康署處置指引
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </aside>
  );
}
