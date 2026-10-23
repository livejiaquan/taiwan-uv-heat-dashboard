# Architecture

A static React application, with GitHub Actions as the weather collection boundary. The same parsers are used in collection tests and the Actions collector; browser requests never carry CWA credentials.

```text
Official public CWA files (default) / Actions Secret CWA_API_KEY (optional API)
  → cwa.ts / forecast.ts (source requests and parsing)
  → snapshot.ts (normalized versioned JSON)
  → public/data/weather.json → GitHub Pages
  → load.ts (same-origin fetch and schema validation)
  → outlook.ts (current-time validity, county/hour values and metric origins)
  → Dashboard → guidance.ts (only supported conclusions)
```

`scripts/collect-weather.ts` writes the snapshot atomically only after validation. On a complete upstream outage the job fails before building/uploading, preserving the deployed artifact. `scripts/build-public.mjs` runs the build with a credential environment guard and scans its output. The key is supplied to collection only, never to the build step.

`useDashboardData.ts` retains the normalized snapshot on refresh failure and recomputes the outlook every minute. The original `fetchedAt` does not change when the browser recomputes it. Observations expire at 45 minutes and Taipei days roll over at midnight. Snapshots are never withheld for age: forecasts keep their own validity intervals, and `lib/freshness.ts` labels the data in the browser as live (≤ 90 min), aging (≤ 6 h), old (≤ 24 h) or older, measured from the newest station reading in the snapshot. The last snapshot that loaded is cached in localStorage so a failed request still shows labelled data. `HourPoint` records UV, apparent-temperature, and air-temperature provenance separately; observed source labels use the contributing station's timestamp rather than a county/global newest unrelated station.

Missing metrics remain `undefined`. Incomplete data cannot produce a positive outdoor verdict; known high risk still produces a warning. Daily gaps cannot be interpreted as a low-risk whole day, and exercise intervals use consecutive known lower-risk hours only. Estimated hourly UV is labelled as the site's estimate, not an official hourly forecast.

`?demo=1` explicitly selects synthetic data. Normal mode never falls back to demo on network failure. Without a key, the collector reads the official public file targets linked by data.gov.tw; a configured key selects the authenticated API. Both transports use the same parsers and validation. The app shell offers official information and a clearly labelled link to demo when no snapshot can be loaded.

## Verification

Vitest covers both source transports, parsing, normalized snapshot validation, missing/partial data, per-metric sources, expiry, future timestamps, midnight rollover, collection failures/redaction, and built-asset credential scanning. Browser checks cover rendered live/demo/unavailable/partial/expired states and responsive layout. CI runs deterministic fixture tests, lint, typecheck, and the guarded public build without network-dependent collection. Deployment repeats validation and collects actual weather before uploading a Pages artifact.
