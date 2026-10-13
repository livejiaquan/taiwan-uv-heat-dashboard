# GitHub Pages public-service hardening

Purpose: provide a public, open-source weather guide on GitHub Pages without exposing CWA credentials or presenting missing/stale data as safe.

1. Fix incomplete-data guidance. Verify missing UV, missing heat, night-time gaps, and incomplete daily coverage with regression tests.
2. Publish a versioned, normalized weather snapshot from GitHub Actions. Keep `CWA_API_KEY` in the collection step only; never pass credentials into Vite. Verify malformed/missing snapshots, redaction, failed collection, and public artifact scanning.
3. Rebuild the outlook from the retained snapshot every minute. Observations expire after 45 minutes; snapshots expire after two hours; forecast values retain their validity intervals. Verify per-metric provenance, county timestamps, clock changes, and Taipei midnight rollover.
4. Make demo mode explicit (`?demo=1`), add maintenance/security documents, update vulnerable dependencies, and document setup for forks.
5. Run tests, lint, typecheck, build, artifact scan, and browser checks for unavailable, demo, partial, expired, and forecast states. Prepare a reviewable change before public deployment.

Constraints: keep existing UI and parsers where possible; no new hosted backend, no generated weather values in ordinary public mode, no credential values in logs or artifacts. Actions scheduling is best effort, not real-time delivery. Default collection uses official public file targets linked by data.gov.tw, with a private API Secret as an optional mode. The owner delegated remaining setup and deployment; code is released under MIT with separate source notices.
