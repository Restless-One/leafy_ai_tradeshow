# Testing and Acceptance Plan

## Automated layers

- Domain and safety-policy unit tests: limits, stale/missing evidence, units, risk and approval gates.
- API integration tests: database seed/read, authentication, approval conflicts, blocked actions and audit creation.
- UI render checks: core farm state, recommendation, policy and simulation-mode warning.
- CI checks: lint, unit tests, deployment build and rendered output.

## Required failure scenarios

- Missing, stale, malformed or out-of-range sensor data.
- Invalid or non-schema AI output.
- Model or Farm API timeout and disconnection.
- Attempted approval without authenticated identity.
- Duplicate approval or execution attempt.
- Pump request without human approval.
- Command outside the approved deterministic policy.
- Audit/database failure and safe recovery.

## AI and vision evaluation

Biology members create a labelled, versioned evaluation set. Report task definition, provenance, expected result, model/provider version, accuracy or agreement measure, confidence calibration, unsafe recommendation rate and reviewed failure examples. The first vision task is canopy-coverage estimation; additional health classes remain out of scope until this task is accepted.

## UAT exit criteria

- Project owner can follow the full monitor → recommendation → validation → approval → simulated execution → audit flow.
- No Critical or High security defect remains open.
- No model output bypasses deterministic validation.
- Every approval and execution is attributable and auditable.
- Installation, configuration, user, maintenance and recovery instructions are reproducible.
- Known limitations and unfinished work are explicit in the release notes.
