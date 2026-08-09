# Architecture

This project currently has a client-side validation architecture: CWA payloads are loaded in the browser, normalized into county-level records, and rendered through feature-scoped React components. This is an interim shape, not the approved production data architecture.

## Directory Layout

```text
src/
  App.tsx                         App shell: loading, fatal error, dashboard route
  components/                     Shared presentational primitives
  data/                           Static county metadata; legacy example records are not imported at runtime
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
CWA Open Data (development credential only)
  -> src/lib/cwa.ts
  -> typed StationObservation / CountyForecast
  -> county-level CountyRisk records
  -> useDashboardData()
  -> DashboardPage sections
```

The app treats raw API responses as untrusted `unknown` values until they are parsed. Observation records require a valid, non-future timestamp and domain-valid values. Missing or malformed fields remain unknown. If current observations cannot be validated, the app fails closed instead of substituting forecast, daily-maximum, cached sample, or demo values.

## UI Boundaries

- `App.tsx` owns only application shell states.
- `DashboardPage.tsx` owns selected county, region filter, and sort mode.
- `features/dashboard/components/` contains sections tied to this product surface.
- `components/` contains reusable primitives that are not dashboard-specific.
- `lib/` has no React dependencies.

## State Model

- `loading`: initial fetch is in progress.
- `ready`: validated CWA station observations are available; forecast may be partial.
- `error`: no validated current observation is available or no credential is configured; only official-source links and retry are shown.
- `degraded`: represented inside `DashboardData.stats.errors`.
- `stale`: evaluated per county and displayed metric; a fresh record elsewhere cannot mask it. The client recalculates freshness once per minute from its validated in-memory payload, without fabricating a newer timestamp or silently fetching a replacement.

## Risk Model

UV uses the established UV index categories. Current ranking and map colors use only valid, unexpired UV station observations. Temperature, a same-station temperature/humidity heat-index estimate, and 36-hour forecast maximum remain separate; the local estimate is not presented as an official warning or WBGT category.

Risk colors map to semantic levels rather than arbitrary chart colors, so rankings, pills, bars, and detail panels stay consistent.

## Target Production Architecture

The approved next step is a scheduled server-side aggregator with a private CWA credential, source-specific caching, captured schema fixtures, normalized provenance and freshness, health monitoring, and explicit stale/expired output. See `PRODUCT_MISSION_AND_ROADMAP.md` for launch gates.
