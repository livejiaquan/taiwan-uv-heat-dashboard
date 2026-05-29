# Architecture

This project is a client-side public-data dashboard. The runtime shape is intentionally small: CWA payloads are loaded in the browser, normalized into county-level risk records, and rendered through feature-scoped React components.

## Directory Layout

```text
src/
  App.tsx                         App shell: loading, fatal error, dashboard route
  components/                     Shared presentational primitives
  data/                           Static county metadata and demo fallback records
  features/
    dashboard/
      DashboardPage.tsx           Dashboard composition and view state
      constants.ts                UI filter/sort options and shared visual mappings
      types.ts                    Dashboard-local UI types
      useDashboardData.ts         Data-loading hook and refresh state
      components/                 Dashboard-only sections and cards
  lib/
    cwa.ts                        CWA fetchers, parsers, and county aggregation
    risk.ts                       UV, heat-index, risk-level, and advice model
    format.ts                     Display formatting helpers
    types.ts                      Shared domain types
```

## Data Flow

```text
CWA Open Data / demo fallback
  -> src/lib/cwa.ts
  -> typed StationObservation / CountyForecast
  -> county-level CountyRisk records
  -> useDashboardData()
  -> DashboardPage sections
```

The app treats raw API responses as untrusted `unknown` values until they are parsed. Missing or malformed fields degrade into partial county records rather than crashing the UI.

## UI Boundaries

- `App.tsx` owns only application shell states.
- `DashboardPage.tsx` owns selected county, region filter, and sort mode.
- `features/dashboard/components/` contains sections tied to this product surface.
- `components/` contains reusable primitives that are not dashboard-specific.
- `lib/` has no React dependencies.

## State Model

- `loading`: initial fetch is in progress.
- `ready`: live or demo dashboard data is available.
- `error`: no usable data could be built.
- `degraded`: represented inside `DashboardData.stats.errors`.
- `stale`: live data latest update is older than the threshold in `src/lib/cwa.ts`.

## Risk Model

The dashboard computes UV risk and heat risk separately, then uses the higher level as the overall county risk. The model is intentionally explainable and local to `src/lib/risk.ts`.

Risk colors map to semantic levels rather than arbitrary chart colors, so rankings, pills, bars, and detail panels stay consistent.
