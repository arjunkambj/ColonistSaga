import { describe, expect, test } from "bun:test";

import { chooseBotName, SUPERHERO_BOT_NAMES } from "../src";

describe("superhero bot names", () => {
  test("selects a stable name for the same seed", () => {
    expect(chooseBotName("room:seat:1")).toBe(chooseBotName("room:seat:1"));
  });

  test("does not select a name already used at the table", () => {
    const selectedName = chooseBotName("room:seat:2");

    expect(chooseBotName("room:seat:2", [selectedName])).not.toBe(selectedName);
  });

  test("provides exactly 20 unique superhero names with the Bot suffix", () => {
    expect(new Set(SUPERHERO_BOT_NAMES).size).toBe(SUPERHERO_BOT_NAMES.length);
    expect(SUPERHERO_BOT_NAMES).toHaveLength(20);
    expect(SUPERHERO_BOT_NAMES.every((name) => /^[A-Z][a-z]+ Bot$/.test(name))).toBe(true);
    expect(SUPERHERO_BOT_NAMES).toContain("Kara Bot");
    expect(SUPERHERO_BOT_NAMES).toContain("Clark Bot");
  });
});
