"use client";
/* eslint-disable @next/next/no-img-element -- local replay asset uses CSS object-position crops */

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Bell, Bot, CalendarDays,
  Camera, Check, ChevronRight, CircleGauge, ClipboardCheck, CloudCog,
  Download, Droplets, Eye, Fan, FileClock, Gauge, History, Leaf, Lightbulb,
  LockKeyhole, MoreHorizontal, Pause, Play, Power, RefreshCw, ScanLine, Settings2, ShieldCheck, SlidersHorizontal,
  ShieldX, Sparkles, Sprout, Thermometer, TriangleAlert, UserRound, Waves,
  X, Zap,
} from "lucide-react";
import { DEMO_SNAPSHOT } from "@/lib/demo-data";
import type {
  ActionStatus, ApprovalRequest, DashboardSnapshot, FarmAlert, GrowingPlanUpdateRequest,
  OverrideRequest, ProposedAction, SensorReading,
} from "@/lib/domain";
import { TradeshowTour, type TradeshowStep } from "./TradeshowTour";
import { TradeshowBackstage } from "./TradeshowBackstage";
import {
  activeBackstageInputCount,
  applyBackstageInputs,
  createBackstagePreset,
  createBackstageTask,
  createEmptyBackstageState,
  type BackstagePreset,
  type BackstageTaskDraft,
  type SensorOverride,
} from "./tradeshow-state";

type View = "command" | "layers" | "decisions" | "plan" | "safety" | "audit";
type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

const NAV: Array<{ id: View; label: string; short: string; icon: Icon }> = [
  { id: "command", label: "Command Center", short: "Command", icon: CircleGauge },
  { id: "layers", label: "Farm Layers", short: "Layers", icon: Sprout },
  { id: "decisions", label: "AI Decisions", short: "AI", icon: Bot },
  { id: "plan", label: "Growing Plan", short: "Plan", icon: CalendarDays },
  { id: "safety", label: "Safety & Alerts", short: "Safety", icon: ShieldCheck },
  { id: "audit", label: "Audit & Outcomes", short: "Audit", icon: FileClock },
];

const SENSOR_ICONS: Record<SensorReading["kind"], Icon> = {
  ph: Droplets,
  ec: Waves,
  solution_temperature: Thermometer,
  air_temperature: Activity,
};

const VIEW_META: Record<View, { eyebrow: string; title: string; copy: string }> = {
  command: { eyebrow: "LIVE FARM OPERATIONS", title: "The farm is thinking clearly.", copy: "A unified view of crop health, AI reasoning and safety-controlled actions." },
  layers: { eyebrow: "DIGITAL TWIN · REPLAY", title: "Three layers. One trusted state.", copy: "Camera observations become structured evidence before they influence a decision." },
  decisions: { eyebrow: "EXPLAINABLE AI", title: "Every action earns its way forward.", copy: "Model proposals are typed, policy-checked and fully reviewable." },
  plan: { eyebrow: "SOURCE OF TRUTH", title: "A routine that learns from outcomes.", copy: "The active plan connects crop stage, human work and safe automation." },
  safety: { eyebrow: "HUMAN CONTROL POINT", title: "Control never leaves the operator.", copy: "Deterministic policy, alerts and fail-safe overrides stay outside the model." },
  audit: { eyebrow: "TRACEABILITY", title: "From evidence to outcome.", copy: "Every decision, approval and simulator result leaves an attributable record." },
};

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatTime(value: string, withDate = false) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    ...(withDate ? { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" } : { hour: "2-digit", minute: "2-digit" }),
  }).format(date);
}

function formatDateInput(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : "";
}

function buildTradeshowSnapshot(snapshot: DashboardSnapshot): DashboardSnapshot {
  const completedAt = "2026-07-26T00:21:18.000Z";
  const actions = snapshot.actions.map((action): ProposedAction => action.id === "action-dose-01" ? {
    ...action,
    status: "executed",
    decidedBy: "Tradeshow Operator",
    decidedAt: "2026-07-26T00:21:05.000Z",
    decisionComment: "Evidence reviewed during the guided tradeshow replay.",
    lifecycle: [
      ...action.lifecycle,
      { state: "executing", label: "Released to farm simulator", at: "2026-07-26T00:21:11.000Z" },
      { state: "executed", label: "Simulator outcome confirmed", at: completedAt },
    ],
  } : action);
  const demoAuditEvents: DashboardSnapshot["auditEvents"] = [
    { id: "tradeshow-audit-03", eventType: "simulator.executed", actor: "Farm Simulator", summary: "Completed approved 1.2 mL nutrient dose in safe replay", createdAt: completedAt },
    { id: "tradeshow-audit-02", eventType: "policy.allowed", actor: "Safety Policy Engine", summary: "Revalidated fresh evidence before simulator release", createdAt: "2026-07-26T00:21:11.000Z" },
    { id: "tradeshow-audit-01", eventType: "approval.approved", actor: "Tradeshow Operator", summary: "Approved nutrient dose after evidence review", createdAt: "2026-07-26T00:21:05.000Z" },
  ];
  return { ...snapshot, actions, auditEvents: [...demoAuditEvents, ...snapshot.auditEvents] };
}

function Badge({ children, tone = "mint" }: { children: React.ReactNode; tone?: "mint" | "amber" | "red" | "blue" | "quiet" }) {
  return <span className={"badge badge-" + tone}>{children}</span>;
}

function StatusBadge({ status }: { status: ActionStatus }) {
  const tone = status === "executed" || status === "approved" ? "mint" : status === "pending_approval" ? "amber" : status === "blocked" || status === "rejected" ? "red" : "quiet";
  return <Badge tone={tone}>{status === "pending_approval" ? "Needs approval" : titleCase(status)}</Badge>;
}

