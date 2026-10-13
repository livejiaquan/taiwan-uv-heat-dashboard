# Architecture

A static React application, with GitHub Actions as the weather collection boundary. The same parsers are used in collection tests and the Actions collector; browser requests never carry CWA credentials.

```text
Actions Secret CWA_API_KEY
  → cwa.ts / forecast.ts (source requests and parsing)
  → snapshot.ts (normalized versioned JSON)
  → public/data/weather.json → GitHub Pages
  → load.ts (same-origin fetch and schema validation)
  → outlook.ts (current-time validity, county/hour values and metric origins)
  → Dashboard → guidance.ts (only supported conclusions)
```

`scripts/collect-weather.ts` writes the snapshot atomically only after validation. On a complete upstream outage the job fails before building/uploading, preserving the deployed artifact. `scripts/build-public.mjs` runs the build with a credential environment guard and scans its output. The key is supplied to collection only, never to the build step.

`useDashboardData.ts` retains the normalized snapshot on refresh failure and recomputes the outlook every minute. The original `fetchedAt` does not change when the browser recomputes it. Observations expire at 45 minutes, the snapshot expires at two hours, and Taipei days roll over at midnight. `HourPoint` records UV, apparent-temperature, and air-temperature provenance separately; observed source labels use the contributing station's timestamp rather than a county/global newest unrelated station.

Missing metrics remain `undefined`. Incomplete data cannot produce a positive outdoor verdict; known high risk still produces a warning. Daily gaps cannot be interpreted as a low-risk whole day, and exercise intervals use consecutive known lower-risk hours only. Estimated hourly UV is labelled as the site's estimate, not an official hourly forecast.

`?demo=1` explicitly selects synthetic data. Normal mode never falls back to demo on missing credentials or network failure. The app shell offers official information and a clearly labelled link to demo when no snapshot can be loaded.

## Verification

Vitest covers source parsing, normalized snapshot validation, missing/partial data, per-metric sources, expiry, future timestamps, midnight rollover, collection failures/redaction, and built-asset credential scanning. Browser checks cover rendered demo/unavailable/partial/expired states and responsive layout. CI runs tests, lint, typecheck, no-key collection, and the guarded public build. Deployment repeats validation before uploading a Pages artifact.
