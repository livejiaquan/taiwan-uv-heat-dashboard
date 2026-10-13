# Contributing

Use Node.js 22.14 or newer and `npm ci`. Open a focused pull request with the problem, resulting behavior, and validation performed.

Before submitting, run:

```sh
npm test
npm run lint
npm run typecheck
npm run collect:weather  # official public files; no private key required
npm run build:public
```

Check the rendered page at desktop and mobile widths for any UI change. Test missing fields, partial sources, stale measurements, snapshot expiry, and Taipei midnight rollover when changing data or guidance. Keep observed, forecast, estimated, demo, and unavailable data distinct. Do not turn missing values into zero or imply guaranteed safety.

Do not commit credentials, `.env` files, generated `public/data/weather.json`, or private screenshots. The fixture data in `src/lib/__fixtures__` is synthetic; never publish it as live weather. Upstream failures must preserve the existing deployment and its original timestamps.

Map regeneration uses the optional packages listed in `scripts/build-taiwan-map.mjs`; record package versions and source attribution when replacing the checked-in map. See `docs/DATA_SOURCES.md` for weather source attribution.
