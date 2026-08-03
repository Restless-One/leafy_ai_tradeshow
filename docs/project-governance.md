# Ctrl+Plant — Leafy AI Project Governance

Ctrl+Plant is a six-person multidisciplinary team and one of four student groups working on the Leafy AI project.

## Sources of truth

| Platform | Owns | Rule |
|---|---|---|
| GitHub | Source code, pull requests, CI, releases and code-adjacent documentation | Every branch and PR contains a Jira key. |
| Jira | Product backlog, Sprint scope, status, priority, owner and defects | Every Story has acceptance criteria and a cross-discipline reviewer. |
| Confluence | Requirements, meeting minutes, decisions, architecture, risks, tests and UAT | Material Teams decisions are recorded within one working day. |
| Microsoft Teams | Meetings, daily communication and urgent coordination | Chat history is not the sole record of a project decision. |

## Role slots and Scrum Master rotation

| Sprint | Scrum Master | Persistent ownership |
|---|---|---|
| 1 | Biology 1 — Domain Lead | Basil routine, domain rules, requirements and acceptance criteria |
| 2 | Cybersecurity 1 — Platform Lead | GitHub, identity, secrets, CI/CD, monitoring and deployment |
| 3 | AI 1 — Agent/Backend Lead | Agent contracts, APIs and Farm integration |
| 4 | Cybersecurity 2 — Safety Lead | Threat model, policy engine, approvals and audit |
| 5 | AI 2 — Vision/Data Lead | Vision task, data quality, trends and Dashboard analytics |
| 6 | Biology 2 — Experiment/UAT Lead | Calibration, experimental design, UAT and harvest outcomes |

Real names remain in the private team directory. The designated project owner is the approval point for requirements, material risk decisions and UAT.

## Sprint operating rhythm

1. Jira Planning: agree the Sprint Goal, capacity, acceptance criteria, owner and reviewer.
2. GitHub delivery: implement on short-lived Jira-linked branches and review through pull requests.
3. Evidence: attach CI, manual tests, screenshots, decisions and risk changes to Jira/Confluence.
4. Sprint Review: demonstrate completed outcomes and record stakeholder feedback in Confluence.
5. Retrospective: agree no more than three process improvements and add owners in Jira.
6. Personal reporting: every member updates their Compendium evidence before the Sprint closes.

## Release gates

- Sprint 2: technology ADR and Farm API Go/No-Go decision.
- Sprint 3: read-only data → AI → Dashboard demonstration by 9 August 2026.
- Sprint 4: safety and approval MVP plus Tender Documentation by 23 August 2026.
- Sprint 5: complete simulated/real integration path and Feature Freeze.
- Sprint 6: UAT, code freeze, release, handover and Compendium by 11 October 2026.
- Final: presentation and report by 18 October 2026, 11:59 pm AEDT.

## Change control

Architecture, scope and safety-policy changes require a Confluence ADR linked to a Jira Change Task. After Feature Freeze, new features are rejected unless they replace equal or greater effort already in scope and the project owner accepts the trade-off.
