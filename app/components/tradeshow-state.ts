import type {
  ActionLifecycleEvent,
  ActionStatus,
  AutomationMode,
  DashboardSnapshot,
  HealthStatus,
  ProposedAction,
  RiskLevel,
  SensorKind,
} from "@/lib/domain";

export type BackstagePreset = "baseline" | "heat_spike" | "ec_drift" | "paused_review";

export interface BackstageTaskDraft {
  title: string;
  summary: string;
  actuator: ProposedAction["actuator"];
  target: string;
  value: number;
  unit: string;
  status: Extract<ActionStatus, "pending_approval" | "executed" | "blocked">;
  risk: RiskLevel;
}

export type BackstageTask = Omit<BackstageTaskDraft, "status"> & {
  id: string;
  createdAt: string;
  status: ActionStatus;
};

export interface SensorOverride {
  kind: SensorKind;
  value: number;
  status: HealthStatus;
  trend: number;
  recordedAt: string;
}

export interface BackstageState {
  tasks: BackstageTask[];
  sensorOverrides: SensorOverride[];
  automationMode: AutomationMode | null;
  sceneLabel: string | null;
}

export function createEmptyBackstageState(): BackstageState {
  return { tasks: [], sensorOverrides: [], automationMode: null, sceneLabel: null };
}

export function createBackstageTask(
  draft: BackstageTaskDraft,
  metadata: { id: string; createdAt: string },
): BackstageTask {
  return {
    ...draft,
    title: draft.title.trim(),
    summary: draft.summary.trim(),
    target: draft.target.trim(),
    unit: draft.unit.trim(),
    value: Number(draft.value),
    ...metadata,
  };
}

const SENSOR_LABELS: Record<SensorKind, string> = {
  ph: "pH",
  ec: "EC",
  solution_temperature: "Solution temperature",
  air_temperature: "Air temperature",
};

function commandForActuator(actuator: ProposedAction["actuator"]) {
  if (actuator === "dosing_pump") return "dose";
  if (actuator === "light") return "set_intensity";
  return "run_for";
}

function lifecycleForTask(task: BackstageTask): ActionLifecycleEvent[] {
  const common: ActionLifecycleEvent[] = [
    { state: "proposed", label: "Task received from demo input", at: task.createdAt },
    { state: "schema_validated", label: "Backstage payload accepted", at: task.createdAt },
  ];

  if (task.status === "blocked") {
    return [...common, { state: "blocked", label: "Demo policy blocked the task", at: task.createdAt }];
  }
  if (task.status === "rejected") {
    return [
      ...common,
      { state: "safety_validated", label: "Task routed to human review", at: task.createdAt },
      { state: "rejected", label: "Demo operator rejected the task", at: task.createdAt },
    ];
  }
  if (task.status === "executed") {
    return [
      ...common,
      { state: "safety_validated", label: "Demo policy accepted the task", at: task.createdAt },
      { state: "executing", label: "Released to farm simulator", at: task.createdAt },
      { state: "executed", label: "Simulator outcome confirmed", at: task.createdAt },
    ];
  }
  return [
    ...common,
    { state: "safety_validated", label: `${task.risk} risk classification confirmed`, at: task.createdAt },
    { state: "approval_pending", label: "Waiting for human approval", at: task.createdAt },
  ];
}

function snapshotTask(task: BackstageTask) {
  const recommendationId = `${task.id}-recommendation`;
  const approvalRequired = task.status === "pending_approval" || task.status === "rejected";
  const allowed = task.status !== "blocked";
  return {
    recommendation: {
      id: recommendationId,
      title: task.title,
      summary: task.summary,
      explanation: `${task.summary} This synthetic proposal was injected from the tradeshow backstage and exists only in browser memory.`,
      evidence: [
        "Synthetic tradeshow input",
        `${task.target.replaceAll("_", " ")} · ${task.value} ${task.unit}`,
        `${task.risk} risk selected by demo operator`,
      ],
      confidence: .88,
      risk: task.risk,
      createdAt: task.createdAt,
    },
    action: {
      id: task.id,
      recommendationId,
      actuator: task.actuator,
      command: commandForActuator(task.actuator),
      target: task.target,
      value: task.value,
      unit: task.unit,
      rationale: task.summary,
      validation: {
        allowed,
        approvalRequired,
        risk: task.risk,
        policyVersion: "tradeshow-backstage-0.2",
        reasons: [
          "Synthetic input is constrained to the in-browser farm simulator.",
          allowed ? "Payload passed the demonstration schema." : "Operator selected a policy-blocked outcome.",
          approvalRequired ? "Human review is required before simulated execution." : "No physical command can be emitted from this build.",
        ],
        checkedAt: task.createdAt,
      },
      status: task.status,
      createdAt: task.createdAt,
      version: 1,
      expiresAt: "2026-07-26T04:30:00.000Z",
      suggestedRisk: task.risk,
      authoritativeRisk: task.risk,
      lifecycle: lifecycleForTask(task),
      ...(task.status === "executed" || task.status === "rejected" ? {
        decidedBy: "Tradeshow Operator",
        decidedAt: task.createdAt,
        decisionComment: task.status === "executed" ? "Approved in the browser-only demo." : "Rejected in the browser-only demo.",
      } : {}),
    } satisfies ProposedAction,
  };
}

