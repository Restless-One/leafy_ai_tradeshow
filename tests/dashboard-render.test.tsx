import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { LeafyDashboard } from "../app/components/LeafyDashboard";

test("renders the Leafy AI farm dashboard with safety context", () => {
  const html = renderToStaticMarkup(<LeafyDashboard />);
  assert.match(html, /The farm is thinking clearly/);
  assert.match(html, /HIGH-RISK AI PROPOSAL/);
  assert.match(html, /Correct the EC drift conservatively/);
  assert.match(html, /safety envelope/i);
  assert.match(html, /SIMULATION/);
  assert.match(html, /SIMULATED REPLAY/);
  assert.match(html, /remotion-command-ambient\.mp4/);
  assert.match(html, /remotion-canopy-replay\.mp4/);
  assert.match(html, /Local-only demo identity/);
  assert.match(html, /Start guided demo/);
  assert.match(html, /3 minute safe replay/);
  assert.match(html, /APPLE TRADESHOW/);
  for (const label of ["Command Center", "Farm Layers", "AI Decisions", "Growing Plan", "Safety &amp; Alerts", "Audit &amp; Outcomes"]) {
    assert.match(html, new RegExp(label));
  }
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});
