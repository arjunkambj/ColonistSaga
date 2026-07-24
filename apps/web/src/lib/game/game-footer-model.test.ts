import assert from "node:assert/strict";
import test from "node:test";

import { getTurnControlKind } from "./game-footer-model";

test("shows roll before the active player rolls", () => {
  assert.equal(
    getTurnControlKind({ canRoll: true, isRequiredActor: true, phaseKind: "roll" }),
    "roll",
  );
});

test("replaces roll with end turn during the active player's build phase", () => {
  assert.equal(
    getTurnControlKind({
      canRoll: false,
      isRequiredActor: true,
      phaseKind: "build_and_trade",
    }),
    "end_turn",
  );
});

test("shows waiting instead of end turn during another player's build phase", () => {
  assert.equal(
    getTurnControlKind({
      canRoll: false,
      isRequiredActor: false,
      phaseKind: "build_and_trade",
    }),
    "waiting",
  );
});

test("reserves the turn slot while a required action is incomplete", () => {
  assert.equal(
    getTurnControlKind({ canRoll: false, isRequiredActor: true, phaseKind: "move_robber" }),
    "required_action",
  );
});