function Sparkline({ values, status = "optimal", safeRange }: { values: number[]; status?: string; safeRange?: [number, number] }) {
  const min = Math.min(...values, ...(safeRange ?? []));
  const max = Math.max(...values, ...(safeRange ?? []));
  const range = max - min || 1;
  const yFor = (value: number) => 36 - ((value - min) / range) * 30;
  const points = values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * 100;
    const y = yFor(value);
    return String(x) + "," + String(y);
  }).join(" ");
  const currentX = 100;
  const currentY = yFor(values.at(-1) ?? 0);
  const bandTop = safeRange ? Math.min(yFor(safeRange[0]), yFor(safeRange[1])) : 0;
  const bandHeight = safeRange ? Math.abs(yFor(safeRange[0]) - yFor(safeRange[1])) : 0;
  return (
    <svg className={"sparkline sparkline-" + status} viewBox="0 0 100 40" role="img" aria-label="Recent data trend">
      <line className="spark-grid" x1="0" y1="36" x2="100" y2="36" />
      {safeRange ? <rect className="spark-safe-band" x="0" y={bandTop} width="100" height={Math.max(bandHeight, 2)} rx="1.5" /> : null}
      <polygon className="spark-area" points={`0,36 ${points} 100,36`} />
      <polyline points={points} fill="none" vectorEffect="non-scaling-stroke" />
      <circle className="spark-current" cx={currentX} cy={currentY} r="2.4"><title>{`Current value: ${values.at(-1)}`}</title></circle>
    </svg>
  );
}

