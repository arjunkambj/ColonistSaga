import assert from "node:assert/strict";
import test from "node:test";

import { createCachedValue } from "./cached-value";

test("reuses a value when its configuration is unchanged", () => {
  let creations = 0;
  const getValue = createCachedValue(
    (current: string, next) => current === next,
    () => ({ creation: ++creations }),
  );

  const firstValue = getValue("same-configuration");
  const secondValue = getValue("same-configuration");

  assert.equal(secondValue, firstValue);
  assert.equal(creations, 1);
});

test("creates a new value when its configuration changes", () => {
  const getValue = createCachedValue(
    (current: string, next) => current === next,
    (configuration) => ({ configuration }),
  );

  assert.notEqual(getValue("first"), getValue("second"));
});
