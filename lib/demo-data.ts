import type { DashboardSnapshot, SensorReading } from "./domain";
import { validateProposedAction } from "./safety-policy";

const BASE_TIME = "2026-07-26T00:20:00.000Z";

export const DEMO_SENSORS: SensorReading[] = [
  {
    id: "sensor-ph-01",
    kind: "ph",
    label: "pH",
    value: 5.9,
    unit: "pH",
    status: "optimal",
    trend: 0.1,
    sparkline: [5.78, 5.81, 5.84, 5.91, 5.94, 5.88, 5.9, 5.92, 5.9, 5.89, 5.9, 5.9],
    recordedAt: BASE_TIME,
    safeRange: [5.5, 6.5],
  },
  {
    id: "sensor-ec-01",
    kind: "ec",
    label: "EC",
    value: 1.62,
    unit: "mS/cm",
    status: "optimal",
    trend: -0.04,
    sparkline: [1.78, 1.74, 1.71, 1.69, 1.68, 1.66, 1.64, 1.65, 1.63, 1.62, 1.61, 1.62],
    recordedAt: BASE_TIME,
    safeRange: [1.2, 2.0],
  },
  {
    id: "sensor-water-temp-01",
    kind: "solution_temperature",
    label: "Solution temp",
    value: 22.4,
    unit: "°C",
    status: "optimal",
    trend: 0.3,
    sparkline: [21.5, 21.7, 21.9, 22.1, 22.0, 22.2, 22.3, 22.25, 22.36, 22.41, 22.38, 22.4],
    recordedAt: BASE_TIME,
    safeRange: [18, 24],
  },
  {
    id: "sensor-air-temp-01",
    kind: "air_temperature",
    label: "Air temp",
    value: 24.8,
    unit: "°C",
    status: "attention",
    trend: 1.2,
    sparkline: [21.9, 22.1, 22.4, 22.9, 23.1, 23.8, 24.2, 24.35, 24.48, 24.62, 24.74, 24.8],
    recordedAt: BASE_TIME,
    safeRange: [18, 25],
  },
];

const fanCandidate = {
  actuator: "fan" as const,
  command: "run_for",
  target: "layer_3",
  value: 20,
  unit: "minutes",
};

const doseCandidate = {
  actuator: "dosing_pump" as const,
  command: "dose",
  target: "shared_reservoir",
  value: 1.2,
  unit: "millilitres",
};

const blockedCandidate = {
  actuator: "light" as const,
  command: "extend_cycle",
  target: "layer_2",
  value: 960,
  unit: "minutes",
};

const fanValidation = validateProposedAction(fanCandidate, DEMO_SENSORS, new Date(BASE_TIME));
const doseValidation = validateProposedAction(doseCandidate, DEMO_SENSORS, new Date(BASE_TIME));
const blockedValidation = validateProposedAction(blockedCandidate, DEMO_SENSORS, new Date(BASE_TIME));

