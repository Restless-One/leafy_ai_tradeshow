# Contributing to Leafy AI

## Before starting work

1. Select an assigned Jira issue with acceptance criteria and a named cross-discipline reviewer.
2. Confirm that requirements, architecture and safety decisions are linked from Confluence.
3. Create a short-lived branch from `main` named `<jira-key>-<short-description>`, for example `LEAFY-23-fan-policy`.

## Pull requests

- Do not push feature work directly to `main`.
- Include the Jira key in the branch, commits and pull-request title.
- Complete the pull-request template and link evidence.
- Obtain at least one cross-discipline approval.
- Changes to authentication, safety rules or real actuator adapters require a Cybersecurity reviewer.
- Changes to growing rules or recommendation logic require a Biology reviewer.
- Merge only after CI passes and Critical/High findings are resolved.

## Definition of Done

- Jira acceptance criteria are met.
- Tests cover the changed behaviour and pass in CI.
- Security and domain reviews are complete where required.
- GitHub, Jira and Confluence links are mutually traceable.
- User, API, architecture or maintenance documentation is updated.
- The change can be demonstrated or has reproducible evidence.
- The owner has recorded evidence for their Personal Reporting Compendium.

## Safety rule

LLM or vision output must never be sent directly to hardware. Every proposed action passes through a deterministic policy and an actuator adapter. Pump operations remain human-approved and simulator-only until a project-owner-approved change explicitly replaces that restriction.
