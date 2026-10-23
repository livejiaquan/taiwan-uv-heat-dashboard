# 圖示與品牌標記

本站所有介面圖示只用 [Lucide](https://lucide.dev)（MIT），透過 `lucide-react@1.53.0` 載入。繪製參數統一：24px 格、`stroke-width` 1.75、圓角線端與轉角、`currentColor`；尺寸只用 16／20／24。共用設定在 `src/features/dashboard/components/icons.ts`。

## 品牌標記

| 檔案 | 用途 |
| --- | --- |
| `public/brand/mark.svg`（本資料夾 `mark.svg`） | 唯一來源。64×64，圓角 22%（14.08），填色琥珀 `#c28a29`（hsl 38°, 65%, 46%），白色 Lucide `sun` 佔 58%、stroke 2、置中 |
| `public/favicon.svg` | 與 mark.svg 相同 |
| `public/apple-touch-icon.png` | 180×180，由 mark.svg 以 Chrome 輸出；iOS 會自行切圓角，所以輸出成滿版方形 |
| 頁首 | `<img src="brand/mark.svg">` 32px ＋ 字標「台灣曬熱指南」16/600、副標「紫外線與熱傷害」12/500，間距 10px |
| 頁尾 | 同一張 mark.svg，24px |

深色模式下標記顏色不變。

## 站內圖示

| 位置 | 用途 | Lucide 名稱 | 尺寸 |
| --- | --- | --- | --- |
| 頁首縣市選單 | 下拉提示 | `chevron-down` | 16 |
| 資料時間列 | 重新整理 | `refresh-cw` | 16 |
| 指標列 | 紫外線指數 | `sun` | 16 |
| 指標列 | 體感溫度 | `thermometer` | 16 |
| 指標列 | 需要防曬 | `shield-check` | 16 |
| 指標列 | 已知最高體感 | `flame` | 16 |
| 指標列 | 適合運動 | `footprints` | 16 |
| 逐時區塊 | 表格檢視 | `table-2` | 20 |
| 逐時區塊 | 圖表檢視 | `chart-line` | 20 |
| 出門清單 | 項目勾選 | `check` | 16 |
| 出門清單 | 複製提醒 | `copy` | 20 |

## 被替換掉的手繪 SVG

| 檔案 | 原本 | 改成 |
| --- | --- | --- |
| `BrandMark.tsx` | 手繪漸層太陽（橘黃漸層方塊＋太陽＋地平線） | `public/brand/mark.svg`（Lucide `sun`） |
| `TopBar.tsx` | 12px 手繪下拉箭頭 | Lucide `chevron-down` |
| `Verdict.tsx`（出門清單） | 12px 手繪勾號 | Lucide `check` |
| `index.html` | data URI 內嵌的手繪 favicon | `favicon.svg`、`apple-touch-icon.png` |

不是圖示、所以保留的 SVG：`Timeline.tsx` 的體感溫度圖表（含「現在」三角標記）、`National.tsx` 的縣市地圖。

## GitHub 露出

- 介面沒有 GitHub 連結；資料過舊時的說明由「GitHub 排程延遲」改為「排程更新延遲」。
- `public/third-party-notices.txt` 的 taiwan-atlas 來源改寫成套件名稱與作者，保留 MIT 授權全文。
- `og:url`、`og:image` 用站點網址（github.io 網域，不是 GitHub 頁面）。
- 驗收：`npm run build:public` 後 `grep -rn "github.com" dist/` 為 0 筆。
