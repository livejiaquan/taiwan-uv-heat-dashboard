# GitHub Pages deployment

The public site is a static Vite build. GitHub Actions collects and normalizes official public CWA files into `public/data/weather.json`, then builds and deploys Pages. The browser reads only the same-origin snapshot. No private key, registration, or separate paid backend is required by default.

## Owner setup

1. In Settings → Pages, select **GitHub Actions** as the build source.
2. Run **Deploy to GitHub Pages** from the Actions tab on `main` (a push to `main` also deploys).
3. Confirm the collection/build/deploy jobs succeed, open the deployed page, and verify snapshot time, selected-county source labels, and missing-data states. A green workflow alone is not data acceptance.

Default collection downloads the official public file targets of the JSON links on data.gov.tw datasets [9178](https://data.gov.tw/dataset/9178), [9039](https://data.gov.tw/dataset/9039), [9307](https://data.gov.tw/dataset/9307), and [9308](https://data.gov.tw/dataset/9308). Only four requests run per scheduled collection; browsers do not independently request CWA files. These public download paths may change; source failures stop deployment rather than inventing weather.

Optional authenticated API mode: obtain a key from https://opendata.cwa.gov.tw/ and add repository Secret **CWA_API_KEY** in Settings → Secrets and variables → Actions. Enter it directly in GitHub; never put it in an issue, PR, `VITE_` variable, or committed file. A configured Secret selects the API and adds the 36-hour fallback dataset. For bulk usage, follow the provider's membership guidance rather than increasing public-download frequency.

In either mode, no usable current weather causes collection to fail and stops deployment; the previously deployed version remains available and expires according to its original timestamps. Partial working sources are retained, with source failures shown on the page.

## Refresh and expiry

- Actions requests an update at minutes 7, 27, and 47 of every hour (UTC).
- GitHub schedules are best effort: jobs may be delayed or skipped. Scheduled workflows in inactive public repositories may be disabled; check the Actions tab if updates stop.
- The browser re-fetches every ten minutes while visible and when the tab becomes visible again.
- The outlook is recalculated every minute from the original snapshot: station readings expire after **45 minutes**; all numerical data is suppressed when a snapshot is older than **two hours** or its time is invalid/future by more than five minutes.
- Forecasts are used only within their parsed valid time intervals. Taipei today/tomorrow are rebuilt across midnight.

This is a periodically refreshed guide, not a real-time warning service. The small UI clock and network/schedule latency do not guarantee that a threshold changes exactly on the second. Official weather warnings remain authoritative.

References: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule and https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages.

## Forks and repository names

The deployment workflow uses `main`, the `github-pages` environment, and `/taiwan-uv-heat-dashboard/` as the Vite base path. If a fork uses another branch or repo name, update `.github/workflows/deploy.yml`, `ci.yml`, and `vite.config.ts`. Also update canonical/social URLs in `index.html`. Forks must enable Actions/Pages; public collection works without a Secret. For API mode configure a fork-specific Secret; upstream Secrets are not copied.

## Local verification

Use Node.js 22.14 or newer:

```sh
npm ci
cp .env.example .env.local  # optional: fill CWA_API_KEY locally
npm run collect:weather
npm run dev
```

Open `/taiwan-uv-heat-dashboard/` for actual data, or explicitly append `?demo=1` to explore synthetic weather. Collection reads `.env.local`; Vite does not receive a credential-prefixed variable.

```sh
npm test
npm run lint
npm run typecheck
npm run collect:weather
npm run build:public
npm run preview
```

The public build rejects keys in its process environment and recursively scans `dist/` for credential markers and direct CWA API calls. The collector publishes only normalized allowed fields and refuses content containing its key. Snapshot schema version 1 is validated before the browser uses it. Generated snapshots are ignored by Git.

If a key was historically deployed in a client bundle, rotate it at CWA; changing this workflow cannot revoke historical downloads.
