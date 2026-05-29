# Data Sources

The dashboard is designed around official Taiwan open data, mainly the Central Weather Administration (CWA) Open Data API.

## CWA Endpoints

| Dataset | Purpose | Fields Used |
| --- | --- | --- |
| `O-A0003-001` | 10-minute surface observations | station, county, observation time, temperature, humidity, UV index when available |
| `O-A0005-001` | daily maximum UV observations | station/county UV fallback when current UV coverage is incomplete |
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

- highest observed UV is preferred;
- daily maximum UV is used as fallback;
- hottest observation and humidity produce an estimated heat index;
- forecast max temperature is compared against heat index;
- the higher of UV risk and heat risk becomes the overall risk.

## Stale Data

Live data is marked stale when the newest county observation is older than 45 minutes. Demo mode is not marked stale because its timestamp is generated relative to the current browser session.
