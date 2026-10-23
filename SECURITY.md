# Security policy

Security fixes target the current `main` branch. Report credential exposure or other sensitive findings using GitHub's private vulnerability reporting when enabled. If it is unavailable, open an issue requesting a private contact channel; do not post credentials, private logs, or exploit details in a public issue.

Default collection uses official public CWA files and needs no private credentials. For optional API mode, `CWA_API_KEY` belongs in an Actions repository Secret and is available only to the weather collection step. Never put it in any `VITE_` variable. Public snapshots contain normalized weather fields, not raw requests or credentials. The build rejects credential-bearing environments and scans public output.

If a key was included in any historical frontend bundle, revoke it at the provider and issue a replacement; removing it from the current source does not revoke copies already downloaded. Do not paste key values into issues or pull requests.

Monitor scheduled deployment failures in the Actions tab. Measurements expire after 45 minutes. When collection fails or scheduled workflows stop, the last snapshot stays visible and is labelled with its data time and age. This application does not provide official alerts or guarantee safe outdoor activity.
