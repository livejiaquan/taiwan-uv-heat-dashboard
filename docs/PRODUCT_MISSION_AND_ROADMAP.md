# Product Mission and Roadmap

Last reviewed: 2026-08-09 (Asia/Taipei)

## Launch Verdict

The current public build is **not ready for health or outdoor-activity decisions**.
When no CWA credential is available, it creates sample values and timestamps relative
to the browser session, then presents them beside "current" labels, rankings, and
actionable advice. A visible demo notice does not make those adjacent values safe.

Production must fail closed: unavailable official data means an unavailable state,
never realistic sample observations.

## Mission

> Help a person in Taiwan understand, within 10 seconds, the outdoor UV and heat
> risk for a chosen place **now or during a clearly named future period**, why that
> assessment applies, and what to do next, using traceable official data.

The product is not a national leaderboard, a generic weather map, or a substitute
for an official warning service. Its useful difference is a zero-install,
shareable, location-first answer that makes source, time, and uncertainty obvious.

## Primary Job to Be Done

Before going outdoors, a person wants to answer:

1. Which place and time period am I looking at?
2. Is the value observed, forecast, or an official alert?
3. Is UV or heat the more important concern?
4. How fresh and locally representative is the source?
5. What should I do now, especially if I or someone with me is vulnerable?

National comparison and exploration are secondary tasks.

## Evidence Behind the Decision

- The public GitHub Pages build was inspected on desktop and at 390 px on
  2026-08-09. At night it displayed a sample update as 12 minutes old, current UV
  values up to 12, 22/22 high-risk counties, and current outdoor advice.
- `O-A0005-001` is a once-daily maximum UV observation, not a current UV value.
  It must not fill gaps in a "current" field.
- `F-C0032-001` contains 12-hour forecast periods. Its maximum temperature must
  not be silently mixed with a current observation into one current heat score.
- CWA already offers broad weather, UV, WBGT, alert, location, and notification
  products. This product must compete on a faster and clearer decision flow, not
  on the amount of data.
- The current client-only `VITE_CWA_API_KEY` path exposes a quota-bearing
  credential and cannot be the durable production supply path.

Official references:

