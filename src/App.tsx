import type { ReactNode } from "react";
import { Brand } from "./features/dashboard/components/BrandMark";
import { Footer } from "./features/dashboard/components/Footer";
import { Dashboard } from "./features/dashboard/Dashboard";
import { useDashboardData } from "./features/dashboard/useDashboardData";

/** Header, content and footer stay in place even when there is no data to show. */
function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <div className="brand">
            <Brand />
          </div>
        </div>
      </header>
      <div className="wrap">
        <main>{children}</main>
        <Footer />
      </div>
    </>
  );
}

function App() {
  const demo = new URLSearchParams(window.location.search).get("demo") === "1";
  const { status, data, error, refreshing, refresh, now } = useDashboardData(demo);

  if (status === "loading") {
    return (
      <Shell>
        <section className="state-card" aria-busy="true">
          <div className="spinner" aria-hidden="true" />
          <h1>正在讀取氣象資料</h1>
          <p>整理各縣市的紫外線、體感溫度與降雨預報。</p>
        </section>
      </Shell>
    );
  }

  // Only reached when no snapshot has ever loaded on this device; any old data is shown instead.
  if (!data) {
    return (
      <Shell>
        <section className="state-card">
          <h1>目前讀不到氣象資料</h1>
          <p>{error ?? "目前沒有氣象資料。"}也可以直接查看中央氣象署網站。</p>
          <div className="state-actions">
            <button className="btn-ghost" type="button" onClick={() => void refresh()} disabled={refreshing}>
              {refreshing ? "重新載入中…" : "重新載入"}
            </button>
            <a href="https://www.cwa.gov.tw/V8/C/W/OBS_UVI.html" target="_blank" rel="noopener noreferrer">
              查看中央氣象署紫外線資訊
            </a>
            <a href="?demo=1">查看示範介面（非實際天氣）</a>
          </div>
        </section>
      </Shell>
    );
  }

  return <Dashboard data={data} now={now} refreshing={refreshing} onRefresh={() => void refresh()} />;
}

export default App;
