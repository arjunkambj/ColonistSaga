import { describe, expect, test } from "bun:test";

import { getCompatiblePlayerCount } from "../src/lib/lobby/lobby-settings-model";

describe("lobby map settings", () => {
  test("moves an incompatible preference to the nearest supported player count", () => {
    expect(getCompatiblePlayerCount("base", 1, 8)).toBe(4);
    expect(getCompatiblePlayerCount("extended-6", 1, 4)).toBe(5);
    expect(getCompatiblePlayerCount("extended-8", 1, 6)).toBe(7);
  });

  test("rejects a board that cannot fit the current human players", () => {
    expect(getCompatiblePlayerCount("base", 5, 4)).toBeNull();
    expect(getCompatiblePlayerCount("extended-6", 7, 6)).toBeNull();
  });
});
