import assert from "node:assert/strict";
import test from "node:test";

import { getNextTheme, resolveTheme } from "./theme.ts";

test("uses light as the default theme", () => {
  assert.equal(resolveTheme(null), "light");
  assert.equal(resolveTheme("system"), "light");
  assert.equal(resolveTheme("unknown"), "light");
});

test("restores an explicit dark theme", () => {
  assert.equal(resolveTheme("dark"), "dark");
});

test("toggles between light and dark", () => {
  assert.equal(getNextTheme("light"), "dark");
  assert.equal(getNextTheme("dark"), "light");
});
