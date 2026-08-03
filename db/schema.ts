import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sensorReadings = sqliteTable("sensor_readings", {
  id: text("id").primaryKey(), kind: text("kind").notNull(), label: text("label").notNull(),
  value: real("value").notNull(), unit: text("unit").notNull(), status: text("status").notNull(),
  trend: real("trend").notNull(), sparklineJson: text("sparkline_json").notNull(),
  safeMin: real("safe_min").notNull(), safeMax: real("safe_max").notNull(), recordedAt: text("recorded_at").notNull(),
});

export const imageObservations = sqliteTable("image_observations", {
  id: text("id").primaryKey(), layerId: text("layer_id").notNull(), canopyCoverage: real("canopy_coverage").notNull(),
  crowdingRisk: text("crowding_risk").notNull(), confidence: real("confidence").notNull(),
  yellowing: text("yellowing").notNull(), imageQuality: text("image_quality").notNull(), observedAt: text("observed_at").notNull(),
});

export const growingPlans = sqliteTable("growing_plans", {
  id: text("id").primaryKey(), crop: text("crop").notNull(), cultivar: text("cultivar").notNull(),
  currentDay: real("current_day").notNull(), targetDays: real("target_days").notNull(), stage: text("stage").notNull(),
  nextMilestone: text("next_milestone").notNull(), nextMilestoneAt: text("next_milestone_at").notNull(),
});

export const scheduleEvents = sqliteTable("schedule_events", {
  id: text("id").primaryKey(), planId: text("plan_id").notNull(), day: integer("day").notNull(),
  title: text("title").notNull(), category: text("category").notNull(), status: text("status").notNull(), detail: text("detail").notNull(),
});

export const aiRecommendations = sqliteTable("ai_recommendations", {
  id: text("id").primaryKey(), title: text("title").notNull(), summary: text("summary").notNull(),
  explanation: text("explanation").notNull(), evidenceJson: text("evidence_json").notNull(), confidence: real("confidence").notNull(),
  risk: text("risk").notNull(), createdAt: text("created_at").notNull(),
});

export const proposedActions = sqliteTable("proposed_actions", {
  id: text("id").primaryKey(), recommendationId: text("recommendation_id").notNull(), actuator: text("actuator").notNull(),
  command: text("command").notNull(), target: text("target").notNull(), value: real("value").notNull(), unit: text("unit").notNull(),
  rationale: text("rationale").notNull(), validationJson: text("validation_json").notNull(), status: text("status").notNull(),
  version: integer("version").notNull(), expiresAt: text("expires_at").notNull(), suggestedRisk: text("suggested_risk").notNull(),
  authoritativeRisk: text("authoritative_risk").notNull(), lifecycleJson: text("lifecycle_json").notNull(),
  createdAt: text("created_at").notNull(), decidedBy: text("decided_by"), decidedAt: text("decided_at"), decisionComment: text("decision_comment"),
});

export const approvalDecisions = sqliteTable("approval_decisions", {
  id: text("id").primaryKey(), actionId: text("action_id").notNull(), actionVersion: integer("action_version").notNull(),
  decision: text("decision").notNull(), comment: text("comment"), actor: text("actor").notNull(), createdAt: text("created_at").notNull(),
});

export const executionResults = sqliteTable("execution_results", {
  id: text("id").primaryKey(), actionId: text("action_id").notNull(), adapter: text("adapter").notNull(),
  outcome: text("outcome").notNull(), detail: text("detail").notNull(), createdAt: text("created_at").notNull(),
});

export const farmAlerts = sqliteTable("farm_alerts", {
  id: text("id").primaryKey(), severity: text("severity").notNull(), title: text("title").notNull(), detail: text("detail").notNull(),
  source: text("source").notNull(), status: text("status").notNull(), createdAt: text("created_at").notNull(),
  acknowledgedBy: text("acknowledged_by"), acknowledgedAt: text("acknowledged_at"), comment: text("comment"),
});

export const runtimeSettings = sqliteTable("runtime_settings", {
  id: text("id").primaryKey(), automationMode: text("automation_mode").notNull(), updatedBy: text("updated_by").notNull(),
  reason: text("reason").notNull(), updatedAt: text("updated_at").notNull(),
});

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(), eventType: text("event_type").notNull(), actor: text("actor").notNull(),
  summary: text("summary").notNull(), createdAt: text("created_at").notNull(),
});

export const harvestOutcomes = sqliteTable("harvest_outcomes", {
  id: text("id").primaryKey(), planId: text("plan_id").notNull(), harvestedAt: text("harvested_at").notNull(),
  yieldGrams: real("yield_grams").notNull(), notes: text("notes").notNull(),
});
