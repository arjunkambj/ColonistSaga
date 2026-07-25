import { describe, expect, test } from "bun:test";

import { parseCommandKind } from "../convex/model/commands";
import { commandValidator } from "../convex/model/validators";

describe("game command boundary", () => {
  test("does not accept the removed development-card purchase command", () => {
    expect(JSON.stringify(commandValidator)).not.toContain("buy_development_card");
  });

  test("reads the command kind used by presentation event cues", () => {
    expect(parseCommandKind('{"kind":"place_road","edgeKey":"1:2"}')).toBe("place_road");
    expect(parseCommandKind("invalid")).toBe("unknown");
    expect(parseCommandKind('{"kind":42}')).toBe("unknown");
  });
});
