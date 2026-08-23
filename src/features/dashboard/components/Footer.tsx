import { FamilyMark } from "../../../components/FamilyMark";

export function Footer() {
  return (
    <footer className="mt-8 rounded-2xl border border-ink-700 bg-ink-900 p-5 text-white shadow-card">
      <div className="grid gap-5 md:grid-cols-[1.15fr_0.85fr]">
        <div>
          <FamilyMark inverse />
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
            觀測與預報資料來自交通部中央氣象署 O-A0003-001、F-C0032-001；健康文字依國民健康署指引整理。本專案非官方服務，不取代正式警特報或醫療判斷。
          </p>
        </div>
        <div className="grid gap-2 text-sm font-semibold text-white/75">
          <a href="https://opendata.cwa.gov.tw/" target="_blank" rel="noreferrer">
            中央氣象署開放資料平臺
          </a>
          <a href="https://www.cwa.gov.tw/" target="_blank" rel="noreferrer">
            中央氣象署正式天氣與警特報
          </a>
          <a href="https://www.cwa.gov.tw/V8/C/P/Warning/W29.html" target="_blank" rel="noreferrer">
            中央氣象署高溫資訊
          </a>
          <a href="https://www.hpa.gov.tw/5020/20092/n" target="_blank" rel="noreferrer">
            國民健康署熱傷害指引
          </a>
        </div>
      </div>
    </footer>
  );
}
