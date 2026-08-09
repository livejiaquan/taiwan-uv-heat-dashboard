import { AlertTriangle, ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";
import { LoadingState } from "./components/LoadingState";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { useDashboardData } from "./features/dashboard/useDashboardData";

function App() {
  const dashboard = useDashboardData();

  if (dashboard.status === "loading") return <LoadingState />;

  if (dashboard.status === "error" || !dashboard.data) {
    return (
      <main className="min-h-screen bg-sun-field px-4 py-8 sm:py-14">
        <section className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-card backdrop-blur">
          <div className="bg-[linear-gradient(120deg,rgba(245,158,11,0.18),rgba(20,184,166,0.14),rgba(239,68,68,0.10))] p-6 sm:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-sun-300 bg-white/80 px-3 py-1 text-sm font-black text-sun-600">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              正式資料尚未可用
            </div>
            <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight text-ink-900 sm:text-4xl">
              目前無法提供可靠的即時判讀
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-700">
              {dashboard.error ?? "中央氣象署資料目前無法驗證。"}
              本站不會以範例、舊快照或預報值代替現在觀測。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                className="btn-primary"
                href="https://www.cwa.gov.tw/"
                target="_blank"
                rel="noreferrer"
              >
                查看中央氣象署
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
              <button className="btn-primary" onClick={() => void dashboard.refresh()}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                重新檢查
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-10">
            <a
              className="rounded-2xl border border-ink-100 bg-ink-100/40 p-4 transition hover:border-sun-300 hover:bg-sun-50"
              href="https://www.cwa.gov.tw/V8/C/P/Warning/W29.html"
              target="_blank"
              rel="noreferrer"
            >
              <p className="font-black text-ink-900">官方高溫資訊</p>
              <p className="mt-1 text-sm leading-6 text-ink-500">
                查閱中央氣象署目前有效的高溫燈號與影響地區。
              </p>
            </a>
            <a
              className="rounded-2xl border border-ink-100 bg-ink-100/40 p-4 transition hover:border-reef-100 hover:bg-reef-50"
              href="https://www.hpa.gov.tw/5020/20092/n"
              target="_blank"
              rel="noreferrer"
            >
              <p className="font-black text-ink-900">國健署熱傷害指引</p>
              <p className="mt-1 text-sm leading-6 text-ink-500">
                了解高風險族群、預防方式與熱傷害處置。
              </p>
            </a>
            <div className="rounded-2xl border border-heat-100 bg-heat-50/60 p-4 sm:col-span-2">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-heat-700" aria-hidden="true" />
                <p className="text-sm leading-6 text-ink-700">
                  若出現意識混亂、昏厥、呼吸困難或體溫持續升高，應立即移到陰涼處降溫並撥打
                  <strong className="text-ink-900"> 119</strong>；只有意識清楚時才可喝水。
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <DashboardPage
      data={dashboard.data}
      refreshing={dashboard.refreshing}
      onRefresh={() => void dashboard.refresh()}
    />
  );
}

export default App;
