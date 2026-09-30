# Data Sources

The dashboard is designed around official Taiwan open data, mainly the Central Weather Administration (CWA) Open Data API.

## CWA Endpoints

| Dataset | Purpose | Fields Used |
| --- | --- | --- |
| `O-A0003-001` | 10-minute surface observations | station, county, observation time, temperature, humidity, UV index when available |
| `O-A0005-001` | daily maximum UV observations | same-Taiwan-day UV fallback, explicitly not a current observation |
| `F-C0032-001` | 36-hour county forecast | county max/min temperature and weather description |

## API Strategy

`src/lib/cwa.ts` loads the three datasets in parallel. Each dataset may fail independently. If at least one live dataset returns usable data, the dashboard renders a degraded live view and reports which source failed. If no live dataset is available, it falls back to demo data.

The public demo mode exists for GitHub portfolio viewing and static hosting without exposing a CWA key. It is marked clearly in the UI.

## Environment Variable

```bash
VITE_CWA_API_KEY=your-cwa-authorization-key
```

Because this is a Vite client app, `VITE_` variables are bundled into browser code. For production quota control, place CWA calls behind a serverless proxy and expose only your own endpoint to the frontend.

## County Aggregation

The parser normalizes county names, including `台` and `臺` variants, then groups observations by county. A county record can still render with partial data if a station lacks UV or humidity.

For each county:

- highest UV from observations within 45 minutes is preferred;
- daily maximum UV from the same Taiwan calendar day is used as a labeled, non-current fallback;
- time-valid observations provide temperature and humidity for an estimated heat index; missing humidity prevents low-risk recommendations;
- unexpired forecast periods within the next 36-hour start horizon are compared against heat index; the selected period is shown separately;
- known high UV or heat values can trigger a warning, but incomplete/non-current inputs never imply a low overall risk.

## Provenance and Freshness

- Demo values are artificial and have **no observation or forecast timestamps**. Reopening or refreshing never changes them into a current observation. Demo headlines, metrics, map, cards and advice say they are examples and cannot guide current outdoor decisions.
- Each observation must have a valid source date and time, no more than 45 minutes old and no more than five minutes ahead (clock tolerance). Zone-less CWA timestamps are interpreted in Taiwan time, independent of the viewer's timezone. Date-only values are not accepted as current observations.
- Expired, malformed, missing-time and implausibly future observations are excluded from current scores. A fresh county or UV-only station cannot make another county or heat measurement fresh.
- Daily UV values are limited to the same Taiwan calendar day and never set the current-observation update time. Date-only sources display a date without an invented time.
- Expired or untimed forecasts, including weather descriptions, are excluded. Forecast values remain distinct from current observations.
- A county's status is `demo`, `current`, `limited`, `stale`, or `missing`. `current` requires time-valid UV, temperature and humidity coverage. `dataQuality` separately describes available fields; it is not evidence of freshness.
- The nationwide notice reports the count with current complete observations instead of declaring all data fresh from the newest timestamp. `hasLimitedCoverage` also stays true in demo mode.
- Low-risk recommendations require current complete observation coverage and both risk dimensions at the lowest level. Demo, missing, partial, daily-only, stale and high-risk counties are excluded. Even a low modeled risk does not guarantee safe outdoor conditions.
- Retained payloads are reevaluated every 30 seconds and on focus/visibility changes, so an open page cannot indefinitely display expired observations as current. This reevaluation does not make additional API calls.

No official API credentials are required for the deterministic trust regression suite. This suite covers mocked source payloads and rendered component text; it is not a substitute for authenticated CWA integration testing or browser visual QA.
