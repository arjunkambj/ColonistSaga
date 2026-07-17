import assert from "node:assert/strict";
import test from "node:test";

import { getPhaseCopy } from "./view.ts";

test("gives the active viewer a concrete setup instruction", () => {
  assert.deepEqual(getPhaseCopy({ kind: "setup_settlement", setupIndex: 0 }, true, "Mira"), {
    detail: "Choose a glowing corner for your settlement.",
    title: "Your Opening Settlement",
  });
});

test("names the active opponent during the build phase", () => {
  assert.equal(
    getPhaseCopy({ kind: "build_and_trade" }, false, "Mira").detail,
    "Mira is building and trading.",
  );
});
