import assert from "node:assert/strict";
import test from "node:test";
import { actorFromRequest, cleanComment } from "../lib/request-auth";

test("write identity accepts localhost demo mode but rejects every remote request", () => {
  assert.equal(actorFromRequest(new Request("http://localhost/api/overrides")), "demo.operator@leafy-ai.test");
  assert.equal(actorFromRequest(new Request("https://leafy-ai.test/api/overrides")), null);
  assert.equal(actorFromRequest(new Request("https://leafy-ai.test/api/overrides", { headers: { "oai-authenticated-user-email": "operator@example.edu" } })), null);
});

test("operator comments are trimmed and bounded", () => {
  assert.equal(cleanComment("  reviewed  "), "reviewed");
  assert.equal(cleanComment("x".repeat(700))?.length, 500);
});
