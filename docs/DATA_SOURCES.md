# Data Sources

The dashboard is designed around official Taiwan open data, mainly the Central Weather Administration (CWA) Open Data API.

## CWA Endpoints

| Dataset | Purpose | Fields Used |
| --- | --- | --- |
| `O-A0003-001` | 10-minute surface observations | station, county, observation time, temperature, humidity, UV index when available |
| `F-C0032-001` | 36-hour county forecast | maximum across all returned periods, valid window, weather description |

`O-A0005-001` is a daily maximum UV observation published about once per day. It is intentionally excluded from the current UV path and must never fill a "current" value.

## API Strategy

`src/lib/cwa.ts` loads `O-A0003-001` and `F-C0032-001` in parallel. Forecast may fail independently, but a validated current observation is required to render the dashboard. HTTP success with semantically empty observations is a failure. No key or no valid observation produces an unavailable state.

Sample records are not imported by the runtime and are not an availability fallback.

## Environment Variable

```bash
VITE_CWA_API_KEY=your-cwa-authorization-key
```

Because this is a Vite client app, `VITE_` variables are bundled into browser code. This route is for local contract validation only. Production requires a server-side cache/proxy and must not expose the CWA credential.

## County Aggregation

The parser normalizes county names, including `台` and `臺` variants, then groups observations by county. A county record can still render with partial data if a station lacks UV or humidity.

For each county:

- the highest valid, unexpired observed UV is used for UV classification;
- daily maximum UV is never used as current;
- the hottest valid observation is shown with its station and time;
- heat index is estimated only when one station has both temperature and humidity, and is marked non-official;
- the maximum across returned forecast periods retains its own valid window and never enters current ranking.

## Stale Data

Each county UV and temperature observation is marked stale after 45 minutes. Freshness is recalculated once per minute from the validated payload. Stale values may remain visible with a warning but do not enter current rankings or low-risk comparison. Missing, invalid, or more-than-five-minutes-future observation timestamps are rejected rather than replaced with the browser time.

`RelativeHumidity` is kept as the official percentage value (including a valid decimal percentage such as `0.8`); it is never assumed to be a 0–1 fraction.

## Planned Official Streams

- `M-A0085-001`: official township WBGT heat-injury forecast and upstream warning level.
- `W-C0033-005`: official high-temperature CAP alert; use structured severity, color, criteria, onset, expiry, and area geocode.
- `F-D0047-093` or verified county feeds: township forecasts; forecast UVI is a daytime maximum, not current UV.

These sources require authenticated live contract verification before integration.
