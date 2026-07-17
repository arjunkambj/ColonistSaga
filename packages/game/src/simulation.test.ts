import { describe, expect, it } from "vitest";

import { BANK_RESOURCE_COUNT, INITIAL_PIECES } from "./constants";
import { RESOURCE_TYPES } from "./types";
import { totalResources } from "./resources";
import { advanceBots } from "./bots";
import { createDefaultGame } from "./state";
import { createTestPlayers } from "./test-helpers";
import type { GameState } from "./types";

function expectConservation(state: GameState) {
  for (const resource of RESOURCE_TYPES) {
    const cardsInHands = state.players.reduce(
      (total, player) => total + player.resources[resource],
      0,
    );
    expect(state.bank[resource] + cardsInHands).toBe(BANK_RESOURCE_COUNT);
    expect(Number.isInteger(state.bank[resource])).toBe(true);
    expect(state.bank[resource]).toBeGreaterThanOrEqual(0);
  }

  expect(new Set(state.board.roads.map((road) => road.edgeKey))).toHaveLength(
    state.board.roads.length,
  );
  expect(new Set(state.board.buildings.map((building) => building.vertexKey))).toHaveLength(
    state.board.buildings.length,
  );

  for (const player of state.players) {
    const roads = state.board.roads.filter((road) => road.playerId === player.id).length;
    const settlements = state.board.buildings.filter(
      (building) => building.playerId === player.id && building.kind === "settlement",
    ).length;
    const cities = state.board.buildings.filter(
      (building) => building.playerId === player.id && building.kind === "city",
    ).length;

    expect(player.piecesRemaining.roads + roads).toBe(INITIAL_PIECES.roads);
    expect(player.piecesRemaining.settlements + settlements).toBe(INITIAL_PIECES.settlements);
    expect(player.piecesRemaining.cities + cities).toBe(INITIAL_PIECES.cities);
    expect(player.victoryPoints).toBe(settlements + cities * 2);
    expect(totalResources(player.resources)).toBeGreaterThanOrEqual(0);
    expect(
      Object.values(player.piecesRemaining).every((count) => Number.isInteger(count) && count >= 0),
    ).toBe(true);
    expect(
      Object.values(player.resources).every((count) => Number.isInteger(count) && count >= 0),
    ).toBe(true);
  }
}

describe("deterministic bot simulation", () => {
  it("produces identical state for the same seed and action budget", () => {
    const players = createTestPlayers(true);
    const first = advanceBots(createDefaultGame(players, "deterministic"), 1_000);
    const second = advanceBots(createDefaultGame(players, "deterministic"), 1_000);

    expect(first).toEqual(second);
    expectConservation(first);
  });

  it("finishes an accelerated game through the public reducer", () => {
    const state = advanceBots(
      createDefaultGame(createTestPlayers(true), "accelerated-finish", 3),
      20_000,
    );

    expect(state.status).toBe("completed");
    expect(state.phase.kind).toBe("finished");
    expect(state.winnerPlayerId).not.toBeNull();
    expect(
      state.players.find((player) => player.id === state.winnerPlayerId)?.victoryPoints,
    ).toBeGreaterThanOrEqual(3);
    expectConservation(state);
  });

  it("can finish the default ten-point game", () => {
    const state = advanceBots(
      createDefaultGame(createTestPlayers(true), "default-finish"),
      100_000,
    );

    expect(state.status).toBe("completed");
    expect(
      state.players.find((player) => player.id === state.winnerPlayerId)?.victoryPoints,
    ).toBeGreaterThanOrEqual(10);
    expect(state.actionNumber).toBeLessThan(10_000);
    expectConservation(state);
  });

  it("finishes and preserves invariants across several seeds", () => {
    for (let seedIndex = 0; seedIndex < 5; seedIndex += 1) {
      const state = advanceBots(
        createDefaultGame(createTestPlayers(true), `simulation-${seedIndex}`),
        100_000,
      );

      expect(state.status).toBe("completed");
      expectConservation(state);
    }
  });
});
