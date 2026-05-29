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

The current repository includes CI validation only. To publish with GitHub Pages, use one of these approaches:

1. Build locally or in CI with `npm run build`.
2. Deploy the `dist/` directory to GitHub Pages.
3. Leave `VITE_CWA_API_KEY` unset if demo mode is acceptable for public portfolio browsing.

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
