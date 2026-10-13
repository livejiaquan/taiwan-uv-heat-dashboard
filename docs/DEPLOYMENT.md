# GitHub Pages deployment

The public site is a static Vite build. GitHub Actions collects and normalizes CWA data into `public/data/weather.json`, then builds and deploys Pages. The browser reads only the same-origin snapshot. No separate paid backend is required.

## Owner setup

1. In Settings → Pages, select **GitHub Actions** as the build source.
2. Obtain a CWA open-data authorization key from https://opendata.cwa.gov.tw/.
3. In Settings → Secrets and variables → Actions, add a repository Secret named **CWA_API_KEY**. Enter the value directly in GitHub; never put it in an issue, PR, `VITE_` variable, or committed file.
4. Run **Deploy to GitHub Pages** from the Actions tab on `main`.
5. Confirm the collection/build/deploy jobs succeed, open the deployed page, and verify snapshot time, selected-county source labels, and missing-data states. A green workflow alone is not data acceptance.

A missing Secret produces an honest unavailable snapshot so forks can build without credentials. A configured key with no usable current weather causes collection to fail and stops deployment; the previously deployed version remains available and expires according to its original timestamps. Partial working sources are retained, with source failures shown on the page.

## Refresh and expiry

- Actions requests an update at minutes 7, 27, and 47 of every hour (UTC).
- GitHub schedules are best effort: jobs may be delayed or skipped. Scheduled workflows in inactive public repositories may be disabled; check the Actions tab if updates stop.
- The browser re-fetches every ten minutes while visible and when the tab becomes visible again.
- The outlook is recalculated every minute from the original snapshot: station readings expire after **45 minutes**; all numerical data is suppressed when a snapshot is older than **two hours** or its time is invalid/future by more than five minutes.
- Forecasts are used only within their parsed valid time intervals. Taipei today/tomorrow are rebuilt across midnight.

This is a periodically refreshed guide, not a real-time warning service. The small UI clock and network/schedule latency do not guarantee that a threshold changes exactly on the second. Official weather warnings remain authoritative.

References: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule and https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages.

## Forks and repository names

The deployment workflow uses `main`, the `github-pages` environment, and `/taiwan-uv-heat-dashboard/` as the Vite base path. If a fork uses another branch or repo name, update `.github/workflows/deploy.yml`, `ci.yml`, and `vite.config.ts`. Also update canonical/social URLs in `index.html`. Forks must enable Actions/Pages and configure their own Secret; upstream Secrets are not copied.

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
