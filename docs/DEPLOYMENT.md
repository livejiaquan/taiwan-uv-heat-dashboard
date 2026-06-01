# Deployment

The app builds as a static Vite site.

## Local Verification

```bash
npm ci
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

Leave `VITE_CWA_API_KEY` unset if demo mode is acceptable for public portfolio browsing.

If live data is required on GitHub Pages, configure the build with `VITE_CWA_API_KEY`. Remember that the key is visible to browsers in a static frontend.

## Vercel / Netlify

Use:

- install command: `npm ci`
- build command: `npm run build`
- output directory: `dist`

Set `VITE_CWA_API_KEY` as a project environment variable only if live CWA API access is needed.

## Production Proxy Option

For stronger key control:

1. Create a serverless endpoint that calls CWA.
2. Store the CWA key only on the serverless platform.
3. Replace `fetchCwaJson` in `src/lib/cwa.ts` with calls to that proxy.
4. Keep the frontend normalization and risk model unchanged.