- [CWA 10-minute observations (`O-A0003-001`)](https://opendata.cwa.gov.tw/dataset/observation/O-A0003-001)
- [CWA daily maximum UV (`O-A0005-001`)](https://opendata.cwa.gov.tw/dataset/all/O-A0005-001)
- [CWA 36-hour county forecast (`F-C0032-001`)](https://opendata.cwa.gov.tw/dataset/forecast/F-C0032-001)
- [CWA township forecast package (`F-D0047-093`)](https://opendata.cwa.gov.tw/dataset/forecast/F-D0047-093)
- [CWA WBGT heat-injury forecast (`M-A0085-001`)](https://opendata.cwa.gov.tw/dataset/forecast/M-A0085-001)
- [CWA high-temperature alert CAP (`W-C0033-005`)](https://opendata.cwa.gov.tw/dataset/warning/W-C0033-005)
- [CWA high-temperature alert definitions](https://www.cwa.gov.tw/V8/C/P/Warning/W29.html)
- [Health Promotion Administration heat guidance](https://www.hpa.gov.tw/5020/20092/n)
- [Health Promotion Administration emergency response](https://www.hpa.gov.tw/Pages/Detail.aspx?nodeid=577&pid=10751&sid=10740)
- [CWA open-data terms](https://opendata.cwa.gov.tw/about/rules)

## Product Guardrails

These are launch blockers, not optional polish:

1. Production never renders sample values, sample rankings, or sample advice as
   current. Examples may exist only on a separately entered, unmistakable page.
2. Every displayed value identifies its semantic kind (`observation`, `forecast`,
   or `official alert`), source dataset, and relevant observation/valid time.
3. Missing or invalid timestamps are missing; the parser never substitutes "now".
4. Freshness is evaluated per stream and location. One recently updated county
   cannot make every county appear fresh.
5. Daily maximum UV and future temperature never substitute for current values.
6. Official high-temperature alerts, official WBGT forecasts, and any locally
   derived metric remain separate and are named explicitly.
7. Missing or stale data is never classified or worded as safe.
8. Advice is traceable to CWA/HPA, includes vulnerable groups, and identifies
   severe symptoms that require immediate cooling and 119.
9. A CWA credential stays server-side. Production needs caching, schema fixtures,
   source-health checks, and a reproducible deployment check.

## Success and Go/No-Go Gates

Public beta is a **go** only when:

- a first-time mobile user can identify place, data kind, valid time, main risk,
  and next action within 10 seconds;
- automated contracts cover missing key, total failure, partial payload, invalid
  timestamp, stale stream, night-time UV zero, sentinel values, schema drift, and
  forecast-window boundaries with zero false-current cases;
- a deployed production check verifies that the real server response is official,
  attributed, fresh enough for its stated meaning, and contains no sample data;
- keyboard, screen-reader landmarks, 390 px mobile, loading, empty, error, stale,
  and partial states have been inspected in a real browser;
- a production build, source-health check, custom-domain/HTTPS setup, metadata,
  and rollback procedure are reproducible.

Until then, deployment may expose an honest unavailable state, but not a decision
dashboard.

## Roadmap

### P0 — Trust safety (current iteration)

Outcome: the existing product cannot misrepresent sample, daily-maximum, or future
data as current.

- Remove runtime demo fallback and fail closed when official observations are
  unavailable or no credential is configured.
- Stop synthesizing observation timestamps.
- Remove daily maximum UV from the current UV path.
- Separate current observed heat estimation from 36-hour forecast temperature.
- Rename unsafe "relative safe" claims and make insufficient data explicit.
- Put vulnerable-group and severe-symptom guidance near the decision surface.
- Add regression tests and verify the no-credential production bundle/UI.

Hypothesis: an honest unavailable screen loses demo engagement but prevents the
highest-severity harm—false confidence from fabricated recency—and creates a safe
base for a real data service.

### P1 — Durable official data supply

Outcome: a production user receives cached, schema-validated official data without
receiving a CWA credential.

- Add a server-side aggregator and cache with source-specific freshness budgets.
- Normalize provenance fields: dataset, kind, observed/issued/valid/fetched times,
  station or representative point, geocode, freshness, and fallback reason.
- Integrate `M-A0085-001` WBGT forecast and `W-C0033-005` CAP alerts as separate
  official products. Use structured CAP fields rather than parsing prose.
- Use `F-D0047-093` or verified per-county feeds for township forecasts; treat UV
  forecast as daytime maximum, not current UV.
- Add captured official-schema fixtures, coverage monitoring, and last-known-good
  storage with explicit stale/expired behavior.

Credential ownership and an authenticated live contract check remain external
prerequisites. A credential will not be fabricated or committed.

### P2 — Location-first repeat value

Outcome: the first screen answers the primary job faster than navigating several
official surfaces.

- Default to a user-selected county/township; request geolocation only with clear
  consent and keep manual selection available.
- Create shareable location URLs.
- Show current observation, today's maximum UV forecast, WBGT risk period, and
  active official alert as distinct rows.
- Add a "next lower-risk period" only if the chosen official/declared model has
  enough temporal resolution to support it.
- Move nationwide map and rankings below the local decision.

### P3 — Production readiness and learning

Outcome: the service can run on a formal domain and improve from real evidence.

- Add availability, latency, freshness, schema, and coverage monitoring.
- Validate SEO title/description/social image, canonical URL, sitemap, robots,
  custom-domain DNS/HTTPS, privacy statement, accessibility, and performance.
- Measure location selection success, time-to-action comprehension, return use,
  share flow, unavailable-state rate, and false-current incidents.
- Run task-based comprehension tests with first-time users before broad promotion.

## P0 UX Brief

Audience: people in Taiwan making a near-term outdoor decision, including older
adults, caregivers, people with chronic conditions, outdoor workers, and people
planning activity for children.

Primary action: select a place and understand the current/today status. In this
iteration, if trusted observations are unavailable, the only responsible actions
are retrying or continuing to the named official sources.

Visual direction: retain the existing warm public-service palette and card system,
but use calm, direct unavailable language. Do not decorate uncertainty with
realistic numbers or risk colors.

## P0 UX States Matrix

| State | User sees | Allowed action | Safety rule |
| --- | --- | --- | --- |
| Loading | Official data is being checked | Wait | No cached/sample number flashes |
| Missing credential | Reliable live interpretation unavailable | Open official sources, retry | No dashboard, ranking, or advice from samples |
| All current observations fail | Reliable live interpretation unavailable plus reason | Open official sources, retry | Forecast alone cannot establish "now" |
| Partial live observations | Counties/fields with explicit unknowns | Inspect provenance, retry | Missing dimensions stay unknown |
| Stale observation | Age and warning beside affected value | Verify official source | Stale is never relabeled safe |
| Empty filtered view | No matching reliable records | Change filter | No fabricated fallback |
| Valid live data | Observed values and separately labeled forecast | Select county, refresh | Current and forecast never collapse |

## Out of Scope for P0

- Claiming 368-township coverage before authenticated payload verification.
- Inventing a new combined medical risk scale.
- Scraping CWA human-facing pages.
- Treating Open-Meteo or MOENV Lulin UV as an unmarked official fallback.
- Deploying a server/data architecture without credential ownership and monitoring.
