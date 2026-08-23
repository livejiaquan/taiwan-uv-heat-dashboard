import { AlertTriangle, RefreshCw } from "lucide-react";
import { LoadingState } from "./components/LoadingState";
import { FamilyMark } from "./components/FamilyMark";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { useDashboardData } from "./features/dashboard/useDashboardData";

function App() {
  const dashboard = useDashboardData();

  if (dashboard.status === "loading") return <LoadingState />;

  if (dashboard.status === "error" || !dashboard.data) {
    return (
      <main className="grid min-h-screen place-items-center bg-sun-field px-4 py-6">
        <section className="w-full max-w-lg rounded-2xl border border-line bg-white/90 p-6 text-center shadow-card backdrop-blur sm:p-8">
          <div className="text-left"><FamilyMark /></div>
          <AlertTriangle className="mx-auto mt-6 h-10 w-10 text-heat-700" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-black text-ink-900">資料載入失敗</h1>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            {dashboard.error ?? "目前無法建立儀表板資料。"}
          </p>
          <button className="btn-primary mt-6" onClick={() => void dashboard.refresh()}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            重新整理
          </button>
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
