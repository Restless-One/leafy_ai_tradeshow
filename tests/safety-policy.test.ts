import assert from "node:assert/strict";
import test from "node:test";
import { DEMO_SENSORS } from "../lib/demo-data";
import { FarmSimulatorAdapter } from "../lib/adapters";
import { canExecuteAction, validateProposedAction } from "../lib/safety-policy";
import type { ProposedAction } from "../lib/domain";

const now = new Date("2026-07-26T00:20:00.000Z");

test("allows a low-risk fan command inside the demonstration limits", () => {
  const result = validateProposedAction(
    { actuator: "fan", command: "run_for", target: "layer_3", value: 20, unit: "minutes" },
    DEMO_SENSORS,
    now,
  );
  assert.equal(result.allowed, true);
  assert.equal(result.approvalRequired, false);
  assert.equal(result.risk, "low");
});

test("requires human approval for every dosing command", () => {
  const result = validateProposedAction(
    { actuator: "dosing_pump", command: "dose", target: "reservoir", value: 1, unit: "millilitres" },
    DEMO_SENSORS,
    now,
  );
  assert.equal(result.allowed, true);
  assert.equal(result.approvalRequired, true);
  assert.equal(result.risk, "high");
});

test("blocks commands with missing evidence, stale evidence, or invalid units", () => {
  const noEvidence = validateProposedAction(
    { actuator: "fan", command: "run_for", target: "layer_1", value: 20, unit: "minutes" },
    [],
    now,
  );
  const stale = validateProposedAction(
    { actuator: "fan", command: "run_for", target: "layer_1", value: 20, unit: "minutes" },
    DEMO_SENSORS,
    new Date("2026-07-26T01:20:00.000Z"),
  );
  const wrongUnit = validateProposedAction(
    { actuator: "fan", command: "run_for", target: "layer_1", value: 20, unit: "seconds" },
    DEMO_SENSORS,
    now,
  );
  assert.equal(noEvidence.allowed, false);
  assert.equal(stale.allowed, false);
  assert.equal(wrongUnit.allowed, false);
});

test("does not execute a policy-blocked or unapproved high-risk action", () => {
  const baseAction: ProposedAction = {
    id: "action-test",
    recommendationId: "rec-test",
    actuator: "dosing_pump",
    command: "dose",
    target: "reservoir",
    value: 1,
    unit: "millilitres",
    rationale: "Test",
    validation: validateProposedAction(
      { actuator: "dosing_pump", command: "dose", target: "reservoir", value: 1, unit: "millilitres" },
      DEMO_SENSORS,
      now,
    ),
    status: "pending_approval",
    createdAt: now.toISOString(),
    version: 1,
    expiresAt: "2026-07-26T05:20:00.000Z",
    suggestedRisk: "high",
    authoritativeRisk: "high",
    lifecycle: [],
  };
  assert.equal(canExecuteAction(baseAction), false);
  assert.equal(canExecuteAction({ ...baseAction, status: "approved" }), true);
  assert.equal(
    canExecuteAction({ ...baseAction, status: "approved", validation: { ...baseAction.validation, allowed: false } }),
    false,
  );
});

test("farm simulator executes an approved action without claiming physical control", async () => {
  const validation = validateProposedAction(
    { actuator: "fan", command: "run_for", target: "layer_3", value: 20, unit: "minutes" },
    DEMO_SENSORS,
    now,
  );
  const result = await new FarmSimulatorAdapter().execute({
    id: "action-simulator-test",
    recommendationId: "rec-test",
    actuator: "fan",
    command: "run_for",
    target: "layer_3",
    value: 20,
    unit: "minutes",
    rationale: "Test safe simulator execution",
    validation,
    status: "approved",
    createdAt: now.toISOString(),
    version: 1,
    expiresAt: "2026-07-26T05:20:00.000Z",
    suggestedRisk: "low",
    authoritativeRisk: "low",
    lifecycle: [],
  });
  assert.equal(result.outcome, "completed");
  assert.match(result.detail, /no physical hardware command/i);
});
