export type SensorKind =
  | "ph"
  | "ec"
  | "solution_temperature"
  | "air_temperature";

export type HealthStatus = "optimal" | "attention" | "critical";
export type RiskLevel = "low" | "medium" | "high";
export type ActionStatus =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "executed"
  | "blocked"
  | "expired";

export type AutomationMode = "running" | "paused" | "emergency_stop";

export interface SensorReading {
  id: string;
  kind: SensorKind;
  label: string;
  value: number;
  unit: string;
  status: HealthStatus;
  trend: number;
  sparkline: number[];
  recordedAt: string;
  safeRange: [number, number];
}

export interface ImageObservation {
  id: string;
  layerId: string;
  canopyCoverage: number;
  crowdingRisk: HealthStatus;
  confidence: number;
  observedAt: string;
  yellowing: "none" | "low" | "moderate";
  imageQuality: "good" | "review" | "unknown";
}

export interface DeviceState {
  id: string;
  layerId: string;
  kind: "light" | "fan" | "camera" | "irrigation" | "dosing";
  label: string;
  status: "online" | "running" | "idle" | "disabled";
  mode: "automatic" | "manual" | "safety_locked";
  detail: string;
}

export interface FarmLayer {
  id: string;
  name: string;
  cropCount: number;
  replayPosition: string;
  observationId: string;
  devices: DeviceState[];
}

export interface GrowingPlan {
  id: string;
  crop: string;
  cultivar: string;
  currentDay: number;
  targetDays: number;
  stage: string;
  nextMilestone: string;
  nextMilestoneAt: string;
}

export interface ScheduleEvent {
  id: string;
  planId: string;
  day: number;
  title: string;
  category: "observe" | "manual" | "automatic" | "harvest";
  status: "complete" | "next" | "planned";
  detail: string;
}

export interface ValidationResult {
  allowed: boolean;
  approvalRequired: boolean;
  risk: RiskLevel;
  policyVersion: string;
  reasons: string[];
  checkedAt: string;
}

export interface AIRecommendation {
  id: string;
  title: string;
  summary: string;
  explanation: string;
  evidence: string[];
  confidence: number;
  risk: RiskLevel;
  createdAt: string;
}

export interface ActionLifecycleEvent {
  state:
    | "proposed"
    | "schema_validated"
    | "safety_validated"
    | "approval_pending"
    | "executing"
    | "executed"
    | "rejected"
    | "blocked";
  label: string;
  at: string;
}

export interface ProposedAction {
  id: string;
  recommendationId: string;
  actuator: "light" | "fan" | "irrigation_pump" | "dosing_pump";
  command: string;
  target: string;
  value: number;
  unit: string;
  rationale: string;
  validation: ValidationResult;
  status: ActionStatus;
  createdAt: string;
  version: number;
  expiresAt: string;
  suggestedRisk: RiskLevel;
  authoritativeRisk: RiskLevel;
  lifecycle: ActionLifecycleEvent[];
  decidedBy?: string;
  decidedAt?: string;
  decisionComment?: string;
}

export interface FarmAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
  source: string;
  status: "active" | "acknowledged";
  createdAt: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  comment?: string;
}

export interface ServiceHealth {
  id: string;
  label: string;
  status: "healthy" | "degraded" | "offline";
  latencyMs?: number;
  detail: string;
}

export interface HarvestOutcome {
  id: string;
  planId: string;
  harvestedAt: string;
  yieldGrams: number;
  notes: string;
}

export interface HarvestForecast {
  expectedDate: string;
  expectedYieldGrams: number;
  confidence: number;
  rangeGrams: [number, number];
  drivers: string[];
}

export interface AuditEvent {
  id: string;
  eventType: string;
  actor: string;
  summary: string;
  createdAt: string;
}

export interface ExecutionResult {
  id: string;
  actionId: string;
  adapter: string;
  outcome: "completed" | "failed" | "blocked";
  detail: string;
  createdAt: string;
}

export interface DashboardSnapshot {
  farmName: string;
  mode: "simulation" | "connected";
  systemStatus: "healthy" | "degraded" | "offline";
  automationMode: AutomationMode;
  lastUpdatedAt: string;
  nextAnalysisAt: string;
  plan: GrowingPlan;
  schedule: ScheduleEvent[];
  sensors: SensorReading[];
  observations: ImageObservation[];
  layers: FarmLayer[];
  recommendations: AIRecommendation[];
  actions: ProposedAction[];
  alerts: FarmAlert[];
  services: ServiceHealth[];
  auditEvents: AuditEvent[];
  harvestOutcomes: HarvestOutcome[];
  harvestForecast: HarvestForecast;
}

export interface ApprovalRequest {
  actionId: string;
  version: number;
  decision: "approve" | "reject";
  comment?: string;
}

export interface AlertAcknowledgeRequest {
  alertId: string;
  comment?: string;
}

export interface GrowingPlanUpdateRequest {
  stage: string;
  nextMilestone: string;
  nextMilestoneAt: string;
}

export interface OverrideRequest {
  mode: "pause" | "resume" | "emergency_stop";
  reason: string;
}
