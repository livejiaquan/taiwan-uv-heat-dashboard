import { BrandMark } from "./features/dashboard/components/BrandMark";
import { Dashboard } from "./features/dashboard/Dashboard";
import { useDashboardData } from "./features/dashboard/useDashboardData";

function App() {
  const { status, data, error, refreshing, refresh } = useDashboardData();

  if (status === "loading") {
    return (
      <main className="screen-state" aria-busy="true">
        <div>
          <div className="spinner" aria-hidden="true" />
          <h1>正在讀取中央氣象署資料</h1>
          <p>整理各縣市的紫外線、體感溫度與降雨預報。</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="screen-state">
        <div>
          <BrandMark />
          <h1>資料載入失敗</h1>
          <p>{error ?? "目前無法取得資料。"}請稍後再試，或直接查看中央氣象署網站。</p>
          <button className="btn-ghost" type="button" onClick={() => void refresh()}>
            重新載入
          </button>
        </div>
      </main>
    );
  }

  return <Dashboard data={data} refreshing={refreshing} onRefresh={() => void refresh()} />;
}

export default App;
