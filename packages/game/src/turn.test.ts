import { describe, expect, it } from "vitest";

import { MAX_PLAYER_TURNS } from "./constants";
import { applyCommand, getLegalActions } from "./rules";
import { completeSetup, createTestGame, seedForDiceTotal } from "./test-helpers";

describe("turn sequencing", () => {
  it("requires the active player to roll before ending the turn", () => {
    let state = completeSetup(createTestGame());
    const [firstPlayer, secondPlayer] = state.players;

    if (!firstPlayer || !secondPlayer) {
      throw new Error("Turn fixture requires two players");
    }

    const unchanged = structuredClone(state);
    expect(() => applyCommand(state, secondPlayer.id, { kind: "roll" })).toThrowError(
      expect.objectContaining({ code: "NOT_REQUIRED_ACTOR" }),
    );
    expect(() => applyCommand(state, firstPlayer.id, { kind: "end_turn" })).toThrowError(
      expect.objectContaining({ code: "INVALID_PHASE" }),
    );
    expect(state).toEqual(unchanged);

    state = {
      ...state,
      seed: seedForDiceTotal(4, state.randomIndex),
    };
    const actionNumberBeforeRoll = state.actionNumber;
    state = applyCommand(state, firstPlayer.id, { kind: "roll" });

    expect(state.lastDiceRoll?.sum).toBe(4);
    expect(state.phase.kind).toBe("build_and_trade");
    expect(state.actionNumber).toBe(actionNumberBeforeRoll + 1);
    expect(getLegalActions(state, firstPlayer.id).canEndTurn).toBe(true);
    expect(getLegalActions(state, secondPlayer.id).canEndTurn).toBe(false);

    const turnNumberBeforeEnd = state.turnNumber;
    const actionNumberBeforeEnd = state.actionNumber;
    state = applyCommand(state, firstPlayer.id, { kind: "end_turn" });

    expect(state.activePlayerId).toBe(secondPlayer.id);
    expect(state.phase.kind).toBe("roll");
    expect(state.turnNumber).toBe(turnNumberBeforeEnd + 1);
    expect(state.actionNumber).toBe(actionNumberBeforeEnd + 1);
    expect(state.lastDiceRoll).toBeNull();
  });

  it("uses the seed and random index deterministically", () => {
    const first = completeSetup(createTestGame("repeatable-dice"));
    const second = completeSetup(createTestGame("repeatable-dice"));
    const firstRoll = applyCommand(first, first.activePlayerId, { kind: "roll" });
    const secondRoll = applyCommand(second, second.activePlayerId, { kind: "roll" });

    expect(firstRoll).toEqual(secondRoll);
    expect(firstRoll.randomIndex).toBe(first.randomIndex + 2);
  });

  it("finishes as a draw after the maximum number of player turns", () => {
    const state = {
      ...completeSetup(createTestGame("turn-limit")),
      phase: { kind: "build_and_trade" as const },
      turnNumber: MAX_PLAYER_TURNS - 1,
    };
    const beforeDraw = applyCommand(state, state.activePlayerId, { kind: "end_turn" });

    expect(beforeDraw.status).toBe("active");
    expect(beforeDraw.phase.kind).toBe("roll");
    expect(beforeDraw.turnNumber).toBe(MAX_PLAYER_TURNS);

    const atLimit = { ...beforeDraw, phase: { kind: "build_and_trade" as const } };
    const draw = applyCommand(atLimit, atLimit.activePlayerId, { kind: "end_turn" });

    expect(draw.status).toBe("completed");
    expect(draw.phase.kind).toBe("finished");
    expect(draw.turnNumber).toBe(MAX_PLAYER_TURNS);
    expect(draw.winnerPlayerId).toBeNull();
    expect(draw.actionNumber).toBe(atLimit.actionNumber + 1);
    expect(() => applyCommand(draw, draw.activePlayerId, { kind: "end_turn" })).toThrowError(
      expect.objectContaining({ code: "GAME_FINISHED" }),
    );
  });
});
