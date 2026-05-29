# 台灣 UV 與高溫風險儀表板

一個以台灣官方公開資料為主的前端儀表板，用來快速判斷各縣市的紫外線曝曬與高溫熱傷害風險。設計語言延續 `livejiaquan/taiwan-reservoir-static` 的公共資料 dashboard 風格：大數字、卡片、語意風險色、排名、細節卡與明確資料狀態。

## Data Strategy

主要資料來源為交通部中央氣象署開放資料平臺：

- `O-A0003-001`：氣象觀測站 10 分鐘綜觀氣象資料，取氣溫、相對濕度、UVIndex。
- `O-A0005-001`：每日紫外線指數最大值，作為 UV 覆蓋不足時的備援。
- `F-C0032-001`：今明 36 小時天氣預報，取縣市最高溫與天氣描述。

CWA Open Data API 需要會員授權碼。沒有 `VITE_CWA_API_KEY` 時，介面會切換到內建示範資料，並在頁面頂部標示降級狀態，方便 GitHub Pages 或 portfolio preview 保持可瀏覽。

## Risk Model

- UV：`0-2` 低、`3-5` 中等、`6-7` 高、`8-10` 非常高、`11+` 極端。
- 高溫：以觀測氣溫、相對濕度估算熱指數，再與 36 小時最高溫比較，取較高風險。
- 總風險：取 UV 與高溫兩者較高等級，並加入數值排序權重。
- 資料新鮮度：即時模式下最新觀測超過 45 分鐘會標示 stale。

## Features

- 台灣全域 UV / 高溫總覽
- 縣市風險卡、區域篩選、危險/安全排序
- 最危險與相對安全排行
- 選取縣市詳細資訊與戶外活動建議
- loading / error / empty / degraded / stale data states
- desktop 與 mobile responsive layout

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local`:

```bash
VITE_CWA_API_KEY=your-cwa-authorization-key
```

Local URL is printed by Vite, usually `http://localhost:5173`.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

## Deployment

### GitHub Pages

This project can be deployed as a static Vite build. If no API key is configured, it will run in demo mode.

```bash
npm run build
```

Deploy the `dist/` directory.

### Vercel / Netlify

Set `VITE_CWA_API_KEY` in project environment variables, then use:

- Build command: `npm run build`
- Output directory: `dist`

Because this is a client-only static app, a `VITE_` key is visible in the browser bundle. For production with private quota control, place the CWA calls behind a serverless proxy and expose only your own endpoint to the frontend.

## Source Notes

- CWA Open Data: https://opendata.cwa.gov.tw/
- CWA API guide: https://opendata.cwa.gov.tw/devManual/insrtuction
- Government open data portal: https://data.gov.tw/

This is not an official government service. Risk guidance is for awareness and planning; official warnings and health recommendations should be checked from the relevant authorities.
