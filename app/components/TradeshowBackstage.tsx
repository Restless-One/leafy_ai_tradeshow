"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Activity,
  Bot,
  Check,
  DatabaseZap,
  Gauge,
  ListPlus,
  Pause,
  Play,
  Power,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { AutomationMode, HealthStatus, SensorKind } from "@/lib/domain";
import type {
  BackstagePreset,
  BackstageState,
  BackstageTaskDraft,
  SensorOverride,
} from "./tradeshow-state";
import { activeBackstageInputCount } from "./tradeshow-state";

type BackstageTab = "scenes" | "state" | "task";

const SENSOR_DEFAULTS: Record<SensorKind, { label: string; value: number; trend: number }> = {
  air_temperature: { label: "Air temperature", value: 28.4, trend: 2.8 },
  solution_temperature: { label: "Solution temperature", value: 24.6, trend: 1.0 },
  ph: { label: "pH", value: 6.7, trend: .5 },
  ec: { label: "EC", value: 1.08, trend: -.38 },
};

const PRESETS: Array<{ id: BackstagePreset; title: string; copy: string; tone: string }> = [
  { id: "baseline", title: "Healthy baseline", copy: "Clear all synthetic input and return to the trusted replay.", tone: "green" },
  { id: "heat_spike", title: "Rising heat", copy: "Critical air temperature plus a fan task awaiting review.", tone: "orange" },
  { id: "ec_drift", title: "EC drift", copy: "Critical nutrient state plus a high-risk dosing proposal.", tone: "blue" },
  { id: "paused_review", title: "Paused review", copy: "Attention state with automation held for operator review.", tone: "gray" },
];

const ACTUATOR_DEFAULTS: Record<BackstageTaskDraft["actuator"], { target: string; value: number; unit: string }> = {
  fan: { target: "layer_3", value: 20, unit: "minutes" },
  light: { target: "layer_2", value: 65, unit: "percent" },
  irrigation_pump: { target: "layer_1", value: 8, unit: "minutes" },
  dosing_pump: { target: "shared_reservoir", value: 1.2, unit: "millilitres" },
};

