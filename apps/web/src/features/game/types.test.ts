import assert from "node:assert/strict";
import test from "node:test";

import { parsePlayerView } from "./types.ts";

test("guards the serialized player view boundary", () => {
  assert.equal(parsePlayerView(undefined), null);
  assert.equal(parsePlayerView("not-json"), null);
  assert.equal(parsePlayerView("{}"), null);
});

test("accepts a structurally plausible serialized player view", () => {
  const view = parsePlayerView('{"board":{},"players":[]}');
  assert.ok(view);
});