export const DEMO_SNAPSHOT: DashboardSnapshot = {
  farmName: "Leafy AI · Basil Bay 01",
  mode: "simulation",
  systemStatus: "healthy",
  automationMode: "running",
  lastUpdatedAt: BASE_TIME,
  nextAnalysisAt: "2026-07-26T00:35:00.000Z",
  plan: {
    id: "plan-genovese-01",
    crop: "Sweet basil",
    cultivar: "Genovese",
    currentDay: 18,
    targetDays: 36,
    stage: "Vegetative growth",
    nextMilestone: "Manual channel spacing review",
    nextMilestoneAt: "2026-07-29T00:00:00.000Z",
  },
  schedule: [
    { id: "schedule-01", planId: "plan-genovese-01", day: 1, title: "Transplant seedlings", category: "manual", status: "complete", detail: "48 rooted seedlings moved into NFT channels." },
    { id: "schedule-02", planId: "plan-genovese-01", day: 8, title: "Establish nutrient routine", category: "automatic", status: "complete", detail: "Starter routine activated under demonstration limits." },
    { id: "schedule-03", planId: "plan-genovese-01", day: 18, title: "Canopy review", category: "observe", status: "complete", detail: "Vision baseline captured across all three layers." },
    { id: "schedule-04", planId: "plan-genovese-01", day: 21, title: "Expand NFT channels", category: "manual", status: "next", detail: "Human-only spacing task; AI provides timing guidance." },
    { id: "schedule-05", planId: "plan-genovese-01", day: 28, title: "Pre-harvest assessment", category: "observe", status: "planned", detail: "Measure canopy, plant height and projected yield." },
    { id: "schedule-06", planId: "plan-genovese-01", day: 36, title: "Target harvest", category: "harvest", status: "planned", detail: "Record yield and outcome notes for routine improvement." },
  ],
  sensors: DEMO_SENSORS,
  observations: [
    { id: "vision-layer-01", layerId: "layer_1", canopyCoverage: 62, crowdingRisk: "optimal", confidence: 0.92, observedAt: BASE_TIME, yellowing: "none", imageQuality: "good" },
    { id: "vision-layer-02", layerId: "layer_2", canopyCoverage: 71, crowdingRisk: "optimal", confidence: 0.89, observedAt: BASE_TIME, yellowing: "low", imageQuality: "good" },
    { id: "vision-layer-03", layerId: "layer_3", canopyCoverage: 84, crowdingRisk: "attention", confidence: 0.87, observedAt: BASE_TIME, yellowing: "none", imageQuality: "good" },
  ],
  layers: [
    {
      id: "layer_1", name: "Upper Canopy", cropCount: 16, replayPosition: "74% 17%", observationId: "vision-layer-01",
      devices: [
        { id: "camera-1", layerId: "layer_1", kind: "camera", label: "Camera 01", status: "online", mode: "automatic", detail: "Replay frame · 92% confidence" },
        { id: "light-1", layerId: "layer_1", kind: "light", label: "Grow light", status: "running", mode: "automatic", detail: "62% · 07:00–19:00" },
        { id: "fan-1", layerId: "layer_1", kind: "fan", label: "Airflow", status: "idle", mode: "automatic", detail: "Last cycle 12 min ago" },
      ],
    },
    {
      id: "layer_2", name: "Middle Canopy", cropCount: 16, replayPosition: "78% 48%", observationId: "vision-layer-02",
      devices: [
        { id: "camera-2", layerId: "layer_2", kind: "camera", label: "Camera 02", status: "online", mode: "automatic", detail: "Replay frame · 89% confidence" },
        { id: "light-2", layerId: "layer_2", kind: "light", label: "Grow light", status: "running", mode: "automatic", detail: "64% · 07:00–19:00" },
        { id: "fan-2", layerId: "layer_2", kind: "fan", label: "Airflow", status: "idle", mode: "automatic", detail: "Ready" },
      ],
    },
    {
      id: "layer_3", name: "Lower Canopy", cropCount: 16, replayPosition: "80% 79%", observationId: "vision-layer-03",
      devices: [
        { id: "camera-3", layerId: "layer_3", kind: "camera", label: "Camera 03", status: "online", mode: "automatic", detail: "Replay frame · 87% confidence" },
        { id: "light-3", layerId: "layer_3", kind: "light", label: "Grow light", status: "running", mode: "automatic", detail: "60% · 07:00–19:00" },
        { id: "fan-3", layerId: "layer_3", kind: "fan", label: "Airflow", status: "running", mode: "automatic", detail: "20 minute safe cycle" },
      ],
    },
  ],
  recommendations: [
    {
      id: "rec-dose-01", title: "Correct the EC drift conservatively", summary: "Dose 1.2 mL of approved nutrient concentrate into the shared reservoir, then wait for a fresh sensor batch.",
      explanation: "EC has moved down across the recent window while pH remains stable. Because dosing affects the whole farm, the proposal is high-risk and cannot execute without a human decision and a fresh-state recheck.",
      evidence: ["EC 1.62 mS/cm · −0.04 trend", "pH stable at 5.9", "Shared reservoir scope"], confidence: 0.81, risk: "high", createdAt: BASE_TIME,
    },
    {
      id: "rec-airflow-01", title: "Increase airflow on Layer 3", summary: "Run the Layer 3 fan for 20 minutes, then reassess air temperature.",
      explanation: "Air temperature rose across the recent window while Layer 3 canopy coverage is higher than the other layers. A short fan cycle is reversible and inside the low-risk demonstration policy.",
      evidence: ["Air 24.8 °C · +1.2 °C", "Layer 3 coverage 84%", "Vision confidence 87%"], confidence: 0.86, risk: "low", createdAt: "2026-07-26T00:17:00.000Z",
    },
    {
      id: "rec-light-01", title: "Reject excessive light extension", summary: "A 16-hour extension exceeded the demonstration policy and was blocked before execution.",
      explanation: "The proposed duration is above the maximum permitted window. The safety layer is authoritative and the command cannot be approved or sent to the simulator.",
      evidence: ["Requested extension 960 min", "Policy maximum 720 min", "No hardware command sent"], confidence: 0.94, risk: "high", createdAt: "2026-07-26T00:12:00.000Z",
    },
  ],
  actions: [
    {
      id: "action-dose-01", recommendationId: "rec-dose-01", ...doseCandidate,
      rationale: "Restore the approved EC target using the smallest permitted dose.", validation: doseValidation, status: "pending_approval", createdAt: BASE_TIME,
      version: 1, expiresAt: "2026-07-26T04:20:00.000Z", suggestedRisk: "medium", authoritativeRisk: "high",
      lifecycle: [
        { state: "proposed", label: "AI proposal created", at: "2026-07-26T00:19:42.000Z" },
        { state: "schema_validated", label: "Structured output accepted", at: "2026-07-26T00:19:46.000Z" },
        { state: "safety_validated", label: "Policy classified action as high risk", at: "2026-07-26T00:19:51.000Z" },
        { state: "approval_pending", label: "Waiting for human approval", at: BASE_TIME },
      ],
    },
    {
      id: "action-fan-01", recommendationId: "rec-airflow-01", ...fanCandidate,
      rationale: "Reduce short-term heat and crowding risk on Layer 3.", validation: fanValidation, status: "executed", createdAt: "2026-07-26T00:17:00.000Z",
      version: 1, expiresAt: "2026-07-26T04:17:00.000Z", suggestedRisk: "low", authoritativeRisk: "low", decidedBy: "Safety Policy Engine", decidedAt: "2026-07-26T00:17:09.000Z", decisionComment: "Auto-executed inside the low-risk simulator policy.",
      lifecycle: [
        { state: "proposed", label: "AI proposal created", at: "2026-07-26T00:17:00.000Z" },
        { state: "schema_validated", label: "Structured output accepted", at: "2026-07-26T00:17:03.000Z" },
        { state: "safety_validated", label: "Low-risk policy passed", at: "2026-07-26T00:17:05.000Z" },
        { state: "executing", label: "Sent to farm simulator", at: "2026-07-26T00:17:07.000Z" },
        { state: "executed", label: "Simulator outcome confirmed", at: "2026-07-26T00:17:09.000Z" },
      ],
    },
    {
      id: "action-light-01", recommendationId: "rec-light-01", ...blockedCandidate,
      rationale: "Extend photosynthetic light exposure.", validation: blockedValidation, status: "blocked", createdAt: "2026-07-26T00:12:00.000Z",
      version: 1, expiresAt: "2026-07-26T04:12:00.000Z", suggestedRisk: "low", authoritativeRisk: "high",
      lifecycle: [
        { state: "proposed", label: "AI proposal created", at: "2026-07-26T00:12:00.000Z" },
        { state: "schema_validated", label: "Structured output accepted", at: "2026-07-26T00:12:03.000Z" },
        { state: "blocked", label: "Safety policy blocked the command", at: "2026-07-26T00:12:05.000Z" },
      ],
    },
  ],
  alerts: [
    { id: "alert-temp-01", severity: "warning", title: "Air temperature trending upward", detail: "Layer 3 reached 24.8 °C. The low-risk airflow response has already executed in the simulator.", source: "Trend processor", status: "active", createdAt: "2026-07-26T00:17:00.000Z" },
    { id: "alert-image-01", severity: "info", title: "Replay vision batch complete", detail: "All three layer frames passed image-quality gating.", source: "Vision adapter", status: "acknowledged", createdAt: "2026-07-26T00:10:00.000Z", acknowledgedBy: "demo.operator@leafy-ai.test", acknowledgedAt: "2026-07-26T00:11:00.000Z", comment: "Reviewed during morning round." },
  ],
  services: [
    { id: "service-store", label: "Farm state store", status: "healthy", latencyMs: 34, detail: "D1 simulation state available" },
    { id: "service-policy", label: "Safety policy", status: "healthy", latencyMs: 7, detail: "leafy-demo-2026.2 active" },
    { id: "service-ai", label: "AI adapter", status: "healthy", latencyMs: 416, detail: "Structured replay mode" },
    { id: "service-farm", label: "Physical farm adapter", status: "offline", detail: "Deliberately disabled for this sample" },
  ],
  auditEvents: [
    { id: "audit-07", eventType: "action.approval_pending", actor: "Safety Policy Engine", summary: "Dosing proposal routed to human approval", createdAt: BASE_TIME },
    { id: "audit-06", eventType: "simulator.executed", actor: "Farm Simulator", summary: "Confirmed 20 minute fan cycle for Layer 3", createdAt: "2026-07-26T00:17:09.000Z" },
    { id: "audit-05", eventType: "policy.allowed", actor: "Safety Policy Engine", summary: "Fan action passed low-risk demonstration policy", createdAt: "2026-07-26T00:17:05.000Z" },
    { id: "audit-04", eventType: "policy.blocked", actor: "Safety Policy Engine", summary: "Blocked light extension above 720 minutes", createdAt: "2026-07-26T00:12:05.000Z" },
    { id: "audit-03", eventType: "vision.batch", actor: "Vision Adapter", summary: "Validated canopy observations for three layers", createdAt: "2026-07-26T00:10:00.000Z" },
    { id: "audit-02", eventType: "farm.snapshot", actor: "Farm Simulator", summary: "Ingested replay sensor and canopy snapshot", createdAt: "2026-07-26T00:05:00.000Z" },
    { id: "audit-01", eventType: "plan.activated", actor: "Demo Operator", summary: "Activated Genovese basil growing plan", createdAt: "2026-07-08T00:00:00.000Z" },
  ],
  harvestOutcomes: [
    { id: "harvest-02", planId: "plan-genovese-00", harvestedAt: "2026-06-18T02:00:00.000Z", yieldGrams: 4320, notes: "Even canopy; minor edge yellowing on Layer 1." },
    { id: "harvest-01", planId: "plan-genovese-demo", harvestedAt: "2026-05-10T02:00:00.000Z", yieldGrams: 3980, notes: "Baseline routine before airflow adjustment." },
  ],
  harvestForecast: {
    expectedDate: "2026-08-13T02:00:00.000Z", expectedYieldGrams: 4580, confidence: 0.78, rangeGrams: [4210, 4920],
    drivers: ["Canopy coverage +8% vs baseline", "Stable pH window", "Layer 3 crowding risk"],
  },
};