function labelValue(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function TradeshowBackstage({
  open,
  state,
  onClose,
  onApplyPreset,
  onSetMode,
  onSetSensor,
  onAddTask,
  onRemoveTask,
  onRemoveSensor,
  onClearMode,
  onReset,
  onPresentState,
  onPresentTasks,
}: {
  open: boolean;
  state: BackstageState;
  onClose: () => void;
  onApplyPreset: (preset: BackstagePreset) => void;
  onSetMode: (mode: AutomationMode) => void;
  onSetSensor: (override: SensorOverride) => void;
  onAddTask: (task: BackstageTaskDraft) => void;
  onRemoveTask: (id: string) => void;
  onRemoveSensor: (kind: SensorKind) => void;
  onClearMode: () => void;
  onReset: () => void;
  onPresentState: () => void;
  onPresentTasks: () => void;
}) {
  const [tab, setTab] = useState<BackstageTab>("scenes");
  const [sensorKind, setSensorKind] = useState<SensorKind>("air_temperature");
  const [sensorValue, setSensorValue] = useState(SENSOR_DEFAULTS.air_temperature.value);
  const [sensorTrend, setSensorTrend] = useState(SENSOR_DEFAULTS.air_temperature.trend);
  const [sensorStatus, setSensorStatus] = useState<HealthStatus>("critical");
  const [task, setTask] = useState<BackstageTaskDraft>({
    title: "Increase airflow on Layer 3",
    summary: "Run the Layer 3 fan, then request a fresh air-temperature reading.",
    actuator: "fan",
    target: "layer_3",
    value: 20,
    unit: "minutes",
    status: "pending_approval",
    risk: "medium",
  });

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  function changeSensorKind(kind: SensorKind) {
    setSensorKind(kind);
    setSensorValue(SENSOR_DEFAULTS[kind].value);
    setSensorTrend(SENSOR_DEFAULTS[kind].trend);
  }

  function changeActuator(actuator: BackstageTaskDraft["actuator"]) {
    const defaults = ACTUATOR_DEFAULTS[actuator];
    setTask((current) => ({ ...current, actuator, ...defaults }));
  }

  function submitSensor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSetSensor({
      kind: sensorKind,
      value: Number(sensorValue),
      trend: Number(sensorTrend),
      status: sensorStatus,
      recordedAt: "2026-07-26T00:25:00.000Z",
    });
  }

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAddTask(task);
  }

  const activeCount = activeBackstageInputCount(state);

  return (
    <div className="backstage-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <aside className="backstage-drawer" role="dialog" aria-modal="true" aria-labelledby="backstage-title">
        <header className="backstage-head">
          <div className="backstage-title-row">
            <span className="backstage-app-icon"><DatabaseZap size={21} /></span>
            <div><span className="eyebrow">TRADESHOW CONTROL SURFACE</span><h2 id="backstage-title">Demo Backstage</h2></div>
          </div>
          <button className="close-button backstage-close" type="button" onClick={onClose} aria-label="Close demo backstage" autoFocus><X size={18} /></button>
          <div className="backstage-safety-note"><ShieldCheck size={15} /><span><strong>Browser memory only.</strong> No API, database or farm hardware is connected.</span></div>
        </header>

        <div className="backstage-tabs" role="tablist" aria-label="Backstage tools">
          {([
            ["scenes", Sparkles, "Scenes"],
            ["state", Gauge, "Farm state"],
            ["task", ListPlus, "AI task"],
          ] as const).map(([id, Icon, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><Icon size={16} /><span>{label}</span></button>
          ))}
        </div>

        <div className="backstage-scroll">
          {tab === "scenes" ? (
            <section className="backstage-pane" role="tabpanel">
              <div className="backstage-section-heading"><span className="card-kicker">ONE-TAP SETUP</span><h3>Choose a visitor story</h3><p>Each preset replaces the current synthetic input with a predictable demo state.</p></div>
              <div className="backstage-presets">
                {PRESETS.map((preset) => (
                  <button className={`backstage-preset preset-${preset.tone}`} type="button" key={preset.id} onClick={() => onApplyPreset(preset.id)}>
                    <span><i /><strong>{preset.title}</strong></span><p>{preset.copy}</p><small>{preset.id === "baseline" ? "Reset replay" : "Load scene"}</small>
                  </button>
                ))}
              </div>
              <ActiveInputs state={state} onRemoveTask={onRemoveTask} onRemoveSensor={onRemoveSensor} onClearMode={onClearMode} />
            </section>
          ) : null}

          {tab === "state" ? (
            <section className="backstage-pane" role="tabpanel">
              <div className="backstage-section-heading"><span className="card-kicker">SIMULATED BACKEND STATE</span><h3>Set the farm conditions</h3><p>The product views react as if these values arrived in a new farm-state snapshot.</p></div>
              <div className="backstage-fieldset">
                <span className="backstage-fieldset-label">Automation mode</span>
                <div className="backstage-mode-grid" role="group" aria-label="Automation mode">
                  {([
                    ["running", Play, "Running"],
                    ["paused", Pause, "Paused"],
                    ["emergency_stop", Power, "Emergency"],
                  ] as const).map(([mode, Icon, label]) => (
                    <button type="button" key={mode} className={state.automationMode === mode ? "active" : ""} aria-pressed={state.automationMode === mode} onClick={() => onSetMode(mode)}><Icon size={16} /><span>{label}</span></button>
                  ))}
                </div>
              </div>
              <form className="backstage-form" onSubmit={submitSensor}>
                <div className="backstage-form-title"><Activity size={17} /><div><strong>Sensor reading</strong><span>Inject or replace one sensor value.</span></div></div>
                <label>Sensor<select value={sensorKind} onChange={(event) => changeSensorKind(event.target.value as SensorKind)}>{Object.entries(SENSOR_DEFAULTS).map(([kind, value]) => <option key={kind} value={kind}>{value.label}</option>)}</select></label>
                <div className="backstage-field-row">
                  <label>Value<input type="number" step="0.01" required value={sensorValue} onChange={(event) => setSensorValue(Number(event.target.value))} /></label>
                  <label>Trend<input type="number" step="0.01" required value={sensorTrend} onChange={(event) => setSensorTrend(Number(event.target.value))} /></label>
                </div>
                <label>Status<select value={sensorStatus} onChange={(event) => setSensorStatus(event.target.value as HealthStatus)}><option value="optimal">Optimal</option><option value="attention">Attention</option><option value="critical">Critical</option></select></label>
                <button className="button-primary backstage-submit" type="submit"><DatabaseZap size={15} /> Inject sensor state</button>
              </form>
              <ActiveInputs state={state} onRemoveTask={onRemoveTask} onRemoveSensor={onRemoveSensor} onClearMode={onClearMode} compact />
            </section>
          ) : null}

          {tab === "task" ? (
            <section className="backstage-pane" role="tabpanel">
              <div className="backstage-section-heading"><span className="card-kicker">SIMULATED AI OUTPUT</span><h3>Add a decision task</h3><p>The task appears in AI Decisions with evidence, policy state and an audit event.</p></div>
              <form className="backstage-form" onSubmit={submitTask}>
                <div className="backstage-form-title"><Bot size={17} /><div><strong>Task payload</strong><span>All fields are local demo data.</span></div></div>
                <label>Task title<input required maxLength={80} value={task.title} onChange={(event) => setTask((current) => ({ ...current, title: event.target.value }))} /></label>
                <label>Summary<textarea required maxLength={220} value={task.summary} onChange={(event) => setTask((current) => ({ ...current, summary: event.target.value }))} /></label>
                <label>Actuator<select value={task.actuator} onChange={(event) => changeActuator(event.target.value as BackstageTaskDraft["actuator"])}><option value="fan">Fan</option><option value="light">Grow light</option><option value="irrigation_pump">Irrigation pump</option><option value="dosing_pump">Dosing pump</option></select></label>
                <div className="backstage-field-row">
                  <label>Target<input required value={task.target} onChange={(event) => setTask((current) => ({ ...current, target: event.target.value }))} /></label>
                  <label>Value<input type="number" step="0.1" required value={task.value} onChange={(event) => setTask((current) => ({ ...current, value: Number(event.target.value) }))} /></label>
                </div>
                <label>Unit<input required value={task.unit} onChange={(event) => setTask((current) => ({ ...current, unit: event.target.value }))} /></label>
                <div className="backstage-field-row">
                  <label>Initial state<select value={task.status} onChange={(event) => setTask((current) => ({ ...current, status: event.target.value as BackstageTaskDraft["status"] }))}><option value="pending_approval">Needs approval</option><option value="executed">Executed</option><option value="blocked">Policy blocked</option></select></label>
                  <label>Risk<select value={task.risk} onChange={(event) => setTask((current) => ({ ...current, risk: event.target.value as BackstageTaskDraft["risk"] }))}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
                </div>
                <button className="button-primary backstage-submit" type="submit"><ListPlus size={15} /> Inject AI task</button>
              </form>
              <ActiveInputs state={state} onRemoveTask={onRemoveTask} onRemoveSensor={onRemoveSensor} onClearMode={onClearMode} compact />
            </section>
          ) : null}
        </div>

        <footer className="backstage-footer">
          <div><span><i className={activeCount ? "active" : ""} />{activeCount} synthetic input{activeCount === 1 ? "" : "s"}</span><button type="button" onClick={onReset} disabled={!activeCount}><RotateCcw size={14} /> Reset</button></div>
          <div><button className="button-secondary" type="button" onClick={onPresentState}>Open Command Center</button><button className="button-primary" type="button" onClick={onPresentTasks}>Open AI Decisions</button></div>
        </footer>
      </aside>
    </div>
  );
}