export function activeBackstageInputCount(state: BackstageState) {
  return state.tasks.length + state.sensorOverrides.length + (state.automationMode ? 1 : 0);
}

export function applyBackstageInputs(snapshot: DashboardSnapshot, state: BackstageState): DashboardSnapshot {
  if (activeBackstageInputCount(state) === 0) return snapshot;

  const sensors = snapshot.sensors.map((sensor) => {
    const override = state.sensorOverrides.find((item) => item.kind === sensor.kind);
    if (!override) return sensor;
    return {
      ...sensor,
      value: override.value,
      status: override.status,
      trend: override.trend,
      recordedAt: override.recordedAt,
      sparkline: [...sensor.sparkline.slice(1), override.value],
    };
  });
  const injected = state.tasks.map(snapshotTask);
  const criticalSensors = sensors.filter((sensor) => sensor.status === "critical");
  const sensorEvents = state.sensorOverrides.map((override) => ({
    id: `backstage-sensor-${override.kind}`,
    eventType: "farm.snapshot",
    actor: "Demo Backstage",
    summary: `Injected ${SENSOR_LABELS[override.kind]} state: ${override.value} (${override.status})`,
    createdAt: override.recordedAt,
  }));
  const taskEvents = state.tasks.map((task) => ({
    id: `${task.id}-audit`,
    eventType: task.status === "executed" ? "simulator.executed" : task.status === "blocked" ? "policy.blocked" : task.status === "rejected" ? "approval.rejected" : "action.approval_pending",
    actor: task.status === "executed" ? "Farm Simulator" : task.status === "rejected" ? "Tradeshow Operator" : "Demo Backstage",
    summary: `${task.title} · ${task.status.replaceAll("_", " ")}`,
    createdAt: task.createdAt,
  }));
  const modeEvents = state.automationMode ? [{
    id: "backstage-mode-audit",
    eventType: "override.demo_state",
    actor: "Demo Backstage",
    summary: `Injected automation mode: ${state.automationMode.replaceAll("_", " ")}`,
    createdAt: "2026-07-26T00:24:00.000Z",
  }] : [];
  const criticalAlerts = criticalSensors.map((sensor) => ({
    id: `backstage-alert-${sensor.kind}`,
    severity: "critical" as const,
    title: `${sensor.label} outside the demo envelope`,
    detail: `The backstage injected ${sensor.value} ${sensor.unit}. Review the synthetic state before continuing the demo.`,
    source: "Demo Backstage",
    status: "active" as const,
    createdAt: sensor.recordedAt,
  }));

  return {
    ...snapshot,
    automationMode: state.automationMode ?? snapshot.automationMode,
    systemStatus: criticalSensors.length || state.automationMode === "emergency_stop" ? "degraded" : snapshot.systemStatus,
    lastUpdatedAt: state.sensorOverrides.at(-1)?.recordedAt ?? snapshot.lastUpdatedAt,
    sensors,
    recommendations: [...injected.map((item) => item.recommendation), ...snapshot.recommendations],
    actions: [...injected.map((item) => item.action), ...snapshot.actions],
    alerts: [...criticalAlerts, ...snapshot.alerts],
    auditEvents: [...taskEvents, ...sensorEvents, ...modeEvents, ...snapshot.auditEvents],
  };
}

export function createBackstagePreset(preset: BackstagePreset): BackstageState {
  const at = "2026-07-26T00:24:00.000Z";
  if (preset === "baseline") return createEmptyBackstageState();

  if (preset === "heat_spike") {
    return {
      sceneLabel: "Rising heat",
      automationMode: "running",
      sensorOverrides: [{ kind: "air_temperature", value: 29.1, status: "critical", trend: 3.4, recordedAt: at }],
      tasks: [createBackstageTask({
        title: "Stabilise Layer 3 temperature",
        summary: "Run the Layer 3 fan for 30 minutes and request a fresh sensor batch.",
        actuator: "fan",
        target: "layer_3",
        value: 30,
        unit: "minutes",
        status: "pending_approval",
        risk: "medium",
      }, { id: "backstage-task-heat", createdAt: at })],
    };
  }

  if (preset === "ec_drift") {
    return {
      sceneLabel: "EC drift",
      automationMode: "running",
      sensorOverrides: [{ kind: "ec", value: 1.05, status: "critical", trend: -.42, recordedAt: at }],
      tasks: [createBackstageTask({
        title: "Correct severe EC drift",
        summary: "Dose 1.6 mL nutrient concentrate, then wait for a new EC reading.",
        actuator: "dosing_pump",
        target: "shared_reservoir",
        value: 1.6,
        unit: "millilitres",
        status: "pending_approval",
        risk: "high",
      }, { id: "backstage-task-ec", createdAt: at })],
    };
  }

  return {
    sceneLabel: "Paused review",
    automationMode: "paused",
    sensorOverrides: [{ kind: "solution_temperature", value: 24.7, status: "attention", trend: 1.1, recordedAt: at }],
    tasks: [],
  };
}
