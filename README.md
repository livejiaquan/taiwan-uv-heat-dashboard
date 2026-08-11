# 台灣 UV 與高溫風險儀表板

一個以台灣官方公開資料為主的戶外風險快照，目標是讓使用者快速看清指定地點的資料種類、有效時間、主要風險與下一步。產品目前處於 **P0 trust-safety** 階段；正式 server-side 資料供應尚未完成，不能視為 production-ready 健康決策服務。

## Project Structure

```text
src/
  App.tsx
  components/
  data/
  features/dashboard/
  lib/
docs/
  ARCHITECTURE.md
  DATA_SOURCES.md
  DEPLOYMENT.md
.github/workflows/
  ci.yml
```

- Architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Data source strategy: [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md)
- Deployment notes: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- Product mission and roadmap: [`docs/PRODUCT_MISSION_AND_ROADMAP.md`](docs/PRODUCT_MISSION_AND_ROADMAP.md)

## Data Strategy

主要資料來源為交通部中央氣象署開放資料平臺：

- `O-A0003-001`：氣象觀測站 10 分鐘綜觀氣象資料，取具有效觀測時間的氣溫、相對濕度與 UVIndex。
- `F-C0032-001`：今明 36 小時天氣預報，另列各時段最高溫與天氣描述，不混入「目前」風險。

CWA Open Data API 需要會員授權碼。沒有 `VITE_CWA_API_KEY`、觀測無效或來源完全失敗時，介面會 fail closed，只顯示可信的 unavailable state 與官方連結；production 不會載入示範數值、排行或行動建議。

## Risk Model

- UV：`0-2` 低、`3-5` 中等、`6-7` 高、`8-10` 非常高、`11+` 極端。
- 熱感：只有同一測站同時具備氣溫與濕度時才顯示本站估算，且明示不是官方高溫燈號或 WBGT 分級。
- 排序：目前只使用未超過 45 分鐘的 UV 測站觀測分級；未來預報不建立現在風險。
- 資料新鮮度：以縣市與指標個別判斷，畫面會每分鐘以同一份已驗證 payload 重新判斷；超過 45 分鐘即排除於目前排序，缺資料不會被視為低風險。

## Features

- 台灣全域 UV / 高溫總覽
- 縣市風險卡、區域篩選、危險/安全排序
- 有效 UV 觀測排行與「較低不代表安全」比較
- 選取縣市後查看測站、觀測時間、預報有效時段與戶外建議
- loading / unavailable / empty / partial / stale data states
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
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm run build:public
```

## Deployment

### GitHub Pages

This project can be deployed as a static Vite build, but a no-key build intentionally shows an unavailable state. It is safe from fabricated recency, not a complete production data service.

The Pages/CI artifact command is `npm run build:public`. It refuses a non-empty
`VITE_CWA_API_KEY`, uses a checked `PUBLIC_BASE_PATH` (default:
`/taiwan-uv-heat-dashboard/`), builds with the key explicitly empty, and scans the
real `dist/` output for credential-shaped tokens, placeholders, and legacy demo
markers before the artifact can be uploaded. The ordinary `npm run build` remains
available for local authenticated contract validation and does not make a
client-side key production-safe.

### Vercel / Netlify guarded root-host candidate

To build the same honest unavailable state for a prospective root custom domain,
do **not** set `VITE_CWA_API_KEY`. Configure:

- Install command: `npm ci`
- Build command: `PUBLIC_BASE_PATH=/ npm run build:public`
- Output directory: `dist`

Because this is a client-only static app, a `VITE_` key is visible in the browser
bundle. Do not treat that route as production-ready. The next production milestone
is a cached server-side aggregator that keeps the credential private, validates
schemas, and exposes source health. This command only verifies root-relative asset
paths; the canonical/OG origin, DNS/HTTPS, and deployed browser smoke still require
an approved domain decision.

## Source Notes

- CWA Open Data: https://opendata.cwa.gov.tw/
- CWA API guide: https://opendata.cwa.gov.tw/devManual/insrtuction
- Government open data portal: https://data.gov.tw/

This is not an official government service. Risk guidance is for awareness and planning; official warnings and health recommendations should be checked from the relevant authorities.
