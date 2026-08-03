# ADR-0001: Sprint 2 Technology Selection

- Status: Proposed feasibility baseline
- Owner: Cybersecurity 1 — Platform Lead
- Review deadline: End of Sprint 2

## Context

The team needs a browser Dashboard, persistent relational records, typed APIs, an AI/Vision adapter boundary, deterministic safety rules, automated tests and a deployment path that can be handed over within one semester. The Farm API, external-model policy and final hosting environment are not yet confirmed.

## Feasibility baseline implemented

- React and TypeScript UI on the vinext/Next application model.
- Cloudflare Worker-compatible server routes.
- D1/SQLite relational persistence with Drizzle schema and migrations.
- Provider-neutral AI, vision, Farm and actuator boundaries.
- GitHub Actions for lint, unit tests, render checks and builds.

This is a working spike, not a final approval to connect hardware or send farm data to an external model.

## Sprint 2 decision criteria

Score the baseline and any serious alternative against team proficiency, Farm API compatibility, campus/local deployment, security, automated testing, model licensing, data residency, CI support and handover cost. Record the scores and select one stack in this ADR. Any change must include a migration estimate and preserve the domain contracts and safety-policy tests.

## Safety consequence

The actuator adapter remains simulator-only. Enabling a physical adapter requires approved operating ranges, authentication details, threat-model updates, Biology and Cybersecurity reviews, failure tests and project-owner acceptance.
