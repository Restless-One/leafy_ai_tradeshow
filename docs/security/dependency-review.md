# Dependency Security Review

- Review date: 17 July 2026
- Command: `npm audit` and `npm audit --omit=dev --audit-level=high`

Non-breaking fixes were applied, followed by compatible upgrades to Vite, the Cloudflare Vite plugin, Wrangler and Worker type definitions. The resulting audit has no Critical or High findings.

Six Moderate findings remain in transitive dependencies. The production audit identifies PostCSS through Next; the development audit additionally identifies esbuild paths used by build and migration tooling. npm currently proposes breaking or incorrect dependency changes for these findings, including a major Next downgrade and a Drizzle Kit downgrade, so `npm audit fix --force` was intentionally not used.

Controls:

- CI fails on new High or Critical production dependency findings.
- Development servers bind only for team development and must not be exposed to untrusted networks.
- Re-run the audit each Sprint and after framework upgrades.
- Reassess the remaining Moderate findings when compatible upstream releases are available.
