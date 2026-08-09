# Deployment

The app builds as a static Vite site.

## Local Verification

```bash
npm ci
npm test
npm run lint
npm run typecheck
npm run build
```

## GitHub Pages

The repository deploys to GitHub Pages with `.github/workflows/deploy.yml`.
The Vite base path is set to `/taiwan-uv-heat-dashboard/` for the project site URL:

```text
https://livejiaquan.github.io/taiwan-uv-heat-dashboard/
```

The workflow:

1. Installs dependencies with `npm ci`.
2. Builds the static site with `npm run build`.
3. Uploads `dist/` as the GitHub Pages artifact.
4. Deploys the artifact to the `github-pages` environment.

The Pages workflow intentionally leaves `VITE_CWA_API_KEY` unset. The deployed site therefore shows an honest unavailable state and official deep links; it never creates sample observations.

Do not configure a production CWA credential in a static Pages build. Any `VITE_` value is visible to browsers and cannot protect quota.

## Vercel / Netlify

Use:

- install command: `npm ci`
- build command: `npm run build`
- output directory: `dist`

`VITE_CWA_API_KEY` may be used only for controlled development validation. It is not an approved production secret path.

## Required Production Data Service

Before public beta:

1. Create a scheduled server/serverless aggregator that calls CWA and caches by source cadence.
2. Store the CWA key only in server-side secret storage.
3. Validate official payloads against captured schema fixtures and record coverage health.
4. Return normalized source, dataset, observation/issue/valid/fetch times, station/geocode, freshness, and fallback reason.
5. Add deployed checks for availability, freshness, schema/coverage, sample-data absence, and rollback.

GitHub Pages currently uses a repository base path. A custom domain still requires a verified root-relative build strategy, CNAME/DNS/HTTPS, canonical/OG metadata, and a production smoke test; it is not ready merely because `npm run build` succeeds.

`VITE_BASE_PATH=/` can produce root-relative assets for a custom-domain candidate. The default remains `/taiwan-uv-heat-dashboard/`; changing it requires a rendered preview and deployed smoke test.
