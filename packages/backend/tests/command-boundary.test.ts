import { describe, expect, test } from "bun:test";

import { commandValidator } from "../convex/model/validators";

describe("game command boundary", () => {
  test("does not accept the removed development-card purchase command", () => {
    expect(JSON.stringify(commandValidator)).not.toContain("buy_development_card");
  });
});
