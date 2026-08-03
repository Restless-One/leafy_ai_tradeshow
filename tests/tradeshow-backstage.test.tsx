import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { TradeshowBackstage } from "../app/components/TradeshowBackstage";
import {
  activeBackstageInputCount,
  applyBackstageInputs,
  createBackstagePreset,
  createEmptyBackstageState,
} from "../app/components/tradeshow-state";
import { DEMO_SNAPSHOT } from "../lib/demo-data";

const noop = () => {};

test("baseline backstage state leaves the trusted snapshot untouched", () => {
  const state = createEmptyBackstageState();
  assert.equal(activeBackstageInputCount(state), 0);
  assert.equal(applyBackstageInputs(DEMO_SNAPSHOT, state), DEMO_SNAPSHOT);
});

test("heat preset injects a critical sensor and review task without mutating the baseline", () => {
  const state = createBackstagePreset("heat_spike");
  const snapshot = applyBackstageInputs(DEMO_SNAPSHOT, state);
  const air = snapshot.sensors.find((sensor) => sensor.kind === "air_temperature");

  assert.equal(activeBackstageInputCount(state), 3);
  assert.equal(air?.value, 29.1);
  assert.equal(air?.status, "critical");
  assert.equal(snapshot.actions[0]?.id, "backstage-task-heat");
  assert.equal(snapshot.actions[0]?.status, "pending_approval");
  assert.equal(snapshot.systemStatus, "degraded");
  assert.equal(snapshot.alerts[0]?.source, "Demo Backstage");
  assert.equal(DEMO_SNAPSHOT.sensors.find((sensor) => sensor.kind === "air_temperature")?.value, 24.8);
});

test("renders the operator-only backstage boundary and controls", () => {
  const html = renderToStaticMarkup(
    <TradeshowBackstage
      open
      state={createBackstagePreset("ec_drift")}
      onClose={noop}
      onApplyPreset={noop}
      onSetMode={noop}
      onSetSensor={noop}
      onAddTask={noop}
      onRemoveTask={noop}
      onRemoveSensor={noop}
      onClearMode={noop}
      onReset={noop}
      onPresentState={noop}
      onPresentTasks={noop}
    />,
  );

  assert.match(html, /Demo Backstage/);
  assert.match(html, /Browser memory only/);
  assert.match(html, /No API, database or farm hardware/);
  assert.match(html, /Rising heat/);
  assert.match(html, /EC drift/);
  assert.match(html, /Open AI Decisions/);
});
