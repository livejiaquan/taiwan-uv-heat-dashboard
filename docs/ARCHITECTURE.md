# Architecture

A client-only React app. CWA payloads are fetched in the browser, normalised into an hourly outlook per county, and rendered by a single dashboard feature.

## Directory layout

```text
src/
  App.tsx                     Loading / error / dashboard shell
  styles.css                  Design tokens (light + dark) and all component styles
  data/
    counties.ts               County metadata and name normalisation (台/臺)
    demo.ts                   Demo scenario used without an API key
    taiwan-map.json           Pre-projected county outlines (scripts/build-taiwan-map.mjs)
  lib/                        No React imports
    cwa.ts                    Fetching, dataset loading, observation + daily UV parsers
    forecast.ts               F-D0047 / F-C0032 parsers (current and older field names)
    outlook.ts                Builds the per-county, per-hour DayOutlook for today and tomorrow
    levels.ts                 UV and apparent-temperature levels, CWA apparent-temperature formula
    guidance.ts               Verdict, time windows, packing list, audience advice, share text
    load.ts                   Live vs demo decision
    time.ts                   Asia/Taipei date and hour helpers
  features/dashboard/
    Dashboard.tsx             Page state: county, day, hour, audience, skin type, metric
    useDashboardData.ts       Loading, 10-minute auto refresh, keeps last live data on failure
    useNow.ts                 Minute clock so "now" stays current
    components/               TopBar, StatusLine, Verdict, Timeline, Advice, National, Footer
```

## Data flow

```text
CWA datasets ──► cwa.ts / forecast.ts ──► outlook.ts ──► DashboardData
                                                         │
demo.ts (no key / all sources down) ─────────────────────┘
                                                         ▼
                                    Dashboard ──► guidance.ts for every visible sentence
```

Each `DayOutlook` holds 24 `HourPoint`s. For today's current hour the values come from fresh station observations; other hours come from forecasts. Missing values stay `undefined` all the way to the UI, which shows "資料不足" instead of treating them as low risk.

## Interaction model

- Today follows the clock until the reader picks another hour; "回到現在" returns to following it.
- The timeline is an ARIA slider (arrow keys, Home/End), drag with a mouse, tap on touch screens. On narrow screens it scrolls horizontally with a pinned y-axis.
- County, skin type are remembered in `localStorage` when available.

## Tests

`src/lib/*.test.ts` cover the parsers against fixtures in both CWA field-naming generations, the outlook builder (observations vs forecasts, interpolation, stale readings), and the guidance text for every county, day, hour and audience.
