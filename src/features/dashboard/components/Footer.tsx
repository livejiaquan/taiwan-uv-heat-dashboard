import { FamilyMark } from "../../../components/FamilyMark";

export function Footer() {
  return (
    <footer className="mt-8 rounded-2xl border border-white/75 bg-ink-900 p-5 text-white shadow-card">
      <div className="grid gap-5 md:grid-cols-[1.15fr_0.85fr]">
        <div>
          <FamilyMark inverse />
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
            資料來源以交通部中央氣象署開放資料為主。本專案非官方服務，風險提示供戶外活動規劃參考，正式警特報與健康指引請以主管機關公告為準。
          </p>
        </div>
        <div className="grid gap-2 text-sm font-semibold text-white/75">
          <a href="https://opendata.cwa.gov.tw/" target="_blank" rel="noreferrer">
            中央氣象署開放資料平臺
          </a>
          <a href="https://www.cwa.gov.tw/" target="_blank" rel="noreferrer">
            中央氣象署
          </a>
          <a href="https://data.gov.tw/" target="_blank" rel="noreferrer">
            政府資料開放平臺
          </a>
        </div>
      </div>
    </footer>
  );
}
