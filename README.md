# 台灣曬熱指南

現在適合出門嗎？這個網站用中央氣象署開放資料，直接回答你所在縣市「現在」和「明天」的紫外線與高溫狀況：防曬時段、最熱時刻、適合運動的時間、出門該帶什麼，並可一鍵複製提醒傳到 LINE。

線上版：https://livejiaquan.github.io/taiwan-uv-heat-dashboard/

## 功能

- **一句話結論**：依所選縣市與時段給出建議，搭配紫外線與體感溫度兩個指標。
- **今天／明天切換**：可提前規劃隔天行程。
- **逐時時間軸**：體感溫度曲線、逐時紫外線、降雨機率；手機上左右滑動，點一下選時段。
- **曬傷時間估算**：依膚質估算未擦防曬時多久會曬紅。
- **出門清單與 LINE 提醒**：依當天資料列出要帶的東西，並產生可直接貼到群組的文字。
- **分對象建議**：一般外出、兒童與長者、運動、戶外工作。
- **全台比較**：縣市著色地圖（含金門、連江小框）與可排序清單。
- **高溫提醒**：預報最高氣溫達氣象署高溫資訊門檻（36°C／38°C）時提示。
- 手機優先的版面、深色模式、鍵盤操作與螢幕閱讀器支援（axe-core WCAG 2.1 AA 檢查無違規）。

## 資料

使用中央氣象署開放資料平臺的五個資料集，詳見 [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md)。沒有設定授權碼或氣象署資料全部無法使用時，網站會顯示清楚標示的示範資料。

## 開發

```bash
npm install
cp .env.example .env.local   # 填入 VITE_CWA_API_KEY
npm run dev
```

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

- 架構：[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- 部署：[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

## 說明

本站不是官方服務，內容僅供參考；天氣警特報與高溫資訊燈號請以中央氣象署發布為準。體感溫度的五個分級是本站自訂的參考門檻，不是官方分級。