function ActiveInputs({ state, onRemoveTask, onRemoveSensor, onClearMode, compact = false }: {
  state: BackstageState;
  onRemoveTask: (id: string) => void;
  onRemoveSensor: (kind: SensorKind) => void;
  onClearMode: () => void;
  compact?: boolean;
}) {
  const count = activeBackstageInputCount(state);
  return (
    <div className={`backstage-active${compact ? " compact" : ""}`}>
      <div className="backstage-active-head"><div><span className="card-kicker">ACTIVE INPUT FEED</span><strong>{state.sceneLabel ?? (count ? "Custom setup" : "Trusted baseline")}</strong></div><span>{count}</span></div>
      {!count ? <div className="backstage-empty"><Check size={18} /><div><strong>No synthetic input</strong><span>The original replay is being shown.</span></div></div> : (
        <div className="backstage-active-list">
          {state.automationMode ? <div><span className={`backstage-item-dot status-${state.automationMode}`} /><div><strong>Automation · {labelValue(state.automationMode)}</strong><small>State override</small></div><button type="button" onClick={onClearMode} aria-label="Remove automation override"><Trash2 size={15} /></button></div> : null}
          {state.sensorOverrides.map((sensor) => <div key={sensor.kind}><span className={`backstage-item-dot sensor-${sensor.status}`} /><div><strong>{SENSOR_DEFAULTS[sensor.kind].label} · {sensor.value}</strong><small>{labelValue(sensor.status)} · trend {sensor.trend > 0 ? "+" : ""}{sensor.trend}</small></div><button type="button" onClick={() => onRemoveSensor(sensor.kind)} aria-label={`Remove ${SENSOR_DEFAULTS[sensor.kind].label} override`}><Trash2 size={15} /></button></div>)}
          {state.tasks.map((task) => <div key={task.id}><span className={`backstage-item-dot task-${task.status}`} /><div><strong>{task.title}</strong><small>{labelValue(task.status)} · {task.risk} risk</small></div><button type="button" onClick={() => onRemoveTask(task.id)} aria-label={`Remove task ${task.title}`}><Trash2 size={15} /></button></div>)}
        </div>
      )}
    </div>
  );
}
