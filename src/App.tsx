import { BrandMark } from "./features/dashboard/components/BrandMark";
import { Dashboard } from "./features/dashboard/Dashboard";
import { useDashboardData } from "./features/dashboard/useDashboardData";

function App() {
  const demo = new URLSearchParams(window.location.search).get("demo") === "1";
  const { status, data, error, refreshing, refresh, now } = useDashboardData(demo);

  if (status === "loading") {
    return (
      <main className="screen-state" aria-busy="true">
        <div>
          <div className="spinner" aria-hidden="true" />
          <h1>正在讀取氣象資料快照</h1>
          <p>整理各縣市的紫外線、體感溫度與降雨預報。</p>
        </div>
      </main>
    );
  }

  const hasWeather = data?.counties.some((c) => c.days.some((d) => d.hours.some((h) => h.uv !== undefined || h.apparent !== undefined || h.temperature !== undefined)));
  if (!data || !hasWeather) {
    return (
      <main className="screen-state">
        <div>
          <BrandMark />
          <h1>氣象資料暫時無法使用</h1>
          <p>{error ?? data?.issues[0] ?? "目前沒有有效氣象資料。"}請稍後再試，或直接查看中央氣象署網站。</p>
          <button className="btn-ghost" type="button" onClick={() => void refresh()}>
            重新載入
          </button>
          <p><a href="https://www.cwa.gov.tw/" target="_blank" rel="noopener noreferrer">查看中央氣象署最新資訊</a></p>
          <p><a href="?demo=1">查看示範介面（非實際天氣）</a></p>
        </div>
      </main>
    );
  }

  return <Dashboard data={data} now={now} refreshing={refreshing} onRefresh={() => void refresh()} />;
}

export default App;
