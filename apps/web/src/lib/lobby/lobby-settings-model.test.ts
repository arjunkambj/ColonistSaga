import assert from "node:assert/strict";
import test from "node:test";

import { getBotCapacity, getMinimumPlayerCount } from "./lobby-settings-model.ts";

test("recalculates bot capacity when a two-human lobby shrinks", () => {
  assert.equal(getBotCapacity(4, 2), 2);
  assert.equal(getBotCapacity(3, 2), 1);
});

test("prevents a table from being smaller than its human membership", () => {
  assert.equal(getMinimumPlayerCount("base", 3), 3);
  assert.equal(getMinimumPlayerCount("base", 4), 4);
});
