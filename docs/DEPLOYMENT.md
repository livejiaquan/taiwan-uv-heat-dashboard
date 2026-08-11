# Deployment

The app builds as a static Vite site.

## Local Verification

```bash
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm run build:public
```

## GitHub Pages

The repository deploys to GitHub Pages with `.github/workflows/deploy.yml`.
The Vite base path is set to `/taiwan-uv-heat-dashboard/` for the project site URL:

```text
https://livejiaquan.github.io/taiwan-uv-heat-dashboard/
```

The workflow:

1. Installs dependencies with `npm ci`.
2. Runs tests, lint, and typecheck.
3. Runs `npm run build:public` with `PUBLIC_BASE_PATH=/taiwan-uv-heat-dashboard/`.
   The command validates that path, builds with an explicitly empty
   `VITE_CWA_API_KEY`, and scans the resulting artifact for credential-shaped
   tokens/placeholders and legacy demo markers.
4. Uploads the guarded `dist/` as the GitHub Pages artifact.
5. Deploys the artifact to the `github-pages` environment.

The Pages workflow explicitly sets `VITE_CWA_API_KEY` to an empty value. The
public-build guard therefore prevents a client credential from being bundled and
scans the actual artifact for known legacy demo/sample markers. The deployed site
shows an honest unavailable state and official deep links; it never creates sample
observations.

Do not configure a production CWA credential in a static Pages build. Any `VITE_` value is visible to browsers and cannot protect quota.

## Vercel / Netlify guarded root-host candidate

For a prospective root custom domain that intentionally serves the honest
unavailable state, do not set `VITE_CWA_API_KEY`. Use:

- install command: `npm ci`
- build command: `PUBLIC_BASE_PATH=/ npm run build:public`
- output directory: `dist`

`npm run build` and `VITE_CWA_API_KEY` may be used only for controlled local
development validation. Neither is an approved public deployment path.

This command validates root-relative asset paths only. The current canonical/OG
origin remains the GitHub Pages URL until a domain owner explicitly chooses and
verifies a new origin, DNS/HTTPS, metadata, and deployed browser smoke.

## Required Production Data Service

Before public beta:

1. Create a scheduled server/serverless aggregator that calls CWA and caches by source cadence.
2. Store the CWA key only in server-side secret storage.
3. Validate official payloads against captured schema fixtures and record coverage health.
4. Return normalized source, dataset, observation/issue/valid/fetch times, station/geocode, freshness, and fallback reason.
5. Add deployed checks for availability, freshness, schema/coverage, sample-data absence, and rollback.

GitHub Pages currently uses a repository base path. A custom domain still requires a verified root-relative build strategy, CNAME/DNS/HTTPS, canonical/OG metadata, and a production smoke test; it is not ready merely because `npm run build` succeeds.

`PUBLIC_BASE_PATH=/ npm run build:public` produces guarded root-relative assets
for a custom-domain candidate. The default remains
`/taiwan-uv-heat-dashboard/`; changing it requires a rendered preview and deployed
smoke test.