function SensorCard({ sensor }: { sensor: SensorReading }) {
  const IconComponent = SENSOR_ICONS[sensor.kind];
  const positive = sensor.trend >= 0;
  return (
    <article className={"sensor-card glass-card sensor-" + sensor.status} aria-label={`${sensor.label}: ${sensor.value} ${sensor.unit}; ${titleCase(sensor.status)}`}>
      <div className="sensor-top">
        <div className="sensor-heading">
          <span className="sensor-icon"><IconComponent size={18} /></span>
          <span className="card-kicker">{sensor.label}</span>
        </div>
        <span className="sensor-live-state"><span className={"live-dot live-" + sensor.status} />Live</span>
      </div>
      <div className="sensor-summary">
        <div className="sensor-reading"><strong>{sensor.value}</strong><span>{sensor.unit}</span></div>
        <span className={"sensor-delta sensor-delta-" + sensor.status}>{positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{positive ? "+" : ""}{sensor.trend}</span>
      </div>
      <div className="sensor-chart"><Sparkline values={sensor.sparkline} status={sensor.status} safeRange={sensor.safeRange} /></div>
      <div className="sensor-foot">
        <span>6h trend</span>
        <span>Target {sensor.safeRange[0]}–{sensor.safeRange[1]} {sensor.unit}</span>
      </div>
    </article>
  );
}

function SectionHeading({ kicker, title, action }: { kicker: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="section-heading">
      <div><span className="card-kicker">{kicker}</span><h2>{title}</h2></div>
      {action}
    </div>
  );
}

function ViewHeader({ view, lastUpdated }: { view: View; lastUpdated: string }) {
  const meta = VIEW_META[view];
  return (
    <header className="view-header">
      <div>
        <span className="eyebrow">{meta.eyebrow}</span>
        <h1>{meta.title}</h1>
        <p>{meta.copy}</p>
      </div>
      <div className="live-sync" role="status" aria-label={`Farm state synced at ${formatTime(lastUpdated)}`}>
        <span className="sync-rings"><span /></span>
        <div><small>STATE SYNC</small><strong>Live replay · {formatTime(lastUpdated)}</strong></div>
      </div>
    </header>
  );
}

function CommandCenter({ snapshot, onView }: { snapshot: DashboardSnapshot; onView: (view: View) => void }) {
  const pending = snapshot.actions.filter((item) => item.status === "pending_approval").length;
  const activeAlerts = snapshot.alerts.filter((item) => item.status === "active").length;
  const recommendation = snapshot.recommendations[0];
  const action = snapshot.actions[0];
  const progress = Math.round((snapshot.plan.currentDay / snapshot.plan.targetDays) * 100);
  return (
    <>
      <section className="hero-grid">
        <article className="farm-pulse glass-card" data-tour="farm-state">
          <video
            className="motion-video command-ambient-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/remotion-command-poster.webp"
            aria-hidden="true"
          >
            <source src="/remotion-command-ambient.mp4" type="video/mp4" />
          </video>
          <div className="pulse-copy">
            <div className="orbit-status">
              <div className="orbit-core"><Leaf size={30} /><span>{snapshot.systemStatus === "healthy" ? "98" : "74"}</span><small>FARM SCORE</small></div>
              <i className="orbit orbit-one" /><i className="orbit orbit-two" /><i className="orbit orbit-three" />
            </div>
            <div>
              <Badge tone={snapshot.automationMode === "running" ? "mint" : "amber"}>{titleCase(snapshot.automationMode)}</Badge>
              <h2>Everything important is inside the safety envelope.</h2>
              <p>Four sensor streams and three replay vision feeds were reconciled into one trusted Farm State.</p>
            </div>
          </div>
          <div className="pulse-metrics">
            <div><span>Next analysis</span><strong>{formatTime(snapshot.nextAnalysisAt)}</strong></div>
            <div><span>Open alerts</span><strong>{activeAlerts}</strong></div>
            <div><span>Pending approvals</span><strong>{pending}</strong></div>
          </div>
        </article>
        <article className="camera-hero glass-card">
          <img src="/remotion-canopy-poster.webp" alt="AI-generated simulated replay of the mature basil canopy with computer-vision overlays" />
          <video
            className="motion-video canopy-replay-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/remotion-canopy-poster.webp"
            aria-hidden="true"
          >
            <source src="/remotion-canopy-replay.mp4" type="video/mp4" />
          </video>
          <div className="camera-topline"><Badge tone="blue"><Camera size={12} /> SIMULATED REPLAY · LAYER 03</Badge><span>CV 87%</span></div>
          <div className="camera-caption"><span>Canopy coverage</span><strong>84%</strong><small>Attention threshold approaching</small></div>
        </article>
      </section>

      <section className="sensor-grid" aria-label="Current sensor readings">
        {snapshot.sensors.map((sensor) => <SensorCard key={sensor.id} sensor={sensor} />)}
      </section>

      <section className="command-grid">
        <article className="glass-card ai-focus">
          <SectionHeading kicker="HIGH-RISK AI PROPOSAL" title={recommendation.title} action={<StatusBadge status={action.status} />} />
          <p className="lead-copy">{recommendation.summary}</p>
          <div className="reason-box">
            <span><Sparkles size={18} /></span>
            <div><strong>Why the AI proposed this</strong><p>{recommendation.explanation}</p></div>
          </div>
          <div className="evidence-chips">{recommendation.evidence.map((item) => <span key={item}>{item}</span>)}</div>
          <div className="action-command">
            <div><span>FUNCTION</span><strong>{action.command}</strong></div>
            <div><span>TARGET</span><strong>{titleCase(action.target)}</strong></div>
            <div><span>PARAMETER</span><strong>{action.value} {action.unit}</strong></div>
            <div><span>RISK</span><strong className="text-amber">{titleCase(action.authoritativeRisk)}</strong></div>
          </div>
          <button className="text-button" type="button" onClick={() => onView("decisions")}>Review decision evidence <ChevronRight size={15} /></button>
        </article>

        <div className="command-side">
          <article className="glass-card plan-glance">
            <SectionHeading kicker="GROWING CYCLE" title={snapshot.plan.crop} action={<Badge>Day {snapshot.plan.currentDay}</Badge>} />
            <p>{snapshot.plan.cultivar} · {snapshot.plan.stage}</p>
            <div className="progress-orbit" style={{ "--progress": String(progress * 3.6) + "deg" } as React.CSSProperties}><span><strong>{progress}%</strong><small>COMPLETE</small></span></div>
            <div className="milestone"><CalendarDays size={17} /><div><small>NEXT MILESTONE</small><strong>{snapshot.plan.nextMilestone}</strong><span>{formatTime(snapshot.plan.nextMilestoneAt, true)}</span></div></div>
          </article>
          <article className="glass-card service-glance">
            <SectionHeading kicker="SYSTEM FABRIC" title="Service health" />
            <div className="service-mini-list">
              {snapshot.services.map((service) => (
                <div key={service.id}><span className={"service-dot service-" + service.status} /><div><strong>{service.label}</strong><small>{service.detail}</small></div><b>{service.latencyMs ? String(service.latencyMs) + "ms" : "OFF"}</b></div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </>
  );
}

function FarmLayers({ snapshot }: { snapshot: DashboardSnapshot }) {
  return (
    <section className="layer-grid" data-tour="evidence">
      {snapshot.layers.map((layer, index) => {
        const observation = snapshot.observations.find((item) => item.id === layer.observationId)!;
        return (
          <article className="layer-card glass-card" key={layer.id}>
            <div className="layer-camera">
              <img src={`/farm-layer-0${index + 1}.webp`} alt={"AI-generated simulated replay view for " + layer.name} />
              <div className="camera-scan" />
              <span className="corner corner-a" /><span className="corner corner-b" />
              <div className="camera-topline"><Badge tone="blue"><ScanLine size={12} /> REPLAY 0{index + 1}</Badge><span>{Math.round(observation.confidence * 100)}% CONF.</span></div>
              <div className="vision-box box-one"><span>{observation.canopyCoverage}%</span></div>
              <div className="vision-box box-two" />
            </div>
            <div className="layer-body">
              <SectionHeading kicker={"LEVEL 0" + (index + 1)} title={layer.name} action={<Badge tone={observation.crowdingRisk === "attention" ? "amber" : "mint"}>{titleCase(observation.crowdingRisk)}</Badge>} />
              <div className="layer-stats">
                <div><span>Canopy</span><strong>{observation.canopyCoverage}%</strong></div>
                <div><span>Plants</span><strong>{layer.cropCount}</strong></div>
                <div><span>Yellowing</span><strong>{titleCase(observation.yellowing)}</strong></div>
                <div><span>Image</span><strong>{titleCase(observation.imageQuality)}</strong></div>
              </div>
              <div className="device-list">
                {layer.devices.map((device) => {
                  const DeviceIcon = device.kind === "camera" ? Camera : device.kind === "light" ? Lightbulb : Fan;
                  return <div key={device.id}><span><DeviceIcon size={16} /></span><div><strong>{device.label}</strong><small>{device.detail}</small></div><Badge tone={device.status === "running" || device.status === "online" ? "mint" : device.status === "disabled" ? "red" : "quiet"}>{device.status}</Badge></div>;
                })}
              </div>
            </div>
          </article>
        );
      })}
      <div className="simulation-callout glass-card"><Eye size={19} /><div><strong>Replay evidence, not a live camera feed</strong><p>These sample frames demonstrate CV overlays and evidence gating. Physical camera integration remains disabled until the Farm interface and data-handling rules are approved.</p></div></div>
    </section>
  );
}

function DecisionDetail({ action, snapshot, busy, onClose, onDecision }: { action: ProposedAction; snapshot: DashboardSnapshot; busy: boolean; onClose: () => void; onDecision: (action: ProposedAction, decision: ApprovalRequest["decision"], comment: string) => void }) {
  const recommendation = snapshot.recommendations.find((item) => item.id === action.recommendationId);
  const [comment, setComment] = useState("");
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <aside className="decision-drawer" role="dialog" aria-modal="true" aria-labelledby="decision-drawer-title" data-tour="approval">
        <button className="close-button" type="button" onClick={onClose} aria-label="Close decision details" autoFocus><X size={18} /></button>
        <span className="eyebrow">DECISION · VERSION {action.version}</span>
        <h2 id="decision-drawer-title">{recommendation?.title ?? titleCase(action.command)}</h2>
        <div className="drawer-badges"><StatusBadge status={action.status} /><Badge tone={action.authoritativeRisk === "high" ? "red" : "mint"}>{action.authoritativeRisk} risk</Badge><Badge tone="quiet">{Math.round((recommendation?.confidence ?? 0) * 100)}% confidence</Badge></div>
        <p className="drawer-summary">{recommendation?.explanation}</p>
        <div className="policy-verdict">
          <ShieldCheck size={24} />
          <div><strong>Deterministic policy verdict</strong><p>{action.validation.allowed ? "Allowed after required controls." : "Blocked. This action cannot be approved."}</p><small>{action.validation.policyVersion}</small></div>
        </div>
        <div className="drawer-section"><span className="card-kicker">EVIDENCE</span>{recommendation?.evidence.map((item) => <div className="evidence-row" key={item}><Check size={14} />{item}</div>)}</div>
        <div className="drawer-section"><span className="card-kicker">POLICY REASONS</span>{action.validation.reasons.map((item) => <div className="evidence-row" key={item}><LockKeyhole size={14} />{item}</div>)}</div>
        <div className="drawer-section">
          <span className="card-kicker">DECISION LIFECYCLE</span>
          <div className="lifecycle">{action.lifecycle.map((event, index) => <div key={event.state + index}><span className={"life-dot life-" + event.state} /><div><strong>{event.label}</strong><small>{formatTime(event.at, true)}</small></div></div>)}</div>
        </div>
        {action.status === "pending_approval" ? (
          <div className="approval-box">
            <label htmlFor="approval-comment">Operator note</label>
            <textarea id="approval-comment" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add evidence or reasoning for this decision…" maxLength={500} />
            <div><button className="button-secondary" disabled={busy} type="button" onClick={() => onDecision(action, "reject", comment)}>Reject</button><button className="button-primary" disabled={busy} type="button" onClick={() => onDecision(action, "approve", comment)}>{busy ? "Revalidating…" : "Approve & simulate"}</button></div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function Decisions({ snapshot, onSelect }: { snapshot: DashboardSnapshot; onSelect: (action: ProposedAction) => void }) {
  const statuses = ["pending_approval", "executed", "blocked", "rejected"] as ActionStatus[];
  return (
    <section className="decision-board" data-tour="decision-board">
      <div className="decision-summary">
        <article className="glass-card"><Bot size={20} /><div><span>PROPOSED</span><strong>{snapshot.actions.length}</strong><small>Typed AI actions</small></div></article>
        <article className="glass-card"><ClipboardCheck size={20} /><div><span>HUMAN REVIEW</span><strong>{snapshot.actions.filter((item) => item.status === "pending_approval").length}</strong><small>High-risk queue</small></div></article>
        <article className="glass-card"><Zap size={20} /><div><span>AUTO PATH</span><strong>{snapshot.actions.filter((item) => item.status === "executed").length}</strong><small>Low-risk simulator</small></div></article>
        <article className="glass-card"><ShieldX size={20} /><div><span>BLOCKED</span><strong>{snapshot.actions.filter((item) => item.status === "blocked").length}</strong><small>Policy protected</small></div></article>
      </div>
      <div className="decision-columns">
        {statuses.map((status) => {
          const actions = snapshot.actions.filter((item) => item.status === status);
          const label = status === "pending_approval" ? "Needs review" : titleCase(status);
          return (
            <div className={"decision-column" + (actions.length === 0 ? " is-empty" : "")} key={status} aria-label={`${label} decisions`}>
              <div className="column-head"><span>{label}</span><b>{actions.length}</b></div>
              {actions.length === 0 ? (
                <div className="decision-empty">
                  <ClipboardCheck size={20} />
                  <strong>No {label.toLowerCase()} actions</strong>
                  <span>This lane will update when decision status changes.</span>
                </div>
              ) : actions.map((action) => {
                const recommendation = snapshot.recommendations.find((item) => item.id === action.recommendationId);
                return (
                  <button className="decision-card glass-card" type="button" key={action.id} onClick={() => onSelect(action)} aria-label={`View decision: ${recommendation?.title ?? titleCase(action.command)}`}>
                    <div><span className={"decision-glyph risk-" + action.authoritativeRisk}>{status === "blocked" || status === "rejected" ? <ShieldX size={18} /> : status === "executed" ? <Zap size={18} /> : <Bot size={18} />}</span><StatusBadge status={action.status} /></div>
                    <h3>{recommendation?.title}</h3><p>{recommendation?.summary}</p>
                    <div className="risk-comparison"><span>AI: {action.suggestedRisk}</span><ChevronRight size={13} /><strong>Policy: {action.authoritativeRisk}</strong></div>
                    <div className="card-footer"><span>{action.command} · {action.value} {action.unit}</span><ChevronRight size={16} /></div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function GrowingPlanView({ snapshot, onSave, busy }: { snapshot: DashboardSnapshot; onSave: (payload: GrowingPlanUpdateRequest) => void; busy: boolean }) {
  const [editing, setEditing] = useState(false);
  const [stage, setStage] = useState(snapshot.plan.stage);
  const [milestone, setMilestone] = useState(snapshot.plan.nextMilestone);
  const [date, setDate] = useState(formatDateInput(snapshot.plan.nextMilestoneAt));
  const progress = Math.round((snapshot.plan.currentDay / snapshot.plan.targetDays) * 100);
  useEffect(() => {
    if (!editing) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setEditing(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [editing]);
  return (
    <section className="plan-layout">
      <article className="glass-card plan-hero">
        <div>
          <Badge tone="mint"><Leaf size={12} /> ACTIVE ROUTINE</Badge>
          <h2>{snapshot.plan.cultivar} sweet basil</h2><p>{snapshot.plan.stage} · Day {snapshot.plan.currentDay} of {snapshot.plan.targetDays}</p>
        </div>
        <div className="plan-meter"><span style={{ width: String(progress) + "%" }} /><i style={{ left: String(progress) + "%" }} /></div>
        <div className="plan-scale"><span>TRANSPLANT</span><span>VEGETATIVE</span><span>MATURITY</span><span>HARVEST</span></div>
        <div className="plan-hero-foot"><div><small>NEXT HUMAN TASK</small><strong>{snapshot.plan.nextMilestone}</strong><span>{formatTime(snapshot.plan.nextMilestoneAt, true)}</span></div><button className="button-secondary" type="button" onClick={() => setEditing(true)}><Settings2 size={15} /> Edit plan</button></div>
      </article>
      <article className="glass-card schedule-card">
        <SectionHeading kicker="36-DAY ROUTINE" title="Milestones & control points" action={<Badge tone="quiet">{snapshot.schedule.length} events</Badge>} />
        <div className="schedule-line">
          {snapshot.schedule.map((event) => (
            <div className={"schedule-event schedule-" + event.status} key={event.id}>
              <span className="schedule-node">{event.status === "complete" ? <Check size={13} /> : event.day}</span>
              <div><div><Badge tone={event.category === "manual" ? "amber" : event.category === "automatic" ? "blue" : event.category === "harvest" ? "mint" : "quiet"}>{event.category}</Badge><small>DAY {event.day}</small></div><h3>{event.title}</h3><p>{event.detail}</p></div>
            </div>
          ))}
        </div>
      </article>
      <aside className="plan-aside">
        <article className="glass-card outcome-card"><SectionHeading kicker="YIELD FORECAST" title={(snapshot.harvestForecast.expectedYieldGrams / 1000).toFixed(2) + " kg"} action={<Badge tone="mint">{Math.round(snapshot.harvestForecast.confidence * 100)}% confidence</Badge>} /><Sparkline values={[3.7, 3.82, 3.94, 4.1, 4.22, 4.35, 4.44, 4.58]} /><p>Expected {formatTime(snapshot.harvestForecast.expectedDate, true)} · range {(snapshot.harvestForecast.rangeGrams[0] / 1000).toFixed(2)}–{(snapshot.harvestForecast.rangeGrams[1] / 1000).toFixed(2)} kg</p>{snapshot.harvestForecast.drivers.map((driver) => <div className="driver" key={driver}><ArrowUpRight size={13} />{driver}</div>)}</article>
        <article className="glass-card boundary-card"><LockKeyhole size={20} /><div><strong>Manual boundary retained</strong><p>NFT channel spacing remains a human task. Leafy AI may recommend timing, but cannot execute a physical change.</p></div></article>
      </aside>
      {editing ? (
        <div className="modal-backdrop" role="presentation">
          <form className="modal-card" role="dialog" aria-modal="true" aria-labelledby="plan-editor-title" onSubmit={(event) => { event.preventDefault(); onSave({ stage, nextMilestone: milestone, nextMilestoneAt: new Date(date + "T02:00:00.000Z").toISOString() }); setEditing(false); }}>
            <button className="close-button" type="button" onClick={() => setEditing(false)} aria-label="Close plan editor"><X size={18} /></button>
            <span className="eyebrow">GROWING PLAN</span><h2 id="plan-editor-title">Update the active routine</h2><p>Changes are persisted as the system source of truth and recorded in the audit trail.</p>
            <label>Growth stage<input value={stage} onChange={(event) => setStage(event.target.value)} required maxLength={80} autoFocus /></label>
            <label>Next milestone<input value={milestone} onChange={(event) => setMilestone(event.target.value)} required maxLength={140} /></label>
            <label>Milestone date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
            <div className="modal-actions"><button className="button-secondary" type="button" onClick={() => setEditing(false)}>Cancel</button><button className="button-primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save & audit"}</button></div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function SafetyView({ snapshot, busy, onAcknowledge, onOverride }: { snapshot: DashboardSnapshot; busy: string | null; onAcknowledge: (alert: FarmAlert) => void; onOverride: (request: OverrideRequest) => void }) {
  const [override, setOverride] = useState<OverrideRequest["mode"] | null>(null);
  const [reason, setReason] = useState("");
  const currentMode = snapshot.automationMode;
  useEffect(() => {
    if (!override) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOverride(null);
        setReason("");
      }
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [override]);
  function submitOverride() {
    if (!override || reason.trim().length < 4) return;
    onOverride({ mode: override, reason });
    setOverride(null); setReason("");
  }
  return (
    <section className="safety-layout">
      <article className={"safety-state glass-card mode-" + currentMode}>
        <div className="safety-emblem">{currentMode === "running" ? <ShieldCheck size={38} /> : currentMode === "paused" ? <Pause size={38} /> : <Power size={38} />}</div>
        <div><span className="card-kicker">AUTOMATION STATE</span><h2>{currentMode === "running" ? "Policy-controlled simulation is active" : currentMode === "paused" ? "Automation is paused" : "Emergency stop is engaged"}</h2><p>{currentMode === "running" ? "Low-risk actions may execute through the simulator after deterministic validation. Pumps always require approval." : "Monitoring and evidence collection continue while actuator automation remains restricted."}</p></div>
        <Badge tone={currentMode === "running" ? "mint" : currentMode === "paused" ? "amber" : "red"}>{titleCase(currentMode)}</Badge>
      </article>
      <div className="safety-main">
        <article className="glass-card alert-card">
          <SectionHeading kicker="ACTIVE SIGNALS" title="Alerts" action={<Badge tone={snapshot.alerts.some((item) => item.status === "active") ? "amber" : "mint"}>{snapshot.alerts.filter((item) => item.status === "active").length} open</Badge>} />
          <div className="alert-list">
            {snapshot.alerts.map((alert) => (
              <div className={"alert-row alert-" + alert.severity} key={alert.id}>
                <span>{alert.severity === "critical" ? <TriangleAlert size={18} /> : alert.severity === "warning" ? <AlertTriangle size={18} /> : <Bell size={18} />}</span>
                <div><div><strong>{alert.title}</strong><Badge tone={alert.status === "active" ? "amber" : "quiet"}>{alert.status}</Badge></div><p>{alert.detail}</p><small>{alert.source} · {formatTime(alert.createdAt, true)}</small></div>
                {alert.status === "active" ? <button type="button" className="button-secondary compact-button" disabled={busy === alert.id} onClick={() => onAcknowledge(alert)}>{busy === alert.id ? "Recording…" : "Acknowledge"}</button> : <span className="ack-mark"><Check size={15} /></span>}
              </div>
            ))}
          </div>
        </article>
        <article className="glass-card policy-card" data-tour="policy">
          <SectionHeading kicker="DETERMINISTIC GATE" title="Safety policy" action={<Badge tone="mint">2026.2</Badge>} />
          <div className="policy-flow">
            <div><Bot size={18} /><span>AI proposal</span><small>Untrusted</small></div><ChevronRight size={16} />
            <div className="flow-active"><ShieldCheck size={18} /><span>Policy engine</span><small>Authoritative</small></div><ChevronRight size={16} />
            <div><UserRound size={18} /><span>Human approval</span><small>When required</small></div><ChevronRight size={16} />
            <div><CloudCog size={18} /><span>Simulator</span><small>No hardware</small></div>
          </div>
          <div className="rule-list">
            <div><Check size={15} /><span>Allow-listed functions and strict units</span></div>
            <div><Check size={15} /><span>Fresh sensor evidence and rolling trends</span></div>
            <div><Check size={15} /><span>Pump actions always require human approval</span></div>
            <div><Check size={15} /><span>Blocked actions cannot be overridden</span></div>
          </div>
        </article>
      </div>
      <aside className="safety-aside">
        <article className="glass-card override-card">
          <SectionHeading kicker="MANUAL CONTROL" title="Farm override" />
          <p>Overrides change simulator state only. Every use requires a reason and creates an audit event.</p>
          {currentMode === "running" ? <button className="button-secondary full-button" type="button" onClick={() => setOverride("pause")}><Pause size={16} /> Pause automation</button> : <button className="button-primary full-button" type="button" onClick={() => setOverride("resume")}><Play size={16} /> Resume automation</button>}
          <button className="danger-button full-button" type="button" onClick={() => setOverride("emergency_stop")}><Power size={16} /> Emergency stop</button>
        </article>
        <article className="glass-card integration-card"><SectionHeading kicker="INTEGRATIONS" title="Service fabric" />{snapshot.services.map((service) => <div key={service.id}><span className={"service-dot service-" + service.status} /><div><strong>{service.label}</strong><small>{service.detail}</small></div></div>)}</article>
      </aside>
      {override ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-card override-modal" role="dialog" aria-modal="true" aria-labelledby="override-dialog-title">
            <button className="close-button" type="button" onClick={() => setOverride(null)} aria-label="Close override confirmation"><X size={18} /></button>
            <span className="eyebrow">{override === "emergency_stop" ? "FAIL-SAFE ACTION" : "MANUAL OVERRIDE"}</span>
            <h2 id="override-dialog-title">{override === "emergency_stop" ? "Engage emergency stop?" : titleCase(override) + " automation?"}</h2>
            <p>{override === "emergency_stop" ? "All simulated actuator devices will enter a disabled safety state. Monitoring remains active." : "The change applies to simulation state only and will be fully audited."}</p>
            <label>Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why is this override necessary?" maxLength={240} autoFocus /></label>
            <div className="modal-actions"><button className="button-secondary" type="button" onClick={() => setOverride(null)}>Cancel</button><button className={override === "emergency_stop" ? "danger-button" : "button-primary"} disabled={busy === "override" || reason.trim().length < 4} type="button" onClick={submitOverride}>{busy === "override" ? "Applying…" : "Confirm & audit"}</button></div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function AuditView({ snapshot }: { snapshot: DashboardSnapshot }) {
  const [filter, setFilter] = useState("all");
  const events = filter === "all" ? snapshot.auditEvents : snapshot.auditEvents.filter((item) => item.eventType.startsWith(filter));
  function exportCsv() {
    const rows = [["Time", "Type", "Actor", "Summary"], ...snapshot.auditEvents.map((item) => [item.createdAt, item.eventType, item.actor, item.summary])];
    const csv = rows.map((row) => row.map((cell) => "\"" + String(cell).replaceAll("\"", "\"\"") + "\"").join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "leafy-ai-audit.csv"; anchor.click(); URL.revokeObjectURL(url);
  }
  return (
    <section className="audit-layout">
      <article className="glass-card audit-card" data-tour="audit">
        <SectionHeading kicker="APPEND-ONLY EVENTS" title="Decision timeline" action={<button className="button-secondary compact-button" type="button" onClick={exportCsv}><Download size={14} /> Export CSV</button>} />
        <div className="audit-filters">{["all", "policy", "approval", "simulator", "override", "plan"].map((item) => <button className={filter === item ? "active" : ""} type="button" key={item} onClick={() => setFilter(item)}>{titleCase(item)}</button>)}</div>
        <div className="audit-list">
          {events.length ? events.map((event) => {
            const EventIcon = event.eventType.startsWith("policy") ? ShieldCheck : event.eventType.startsWith("approval") ? UserRound : event.eventType.startsWith("simulator") ? Zap : event.eventType.startsWith("override") ? Power : History;
            return <div className="audit-row" key={event.id}><span><EventIcon size={16} /></span><div><strong>{event.summary}</strong><small>{event.actor} · {titleCase(event.eventType)}</small></div><time>{formatTime(event.createdAt, true)}</time></div>;
          }) : <div className="empty-state"><History size={22} /><strong>No events in this filter</strong><span>Choose another event type.</span></div>}
        </div>
      </article>
      <aside className="outcome-stack">
        <article className="glass-card forecast-card">
          <span className="card-kicker">CURRENT FORECAST</span><h2>{(snapshot.harvestForecast.expectedYieldGrams / 1000).toFixed(2)}<small>kg</small></h2>
          <Sparkline values={[3.72, 3.84, 3.96, 4.14, 4.22, 4.35, 4.47, 4.58]} />
          <div className="forecast-band"><span>Confidence</span><strong>{Math.round(snapshot.harvestForecast.confidence * 100)}%</strong></div>
          <p>Forecasts are advisory and will be evaluated against recorded harvest outcomes.</p>
        </article>
        <article className="glass-card history-card">
          <SectionHeading kicker="HARVEST OUTCOMES" title="Previous cycles" />
          {snapshot.harvestOutcomes.map((outcome, index) => <div className="harvest-row" key={outcome.id}><span>{index + 1}</span><div><strong>{(outcome.yieldGrams / 1000).toFixed(2)} kg</strong><small>{formatTime(outcome.harvestedAt, true)}</small><p>{outcome.notes}</p></div>{index === 0 ? <ArrowUpRight size={17} className="text-mint" /> : <ArrowDownRight size={17} />}</div>)}
        </article>
        <article className="glass-card trace-card"><Gauge size={19} /><div><strong>End-to-end evidence</strong><p>Monitor → recommend → validate → approve → simulate → audit → learn.</p></div></article>
      </aside>
    </section>
  );
}

export function LeafyDashboard() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(DEMO_SNAPSHOT);
  const [view, setView] = useState<View>("command");
  const [selectedAction, setSelectedAction] = useState<ProposedAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [tradeshowActive, setTradeshowActive] = useState(false);
  const [tradeshowStep, setTradeshowStep] = useState<TradeshowStep>(0);
  const [tradeshowOutcome, setTradeshowOutcome] = useState(false);
  const [backstageOpen, setBackstageOpen] = useState(false);
  const [backstageState, setBackstageState] = useState(createEmptyBackstageState);
  const backstageSequence = useRef(0);
  const backstageSnapshot = useMemo(
    () => applyBackstageInputs(snapshot, backstageState),
    [snapshot, backstageState],
  );
  const displaySnapshot = useMemo(
    () => tradeshowOutcome ? buildTradeshowSnapshot(backstageSnapshot) : backstageSnapshot,
    [backstageSnapshot, tradeshowOutcome],
  );
  const backstageInputCount = useMemo(() => activeBackstageInputCount(backstageState), [backstageState]);

  async function refresh() {
    setSnapshot(DEMO_SNAPSHOT);
    setBackstageState(createEmptyBackstageState());
    backstageSequence.current = 0;
    setTradeshowOutcome(false);
    setSelectedAction(null);
    setNotice("Tradeshow replay reset to its trusted starting state.");
  }

  async function postMutation(url: string, method: "POST" | "PATCH", payload: unknown, key: string, success: string) {
    void url;
    void method;
    void payload;
    setBusy(key); setNotice(null);
    setNotice(`${success} Tradeshow safe mode kept the change in this browser replay only.`);
    setBusy(null);
  }

  async function decide(action: ProposedAction, decision: ApprovalRequest["decision"], comment: string) {
    if (tradeshowActive && action.id === "action-dose-01" && decision === "approve") {
      completeTradeshowApproval();
      return;
    }
    if (backstageState.tasks.some((task) => task.id === action.id)) {
      setBackstageState((current) => ({
        ...current,
        tasks: current.tasks.map((task) => task.id === action.id ? { ...task, status: decision === "approve" ? "executed" : "rejected" } : task),
      }));
      setSelectedAction(null);
      setNotice(decision === "approve" ? "Synthetic task approved and completed in the browser-only simulator." : "Synthetic task rejected and moved to the stopped lane.");
      return;
    }
    await postMutation("/api/approvals", "POST", { actionId: action.id, version: action.version, decision, comment } satisfies ApprovalRequest, action.id, decision === "approve" ? "Action revalidated and completed safely in the simulator." : "The proposal was rejected in the replay.");
    setSelectedAction(null);
  }

  async function acknowledge(alert: FarmAlert) {
    await postMutation("/api/alerts/ack", "POST", { alertId: alert.id, comment: "Acknowledged from the Leafy AI control center." }, alert.id, "Alert acknowledged and added to the audit trail.");
  }

  const pending = useMemo(() => displaySnapshot.actions.filter((item) => item.status === "pending_approval").length, [displaySnapshot.actions]);
  const activeAlerts = useMemo(() => displaySnapshot.alerts.filter((item) => item.status === "active").length, [displaySnapshot.alerts]);
  useEffect(() => {
    function closeNavigationOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileMoreOpen(false);
    }
    document.addEventListener("keydown", closeNavigationOnEscape);
    return () => document.removeEventListener("keydown", closeNavigationOnEscape);
  }, []);

  function navigate(nextView: View) {
    setView(nextView);
    setMobileMoreOpen(false);
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  function restartTradeshow() {
    setTradeshowActive(true);
    setTradeshowStep(0);
    setTradeshowOutcome(false);
    setSelectedAction(null);
    setNotice(null);
    navigate("command");
  }

  function openBackstage() {
    setSelectedAction(null);
    setMobileMoreOpen(false);
    setBackstageOpen(true);
  }

  function applyBackstagePreset(preset: BackstagePreset) {
    setBackstageState(createBackstagePreset(preset));
    setTradeshowOutcome(false);
    setSelectedAction(null);
    setNotice(preset === "baseline" ? "Trusted replay baseline restored." : "Tradeshow scene loaded into browser memory only.");
  }

  function addBackstageTask(draft: BackstageTaskDraft) {
    backstageSequence.current += 1;
    const sequence = backstageSequence.current;
    const createdAt = new Date(Date.parse("2026-07-26T00:25:00.000Z") + sequence * 1000).toISOString();
    const task = createBackstageTask(draft, { id: `backstage-task-custom-${sequence}`, createdAt });
    setBackstageState((current) => ({ ...current, sceneLabel: null, tasks: [task, ...current.tasks] }));
    setTradeshowOutcome(false);
    setNotice("Synthetic AI task injected. It is now visible in AI Decisions.");
  }

  function setBackstageSensor(override: SensorOverride) {
    setBackstageState((current) => ({
      ...current,
      sceneLabel: null,
      sensorOverrides: [override, ...current.sensorOverrides.filter((sensor) => sensor.kind !== override.kind)],
    }));
    setTradeshowOutcome(false);
    setNotice("Synthetic sensor snapshot injected into the product views.");
  }

  function exitTradeshow() {
    setTradeshowActive(false);
    setTradeshowStep(0);
    setTradeshowOutcome(false);
    setSelectedAction(null);
    setNotice(null);
  }

  function completeTradeshowApproval() {
    setTradeshowOutcome(true);
    setSelectedAction(null);
    setTradeshowStep(4);
    setNotice("Approval revalidated and completed in the tradeshow simulator. No stored data changed.");
    navigate("safety");
  }

  function advanceTradeshow() {
    if (tradeshowStep === 0) {
      setTradeshowStep(1);
      navigate("layers");
      return;
    }
    if (tradeshowStep === 1) {
      setTradeshowStep(2);
      navigate("decisions");
      return;
    }
    if (tradeshowStep === 2) {
      const action = displaySnapshot.actions.find((item) => item.id === "action-dose-01");
      if (action) {
        setSelectedAction(action);
        setTradeshowStep(3);
      }
      return;
    }
    if (tradeshowStep === 3) {
      completeTradeshowApproval();
      return;
    }
    if (tradeshowStep === 4) {
      setTradeshowStep(5);
      navigate("audit");
    }
  }

  return (
    <div className="app-shell" data-tradeshow-step={tradeshowActive ? tradeshowStep : undefined}>
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-logo-wide" src="/ctrl-plant-logo.webp" alt="Ctrl+Plant team" />
          <img className="brand-logo-mark" src="/ctrl-plant-mark.webp" alt="" aria-hidden="true" />
          <small>LEAFY AI · APPLE TRADESHOW · V0.2</small>
        </div>
        <div className="workspace-pill"><span className="status-beacon" /><div><small>ACTIVE WORKSPACE</small><strong>Basil Bay 01</strong></div><ChevronRight size={15} /></div>
        <nav className="primary-nav" aria-label="Primary navigation">
          <span className="nav-label">FARM OPERATIONS</span>
          {NAV.map((item) => {
            const IconComponent = item.icon;
            return <button type="button" key={item.id} className={view === item.id ? "active" : ""} onClick={() => navigate(item.id)} aria-label={item.label} aria-current={view === item.id ? "page" : undefined}><IconComponent size={18} /><span>{item.label}</span>{item.id === "decisions" && pending ? <b>{pending}</b> : item.id === "safety" && activeAlerts ? <b className="alert-count">{activeAlerts}</b> : null}</button>;
          })}
        </nav>
        <div className="sidebar-spacer" />
        <div className="simulation-panel"><div><ShieldCheck size={18} /><Badge tone="blue">SIMULATION</Badge></div><strong>Physical control disabled</strong><p>All actions stop at the verified farm simulator boundary.</p></div>
        <div className="user-card"><span>D</span><div><strong>Demo operator</strong><small>Local-only demo identity</small></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button type="button" className="mobile-brand" onClick={() => navigate("command")}><img src="/ctrl-plant-mark.webp" alt="" aria-hidden="true" /><span><strong>CTRL+PLANT</strong><small>LEAFY AI FARM OPS</small></span></button>
          <div className="crumb"><span>CTRL+PLANT</span><ChevronRight size={13} /><strong>{NAV.find((item) => item.id === view)?.label}</strong></div>
          <div className="top-actions">
            <span className="tradeshow-mode-chip"><Sparkles size={13} /> Safe replay</span>
            <button className="backstage-trigger" type="button" onClick={openBackstage} aria-label={`Open demo backstage${backstageInputCount ? `, ${backstageInputCount} synthetic inputs active` : ""}`} aria-haspopup="dialog">
              <SlidersHorizontal size={16} /><span>Backstage</span>{backstageInputCount ? <b>{backstageInputCount}</b> : null}
            </button>
            <span className={"mode-indicator mode-" + displaySnapshot.automationMode} role="status" aria-label={`Automation mode: ${titleCase(displaySnapshot.automationMode)}`}><span />{titleCase(displaySnapshot.automationMode)}</span>
            <button className="icon-button" type="button" onClick={() => navigate("safety")} aria-label="Open alerts"><Bell size={17} />{activeAlerts ? <b>{activeAlerts}</b> : null}</button>
            <button className="icon-button" type="button" onClick={() => { setLoading(true); refresh().finally(() => setLoading(false)); }} aria-label="Refresh farm state"><RefreshCw size={17} className={loading ? "spin" : ""} /></button>
          </div>
        </header>

        <div className="page-wrap" aria-busy={loading}>
          {loading ? <div className="loading-rail" aria-label="Refreshing farm state"><span /></div> : null}
          {notice ? <div className="notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notice"><X size={16} /></button></div> : null}
          <ViewHeader view={view} lastUpdated={displaySnapshot.lastUpdatedAt} />
          <div className="view-stage" key={view}>
            {view === "command" ? <CommandCenter snapshot={displaySnapshot} onView={navigate} /> : null}
            {view === "layers" ? <FarmLayers snapshot={displaySnapshot} /> : null}
            {view === "decisions" ? <Decisions snapshot={displaySnapshot} onSelect={setSelectedAction} /> : null}
            {view === "plan" ? <GrowingPlanView snapshot={displaySnapshot} busy={busy === "plan"} onSave={(payload) => void postMutation("/api/growing-plan", "PATCH", payload, "plan", "Growing plan updated in the replay.")} /> : null}
            {view === "safety" ? <SafetyView snapshot={displaySnapshot} busy={busy} onAcknowledge={(alert) => void acknowledge(alert)} onOverride={(request) => void postMutation("/api/overrides", "POST", request, "override", "Simulator automation state updated in the replay.")} /> : null}
            {view === "audit" ? <AuditView snapshot={displaySnapshot} /> : null}
          </div>
        </div>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {NAV.slice(0, 4).map((item) => { const IconComponent = item.icon; return <button type="button" key={item.id} className={view === item.id ? "active" : ""} onClick={() => navigate(item.id)} aria-label={item.label} aria-current={view === item.id ? "page" : undefined}><IconComponent size={19} /><span>{item.short}</span>{item.id === "decisions" && pending ? <b>{pending}</b> : null}</button>; })}
        <button type="button" className={view === "safety" || view === "audit" || mobileMoreOpen ? "active" : ""} onClick={() => setMobileMoreOpen((open) => !open)} aria-label="More navigation" aria-expanded={mobileMoreOpen} aria-controls="mobile-more-menu"><MoreHorizontal size={20} /><span>More</span>{activeAlerts ? <b className="alert-count">{activeAlerts}</b> : null}</button>
      </nav>

      {mobileMoreOpen ? (
        <div className="mobile-more-menu" id="mobile-more-menu" role="navigation" aria-label="Additional navigation">
          {NAV.slice(4).map((item) => { const IconComponent = item.icon; return <button type="button" key={item.id} className={view === item.id ? "active" : ""} onClick={() => navigate(item.id)} aria-label={item.label} aria-current={view === item.id ? "page" : undefined}><span><IconComponent size={20} /></span><div><strong>{item.label}</strong><small>{VIEW_META[item.id].copy}</small></div><ChevronRight size={17} /></button>; })}
        </div>
      ) : null}

      <TradeshowTour
        active={tradeshowActive}
        step={tradeshowStep}
        onStart={restartTradeshow}
        onNext={advanceTradeshow}
        onExit={exitTradeshow}
        onRestart={restartTradeshow}
      />

      <TradeshowBackstage
        open={backstageOpen}
        state={backstageState}
        onClose={() => setBackstageOpen(false)}
        onApplyPreset={applyBackstagePreset}
        onSetMode={(mode) => {
          setBackstageState((current) => ({ ...current, sceneLabel: null, automationMode: mode }));
          setTradeshowOutcome(false);
          setNotice(`Synthetic automation mode set to ${titleCase(mode)}.`);
        }}
        onSetSensor={setBackstageSensor}
        onAddTask={addBackstageTask}
        onRemoveTask={(id) => setBackstageState((current) => ({ ...current, sceneLabel: null, tasks: current.tasks.filter((task) => task.id !== id) }))}
        onRemoveSensor={(kind) => setBackstageState((current) => ({ ...current, sceneLabel: null, sensorOverrides: current.sensorOverrides.filter((sensor) => sensor.kind !== kind) }))}
        onClearMode={() => setBackstageState((current) => ({ ...current, sceneLabel: null, automationMode: null }))}
        onReset={() => {
          setBackstageState(createEmptyBackstageState());
          setTradeshowOutcome(false);
          setNotice("All synthetic input cleared. Trusted replay baseline restored.");
        }}
        onPresentState={() => { setBackstageOpen(false); navigate("command"); }}
        onPresentTasks={() => { setBackstageOpen(false); navigate("decisions"); }}
      />

      {selectedAction ? <DecisionDetail action={selectedAction} snapshot={displaySnapshot} busy={busy === selectedAction.id} onClose={() => setSelectedAction(null)} onDecision={(action, decision, comment) => void decide(action, decision, comment)} /> : null}
    </div>
  );
}
