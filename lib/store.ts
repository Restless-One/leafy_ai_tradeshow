import { getD1 } from "@/db";
import { FarmSimulatorAdapter } from "./adapters";
import { DEMO_SNAPSHOT } from "./demo-data";
import { validateProposedAction } from "./safety-policy";
import type {
  ActionLifecycleEvent,
  ActionStatus,
  AlertAcknowledgeRequest,
  AIRecommendation,
  ApprovalRequest,
  AuditEvent,
  AutomationMode,
  DashboardSnapshot,
  FarmAlert,
  GrowingPlanUpdateRequest,
  HarvestOutcome,
  HealthStatus,
  ImageObservation,
  OverrideRequest,
  ProposedAction,
  RiskLevel,
  ScheduleEvent,
  SensorKind,
  SensorReading,
  ValidationResult,
} from "./domain";

type RecordRow = Record<string, string | number | null>;

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS sensor_readings (
    id TEXT PRIMARY KEY, kind TEXT NOT NULL, label TEXT NOT NULL, value REAL NOT NULL,
    unit TEXT NOT NULL, status TEXT NOT NULL, trend REAL NOT NULL, sparkline_json TEXT NOT NULL,
    safe_min REAL NOT NULL, safe_max REAL NOT NULL, recorded_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS image_observations (
    id TEXT PRIMARY KEY, layer_id TEXT NOT NULL, canopy_coverage REAL NOT NULL,
    crowding_risk TEXT NOT NULL, confidence REAL NOT NULL, yellowing TEXT NOT NULL,
    image_quality TEXT NOT NULL, observed_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS growing_plans (
    id TEXT PRIMARY KEY, crop TEXT NOT NULL, cultivar TEXT NOT NULL, current_day REAL NOT NULL,
    target_days REAL NOT NULL, stage TEXT NOT NULL, next_milestone TEXT NOT NULL, next_milestone_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS schedule_events (
    id TEXT PRIMARY KEY, plan_id TEXT NOT NULL, day INTEGER NOT NULL, title TEXT NOT NULL,
    category TEXT NOT NULL, status TEXT NOT NULL, detail TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS ai_recommendations (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, summary TEXT NOT NULL, explanation TEXT NOT NULL,
    evidence_json TEXT NOT NULL, confidence REAL NOT NULL, risk TEXT NOT NULL, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS proposed_actions (
    id TEXT PRIMARY KEY, recommendation_id TEXT NOT NULL, actuator TEXT NOT NULL, command TEXT NOT NULL,
    target TEXT NOT NULL, value REAL NOT NULL, unit TEXT NOT NULL, rationale TEXT NOT NULL,
    validation_json TEXT NOT NULL, status TEXT NOT NULL, version INTEGER NOT NULL, expires_at TEXT NOT NULL,
    suggested_risk TEXT NOT NULL, authoritative_risk TEXT NOT NULL, lifecycle_json TEXT NOT NULL,
    created_at TEXT NOT NULL, decided_by TEXT, decided_at TEXT, decision_comment TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS approval_decisions (
    id TEXT PRIMARY KEY, action_id TEXT NOT NULL, action_version INTEGER NOT NULL, decision TEXT NOT NULL,
    comment TEXT, actor TEXT NOT NULL, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS execution_results (
    id TEXT PRIMARY KEY, action_id TEXT NOT NULL, adapter TEXT NOT NULL, outcome TEXT NOT NULL,
    detail TEXT NOT NULL, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS farm_alerts (
    id TEXT PRIMARY KEY, severity TEXT NOT NULL, title TEXT NOT NULL, detail TEXT NOT NULL,
    source TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL,
    acknowledged_by TEXT, acknowledged_at TEXT, comment TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS runtime_settings (
    id TEXT PRIMARY KEY, automation_mode TEXT NOT NULL, updated_by TEXT NOT NULL, reason TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY, event_type TEXT NOT NULL, actor TEXT NOT NULL, summary TEXT NOT NULL, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS harvest_outcomes (
    id TEXT PRIMARY KEY, plan_id TEXT NOT NULL, harvested_at TEXT NOT NULL, yield_grams REAL NOT NULL, notes TEXT NOT NULL
  )`,
];

export async function ensureDatabase(): Promise<void> {
  const d1 = getD1();
  await d1.batch(schemaStatements.map((sql) => d1.prepare(sql)));
  const existing = await d1.prepare("SELECT COUNT(*) AS total FROM sensor_readings").first<{ total: number }>();
  if ((existing?.total ?? 0) > 0) return;

  const statements: D1PreparedStatement[] = [];
  for (const sensor of DEMO_SNAPSHOT.sensors) {
    statements.push(d1.prepare(
      "INSERT INTO sensor_readings (id, kind, label, value, unit, status, trend, sparkline_json, safe_min, safe_max, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(sensor.id, sensor.kind, sensor.label, sensor.value, sensor.unit, sensor.status, sensor.trend, JSON.stringify(sensor.sparkline), sensor.safeRange[0], sensor.safeRange[1], sensor.recordedAt));
  }
  for (const item of DEMO_SNAPSHOT.observations) {
    statements.push(d1.prepare(
      "INSERT INTO image_observations (id, layer_id, canopy_coverage, crowding_risk, confidence, yellowing, image_quality, observed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(item.id, item.layerId, item.canopyCoverage, item.crowdingRisk, item.confidence, item.yellowing, item.imageQuality, item.observedAt));
  }
  const plan = DEMO_SNAPSHOT.plan;
  statements.push(d1.prepare(
    "INSERT INTO growing_plans (id, crop, cultivar, current_day, target_days, stage, next_milestone, next_milestone_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(plan.id, plan.crop, plan.cultivar, plan.currentDay, plan.targetDays, plan.stage, plan.nextMilestone, plan.nextMilestoneAt));
  for (const event of DEMO_SNAPSHOT.schedule) {
    statements.push(d1.prepare(
      "INSERT INTO schedule_events (id, plan_id, day, title, category, status, detail) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).bind(event.id, event.planId, event.day, event.title, event.category, event.status, event.detail));
  }
  for (const recommendation of DEMO_SNAPSHOT.recommendations) {
    statements.push(d1.prepare(
      "INSERT INTO ai_recommendations (id, title, summary, explanation, evidence_json, confidence, risk, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(recommendation.id, recommendation.title, recommendation.summary, recommendation.explanation, JSON.stringify(recommendation.evidence), recommendation.confidence, recommendation.risk, recommendation.createdAt));
  }
  const pendingExpiry = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
  for (const action of DEMO_SNAPSHOT.actions) {
    statements.push(d1.prepare(
      "INSERT INTO proposed_actions (id, recommendation_id, actuator, command, target, value, unit, rationale, validation_json, status, version, expires_at, suggested_risk, authoritative_risk, lifecycle_json, created_at, decided_by, decided_at, decision_comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(action.id, action.recommendationId, action.actuator, action.command, action.target, action.value, action.unit, action.rationale, JSON.stringify(action.validation), action.status, action.version, action.status === "pending_approval" ? pendingExpiry : action.expiresAt, action.suggestedRisk, action.authoritativeRisk, JSON.stringify(action.lifecycle), action.createdAt, action.decidedBy ?? null, action.decidedAt ?? null, action.decisionComment ?? null));
  }
  for (const alert of DEMO_SNAPSHOT.alerts) {
    statements.push(d1.prepare(
      "INSERT INTO farm_alerts (id, severity, title, detail, source, status, created_at, acknowledged_by, acknowledged_at, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(alert.id, alert.severity, alert.title, alert.detail, alert.source, alert.status, alert.createdAt, alert.acknowledgedBy ?? null, alert.acknowledgedAt ?? null, alert.comment ?? null));
  }
  for (const event of DEMO_SNAPSHOT.auditEvents) {
    statements.push(d1.prepare(
      "INSERT INTO audit_events (id, event_type, actor, summary, created_at) VALUES (?, ?, ?, ?, ?)",
    ).bind(event.id, event.eventType, event.actor, event.summary, event.createdAt));
  }
  for (const outcome of DEMO_SNAPSHOT.harvestOutcomes) {
    statements.push(d1.prepare(
      "INSERT INTO harvest_outcomes (id, plan_id, harvested_at, yield_grams, notes) VALUES (?, ?, ?, ?, ?)",
    ).bind(outcome.id, outcome.planId, outcome.harvestedAt, outcome.yieldGrams, outcome.notes));
  }
  statements.push(d1.prepare(
    "INSERT INTO runtime_settings (id, automation_mode, updated_by, reason, updated_at) VALUES ('farm-runtime', 'running', 'System', 'Initial simulator state', ?)",
  ).bind(new Date().toISOString()));
  await d1.batch(statements);
}

function stringValue(row: RecordRow, key: string, fallback = "") {
  return String(row[key] ?? fallback);
}

function numberValue(row: RecordRow, key: string, fallback = 0) {
  return Number(row[key] ?? fallback);
}

export async function readDashboardSnapshot(): Promise<DashboardSnapshot> {
  await ensureDatabase();
  const d1 = getD1();
  const [sensorResult, observationResult, planRow, scheduleResult, recommendationResult, actionResult, alertResult, runtimeRow, auditResult, harvestResult] = await Promise.all([
    d1.prepare("SELECT * FROM sensor_readings ORDER BY id").all<RecordRow>(),
    d1.prepare("SELECT * FROM image_observations ORDER BY layer_id").all<RecordRow>(),
    d1.prepare("SELECT * FROM growing_plans LIMIT 1").first<RecordRow>(),
    d1.prepare("SELECT * FROM schedule_events ORDER BY day").all<RecordRow>(),
    d1.prepare("SELECT * FROM ai_recommendations ORDER BY created_at DESC").all<RecordRow>(),
    d1.prepare("SELECT * FROM proposed_actions ORDER BY created_at DESC").all<RecordRow>(),
    d1.prepare("SELECT * FROM farm_alerts ORDER BY status, created_at DESC").all<RecordRow>(),
    d1.prepare("SELECT * FROM runtime_settings WHERE id = 'farm-runtime'").first<RecordRow>(),
    d1.prepare("SELECT * FROM audit_events ORDER BY created_at DESC LIMIT 80").all<RecordRow>(),
    d1.prepare("SELECT * FROM harvest_outcomes ORDER BY harvested_at DESC").all<RecordRow>(),
  ]);

  const now = new Date();
  const currentTimestamp = now.toISOString();
  const sensors: SensorReading[] = sensorResult.results.map((row) => ({
    id: stringValue(row, "id"), kind: stringValue(row, "kind") as SensorKind, label: stringValue(row, "label"),
    value: numberValue(row, "value"), unit: stringValue(row, "unit"), status: stringValue(row, "status") as HealthStatus,
    trend: numberValue(row, "trend"), sparkline: JSON.parse(stringValue(row, "sparkline_json", "[]")) as number[],
    safeRange: [numberValue(row, "safe_min"), numberValue(row, "safe_max")], recordedAt: currentTimestamp,
  }));
  const observations: ImageObservation[] = observationResult.results.map((row) => ({
    id: stringValue(row, "id"), layerId: stringValue(row, "layer_id"), canopyCoverage: numberValue(row, "canopy_coverage"),
    crowdingRisk: stringValue(row, "crowding_risk") as HealthStatus, confidence: numberValue(row, "confidence"),
    yellowing: stringValue(row, "yellowing") as ImageObservation["yellowing"], imageQuality: stringValue(row, "image_quality") as ImageObservation["imageQuality"], observedAt: currentTimestamp,
  }));
  const schedule: ScheduleEvent[] = scheduleResult.results.map((row) => ({
    id: stringValue(row, "id"), planId: stringValue(row, "plan_id"), day: numberValue(row, "day"), title: stringValue(row, "title"),
    category: stringValue(row, "category") as ScheduleEvent["category"], status: stringValue(row, "status") as ScheduleEvent["status"], detail: stringValue(row, "detail"),
  }));
  const recommendations: AIRecommendation[] = recommendationResult.results.map((row) => ({
    id: stringValue(row, "id"), title: stringValue(row, "title"), summary: stringValue(row, "summary"), explanation: stringValue(row, "explanation"),
    evidence: JSON.parse(stringValue(row, "evidence_json", "[]")) as string[], confidence: numberValue(row, "confidence"), risk: stringValue(row, "risk") as RiskLevel, createdAt: stringValue(row, "created_at"),
  }));
  const actions: ProposedAction[] = actionResult.results.map((row) => ({
    id: stringValue(row, "id"), recommendationId: stringValue(row, "recommendation_id"), actuator: stringValue(row, "actuator") as ProposedAction["actuator"],
    command: stringValue(row, "command"), target: stringValue(row, "target"), value: numberValue(row, "value"), unit: stringValue(row, "unit"), rationale: stringValue(row, "rationale"),
    validation: JSON.parse(stringValue(row, "validation_json", "{}")) as ValidationResult, status: stringValue(row, "status") as ActionStatus,
    version: numberValue(row, "version", 1), expiresAt: stringValue(row, "expires_at"), suggestedRisk: stringValue(row, "suggested_risk") as RiskLevel,
    authoritativeRisk: stringValue(row, "authoritative_risk") as RiskLevel, lifecycle: JSON.parse(stringValue(row, "lifecycle_json", "[]")) as ActionLifecycleEvent[],
    createdAt: stringValue(row, "created_at"), decidedBy: row.decided_by ? String(row.decided_by) : undefined,
    decidedAt: row.decided_at ? String(row.decided_at) : undefined, decisionComment: row.decision_comment ? String(row.decision_comment) : undefined,
  }));
  const alerts: FarmAlert[] = alertResult.results.map((row) => ({
    id: stringValue(row, "id"), severity: stringValue(row, "severity") as FarmAlert["severity"], title: stringValue(row, "title"), detail: stringValue(row, "detail"),
    source: stringValue(row, "source"), status: stringValue(row, "status") as FarmAlert["status"], createdAt: stringValue(row, "created_at"),
    acknowledgedBy: row.acknowledged_by ? String(row.acknowledged_by) : undefined, acknowledgedAt: row.acknowledged_at ? String(row.acknowledged_at) : undefined,
    comment: row.comment ? String(row.comment) : undefined,
  }));
  const auditEvents: AuditEvent[] = auditResult.results.map((row) => ({ id: stringValue(row, "id"), eventType: stringValue(row, "event_type"), actor: stringValue(row, "actor"), summary: stringValue(row, "summary"), createdAt: stringValue(row, "created_at") }));
  const harvestOutcomes: HarvestOutcome[] = harvestResult.results.map((row) => ({ id: stringValue(row, "id"), planId: stringValue(row, "plan_id"), harvestedAt: stringValue(row, "harvested_at"), yieldGrams: numberValue(row, "yield_grams"), notes: stringValue(row, "notes") }));
  const plan = planRow ?? {};
  const automationMode = stringValue(runtimeRow ?? {}, "automation_mode", "running") as AutomationMode;
  const layers = DEMO_SNAPSHOT.layers.map((layer) => ({
    ...layer,
    devices: layer.devices.map((device) => automationMode === "emergency_stop" && device.kind !== "camera"
      ? { ...device, status: "disabled" as const, mode: "safety_locked" as const, detail: "Disabled by emergency stop" }
      : automationMode === "paused" && (device.kind === "light" || device.kind === "fan")
        ? { ...device, mode: "manual" as const, detail: "Automation paused · monitoring only" }
        : device),
  }));

  return {
    farmName: DEMO_SNAPSHOT.farmName, mode: "simulation", systemStatus: automationMode === "emergency_stop" ? "degraded" : "healthy", automationMode,
    lastUpdatedAt: currentTimestamp, nextAnalysisAt: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
    plan: {
      id: stringValue(plan, "id", DEMO_SNAPSHOT.plan.id), crop: stringValue(plan, "crop", DEMO_SNAPSHOT.plan.crop), cultivar: stringValue(plan, "cultivar", DEMO_SNAPSHOT.plan.cultivar),
      currentDay: numberValue(plan, "current_day", DEMO_SNAPSHOT.plan.currentDay), targetDays: numberValue(plan, "target_days", DEMO_SNAPSHOT.plan.targetDays),
      stage: stringValue(plan, "stage", DEMO_SNAPSHOT.plan.stage), nextMilestone: stringValue(plan, "next_milestone", DEMO_SNAPSHOT.plan.nextMilestone), nextMilestoneAt: stringValue(plan, "next_milestone_at", DEMO_SNAPSHOT.plan.nextMilestoneAt),
    },
    schedule, sensors, observations, layers, recommendations, actions, alerts, services: DEMO_SNAPSHOT.services,
    auditEvents, harvestOutcomes, harvestForecast: DEMO_SNAPSHOT.harvestForecast,
  };
}

export async function recordApprovalDecision(request: ApprovalRequest, actor: string): Promise<void> {
  await ensureDatabase();
  const d1 = getD1();
  const row = await d1.prepare("SELECT * FROM proposed_actions WHERE id = ?").bind(request.actionId).first<RecordRow>();
  if (!row) throw new Error("ACTION_NOT_FOUND");
  if (numberValue(row, "version", 1) !== request.version) throw new Error("ACTION_VERSION_CONFLICT");
  if (stringValue(row, "status") !== "pending_approval") throw new Error("ACTION_ALREADY_DECIDED");
  if (Date.now() > new Date(stringValue(row, "expires_at")).getTime()) throw new Error("ACTION_EXPIRED");

  const snapshot = await readDashboardSnapshot();
  const candidate = {
    actuator: stringValue(row, "actuator") as ProposedAction["actuator"], command: stringValue(row, "command"), target: stringValue(row, "target"),
    value: numberValue(row, "value"), unit: stringValue(row, "unit"),
  };
  const validation = validateProposedAction(candidate, snapshot.sensors, new Date());
  if (request.decision === "approve" && !validation.allowed) throw new Error("ACTION_BLOCKED_BY_POLICY");

  const now = new Date().toISOString();
  const suffix = crypto.randomUUID();
  const lifecycle = JSON.parse(stringValue(row, "lifecycle_json", "[]")) as ActionLifecycleEvent[];
  const nextStatus: ActionStatus = request.decision === "approve" ? "executed" : "rejected";
  lifecycle.push({ state: request.decision === "approve" ? "executing" : "rejected", label: request.decision === "approve" ? "Revalidated and sent to simulator" : "Proposal rejected by operator", at: now });

  const statements: D1PreparedStatement[] = [];
  if (request.decision === "approve") {
    const simulator = new FarmSimulatorAdapter();
    const result = await simulator.execute({
      id: request.actionId, recommendationId: stringValue(row, "recommendation_id"), ...candidate,
      rationale: stringValue(row, "rationale"), validation, status: "approved", createdAt: stringValue(row, "created_at"),
      version: request.version, expiresAt: stringValue(row, "expires_at"), suggestedRisk: stringValue(row, "suggested_risk") as RiskLevel,
      authoritativeRisk: validation.risk, lifecycle,
    });
    if (result.outcome !== "completed") throw new Error("ACTION_BLOCKED_BY_POLICY");
    lifecycle.push({ state: "executed", label: "Simulator outcome confirmed", at: result.createdAt });
    statements.push(d1.prepare("INSERT INTO execution_results (id, action_id, adapter, outcome, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(result.id, request.actionId, result.adapter, result.outcome, result.detail, result.createdAt));
  }
  statements.push(
    d1.prepare("UPDATE proposed_actions SET status = ?, validation_json = ?, lifecycle_json = ?, decided_by = ?, decided_at = ?, decision_comment = ? WHERE id = ? AND version = ?").bind(nextStatus, JSON.stringify(validation), JSON.stringify(lifecycle), actor, now, request.comment ?? null, request.actionId, request.version),
    d1.prepare("INSERT INTO approval_decisions (id, action_id, action_version, decision, comment, actor, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(`approval-${suffix}`, request.actionId, request.version, request.decision, request.comment ?? null, actor, now),
    d1.prepare("INSERT INTO audit_events (id, event_type, actor, summary, created_at) VALUES (?, ?, ?, ?, ?)").bind(`audit-approval-${suffix}`, `approval.${request.decision}`, actor, `${request.decision === "approve" ? "Approved and simulated" : "Rejected"} ${candidate.actuator} request for ${candidate.target}`, now),
  );
  await d1.batch(statements);
}

export async function updateGrowingPlan(request: GrowingPlanUpdateRequest, actor: string): Promise<void> {
  await ensureDatabase();
  const d1 = getD1();
  const now = new Date().toISOString();
  const suffix = crypto.randomUUID();
  await d1.batch([
    d1.prepare("UPDATE growing_plans SET stage = ?, next_milestone = ?, next_milestone_at = ? WHERE id = ?").bind(request.stage, request.nextMilestone, request.nextMilestoneAt, DEMO_SNAPSHOT.plan.id),
    d1.prepare("INSERT INTO audit_events (id, event_type, actor, summary, created_at) VALUES (?, 'plan.updated', ?, ?, ?)").bind(`audit-plan-${suffix}`, actor, `Updated growing plan milestone: ${request.nextMilestone}`, now),
  ]);
}

export async function acknowledgeAlert(request: AlertAcknowledgeRequest, actor: string): Promise<void> {
  await ensureDatabase();
  const d1 = getD1();
  const alert = await d1.prepare("SELECT title, status FROM farm_alerts WHERE id = ?").bind(request.alertId).first<{ title: string; status: string }>();
  if (!alert) throw new Error("ALERT_NOT_FOUND");
  if (alert.status === "acknowledged") throw new Error("ALERT_ALREADY_ACKNOWLEDGED");
  const now = new Date().toISOString();
  const suffix = crypto.randomUUID();
  await d1.batch([
    d1.prepare("UPDATE farm_alerts SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = ?, comment = ? WHERE id = ?").bind(actor, now, request.comment ?? null, request.alertId),
    d1.prepare("INSERT INTO audit_events (id, event_type, actor, summary, created_at) VALUES (?, 'alert.acknowledged', ?, ?, ?)").bind(`audit-alert-${suffix}`, actor, `Acknowledged alert: ${alert.title}`, now),
  ]);
}

export async function setAutomationOverride(request: OverrideRequest, actor: string): Promise<void> {
  await ensureDatabase();
  const d1 = getD1();
  const now = new Date().toISOString();
  const suffix = crypto.randomUUID();
  const automationMode: AutomationMode = request.mode === "resume" ? "running" : request.mode === "pause" ? "paused" : "emergency_stop";
  await d1.batch([
    d1.prepare("UPDATE runtime_settings SET automation_mode = ?, updated_by = ?, reason = ?, updated_at = ? WHERE id = 'farm-runtime'").bind(automationMode, actor, request.reason, now),
    d1.prepare("INSERT INTO audit_events (id, event_type, actor, summary, created_at) VALUES (?, ?, ?, ?, ?)").bind(`audit-override-${suffix}`, `override.${request.mode}`, actor, `${request.mode === "emergency_stop" ? "Emergency stop engaged" : request.mode === "pause" ? "Automation paused" : "Automation resumed"}: ${request.reason}`, now),
  ]);
}
