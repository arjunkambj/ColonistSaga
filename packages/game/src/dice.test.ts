import { describe, expect, it } from "vitest";

import { applyCommand } from "./rules";
import { createDefaultGame } from "./state";
import { createTestPlayers } from "./test-helpers";
import type { DiceRoll, GameState } from "./types";

function drawBalancedCycle(seed: string) {
  let state: GameState = {
    ...createDefaultGame(createTestPlayers(), seed, {
      balancedDice: true,
      friendlyRobber: false,
    }),
    phase: { kind: "roll" },
    turnNumber: 1,
  };
  const rolls: DiceRoll[] = [];

  for (let index = 0; index < 36; index += 1) {
    state = applyCommand(state, state.activePlayerId, { kind: "roll" });
    if (!state.lastDiceRoll) throw new Error("Balanced roll was not recorded");
    rolls.push(state.lastDiceRoll);
    state = { ...state, lastDiceRoll: null, phase: { kind: "roll" } };
  }

  return { rolls, state };
}

describe("balanced dice", () => {
  it("shuffles one deterministic bag containing all 36 dice combinations", () => {
    const first = drawBalancedCycle("balanced-cycle");
    const second = drawBalancedCycle("balanced-cycle");
    const combinations = new Set(first.rolls.map((roll) => `${roll.first}:${roll.second}`));
    const totals = first.rolls.reduce<Record<number, number>>((counts, roll) => {
      counts[roll.sum] = (counts[roll.sum] ?? 0) + 1;
      return counts;
    }, {});

    expect(first.rolls).toEqual(second.rolls);
    expect(combinations).toHaveLength(36);
    expect(totals).toEqual({
      2: 1,
      3: 2,
      4: 3,
      5: 4,
      6: 5,
      7: 6,
      8: 5,
      9: 4,
      10: 3,
      11: 2,
      12: 1,
    });
    expect(first.state.balancedDiceBag).toEqual([]);
    expect(first.state.randomIndex).toBe(35);
  });

  it("starts a newly shuffled deterministic bag after the cycle is exhausted", () => {
    const { state } = drawBalancedCycle("balanced-refill");
    const refilled = applyCommand(state, state.activePlayerId, { kind: "roll" });

    expect(refilled.balancedDiceBag).toHaveLength(35);
    expect(refilled.randomIndex).toBe(70);
  });
});
