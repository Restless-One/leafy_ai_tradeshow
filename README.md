# Ctrl+Plant — Leafy AI Apple Tradeshow Demo v0.2

Leafy AI Apple Tradeshow v0.2 is a guided, deterministic demonstration build for presenting the real product journey at an event. It preserves the Apple-inspired command centre while adding a six-step walkthrough and an operator-only **Demo Backstage** for simulating backend input.

## Quick start

Requires Node.js 22.13 or newer.

```bash
git clone https://github.com/Restless-One/leafy_ai_tradeshow.git
cd leafy_ai_tradeshow
npm install
npm run dev
```

Open the local address printed in the terminal. Use **Start guided demo** for the six-step visitor walkthrough, or open **Backstage** to prepare a presenter-controlled sensor and AI-decision scenario. Refresh the page to restore the known demo state.

## Demo Backstage

Select **Backstage** in the top toolbar to prepare a visitor scenario without touching the real backend. The panel can:

- load healthy, rising-heat, EC-drift and paused-review scenes;
- inject or replace sensor readings and automation mode;
- add an AI decision task with actuator, target, value, initial status and risk;
- present the injected state in Command Center or AI Decisions;
- remove individual inputs or restore the trusted baseline in one step.

Injected tasks follow the visible product workflow: a pending task can be opened, reviewed, approved or rejected, and its status and audit event update immediately. Every input lives only in React memory and disappears on refresh. The component, state adapter and controls are exclusive to this tradeshow folder and are not intended for the production application.

## Tradeshow workflow

1. Read the reconciled farm state.
2. Inspect structured visual evidence.
3. Follow a typed AI proposal into policy review.
4. Make a human approval decision.
5. Verify the simulator-only safety boundary.
6. Confirm approval and execution in the audit trail.

All interactions run in memory. Approval, plan, alert, override and backstage controls never write to D1, call mutation APIs or reach physical farm hardware in this build. Refresh returns the full demo to the same known starting state; restarting only the guided walkthrough preserves any backstage scene prepared by the presenter.

## Apple design direction

- Calm, layered surfaces built from translucent navigation chrome and solid data cards.
- System typography with optical sizing, tighter display tracking and comfortable body leading.
- Immediate press feedback, spatially consistent drawers and material-style modal presentation.
- Responsive desktop, tablet and compact mobile navigation without changing product behavior.
- Dedicated fallbacks for reduced motion, reduced transparency and increased contrast.
- No new API, data, authentication, simulator or deployment behavior.

## Demonstration boundary

This release is a persistent simulator. It sends no command to physical farm hardware, uses demonstration-only policy limits, and labels replay camera evidence clearly. Physical integration must remain disabled until the Farm API, operating ranges, identity model and data-handling rules are approved.

## Included flows

- Command Center with farm score, sensor trends, AI proposal and crop-cycle status.
- Consolidated light-laboratory visual system with readable supporting type and
  consistent cards, controls, status treatments and focus states.
- Anchored metric-card trend bands that keep sensor charts visually connected to their values and target ranges.
- Three-layer digital twin with replay imagery, CV observations and device states.
- Low-risk simulated auto-execution, high-risk approval and policy-blocked examples.
- Editable D1-backed growing plan, alert acknowledgement and audited overrides.
- Decision lifecycle, CSV audit export, harvest history and yield forecast.
- Responsive desktop, tablet and mobile presentation.
- Accessible icon-only navigation, explicit empty decision lanes, 44px mobile
  controls and Escape-close support for menus, drawers and modal dialogs.
- Two Remotion-authored, pre-rendered motion assets for the Command Center and simulated canopy replay. They add no Remotion runtime code to the deployed browser bundle.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run typecheck` | Check TypeScript types. |
| `npm run lint` | Run ESLint. |
| `npm run test:unit` | Run the 13 unit and rendering tests. |
| `npm run build` | Create a production build. |
| `npm test` | Run unit tests and then build the application. |
| `npm run remotion:studio` | Open the editable motion compositions. |

## Motion assets

The editable compositions live in `remotion/`. Regenerate the lightweight, silent loops and their static fallbacks with:

```bash
npm run remotion:render:ambient
npm run remotion:render:replay
npm run remotion:still:ambient
npm run remotion:still:replay
```

The page plays ordinary MP4 files with static poster fallbacks. Motion is disabled automatically when `prefers-reduced-motion: reduce` is active.

The source immediately before this pass is preserved at `../backups/leafy_ai_sample_v0.2-pre-remotion-20260726.tar.gz`, with its SHA-256 checksum and restore notes alongside it.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
```

The physical Farm adapter is deliberately offline. Local writes use the explicit demo operator identity; deployed writes require the workspace-authenticated user header.

The three design-only reflection passes are documented in
[`docs/frontend-iteration-log.md`](docs/frontend-iteration-log.md).

The Apple-inspired redesign rationale and validation are documented in
[`docs/apple-design-notes.md`](docs/apple-design-notes.md).
