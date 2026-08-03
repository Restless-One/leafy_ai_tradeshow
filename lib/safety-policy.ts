import type {
  ProposedAction,
  RiskLevel,
  SensorReading,
  ValidationResult,
} from "./domain";

export const POLICY_VERSION = "leafy-demo-2026.2";
const MAX_SENSOR_AGE_MS = 15 * 60 * 1000;

export type ActionCandidate = Pick<
  ProposedAction,
  "actuator" | "command" | "target" | "value" | "unit"
>;

type ActuatorRule = {
  min: number;
  max: number;
  unit: string;
  risk: RiskLevel;
  approvalRequired: boolean;
};

// Demonstration limits only. They must be replaced by project-owner-approved
// farm limits before a real actuator adapter can be enabled.
const DEMO_RULES: Record<ActionCandidate["actuator"], ActuatorRule> = {
  light: { min: 1, max: 720, unit: "minutes", risk: "low", approvalRequired: false },
  fan: { min: 1, max: 180, unit: "minutes", risk: "low", approvalRequired: false },
  irrigation_pump: {
    min: 1,
    max: 120,
    unit: "seconds",
    risk: "high",
    approvalRequired: true,
  },
  dosing_pump: {
    min: 0.1,
    max: 5,
    unit: "millilitres",
    risk: "high",
    approvalRequired: true,
  },
};

export function validateProposedAction(
  action: ActionCandidate,
  sensorReadings: SensorReading[],
  now = new Date(),
): ValidationResult {
  const checkedAt = now.toISOString();
  const rule = DEMO_RULES[action.actuator];
  const reasons: string[] = [];

  if (!rule) {
    return {
      allowed: false,
      approvalRequired: true,
      risk: "high",
      policyVersion: POLICY_VERSION,
      reasons: ["The requested actuator is not covered by the active policy."],
      checkedAt,
    };
  }

  if (action.unit !== rule.unit) {
    reasons.push(`Expected unit ${rule.unit}; received ${action.unit}.`);
  }
  if (!Number.isFinite(action.value) || action.value < rule.min || action.value > rule.max) {
    reasons.push(`Value must be between ${rule.min} and ${rule.max} ${rule.unit}.`);
  }

  const staleSensors = sensorReadings.filter(
    (reading) => now.getTime() - new Date(reading.recordedAt).getTime() > MAX_SENSOR_AGE_MS,
  );
  if (sensorReadings.length === 0) {
    reasons.push("No sensor evidence was supplied.");
  } else if (staleSensors.length > 0) {
    reasons.push("One or more sensor readings are older than 15 minutes.");
  }

  const hasBlockingReason = reasons.length > 0;

  if (rule.approvalRequired) {
    reasons.push("Pump operations require explicit human approval.");
  } else if (!hasBlockingReason) {
    reasons.push("The request is inside the low-risk demonstration policy.");
  }

  return {
    allowed: !hasBlockingReason,
    approvalRequired: rule.approvalRequired,
    risk: rule.risk,
    policyVersion: POLICY_VERSION,
    reasons,
    checkedAt,
  };
}

export function canExecuteAction(action: ProposedAction): boolean {
  if (!action.validation.allowed) return false;
  if (action.validation.approvalRequired) return action.status === "approved";
  return action.status === "approved" || action.status === "pending_approval";
}
