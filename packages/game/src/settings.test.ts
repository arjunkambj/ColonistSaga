import { describe, expect, it } from "vitest";

import { DEFAULT_BASE_GAME_SETTINGS } from "./constants";
import { createDefaultGame } from "./state";
import { createTestPlayers } from "./test-helpers";

describe("base game settings", () => {
  it("exports and snapshots the standard defaults", () => {
    const state = createDefaultGame(createTestPlayers(), "default-settings");

    expect(DEFAULT_BASE_GAME_SETTINGS).toEqual({
      balancedDice: true,
      discardLimit: 7,
      friendlyRobber: true,
      hideBankCards: false,
      maxPlayers: 4,
      turnTimerSeconds: 60,
      victoryPoints: 10,
    });
    expect(state.settings).toEqual(DEFAULT_BASE_GAME_SETTINGS);
    expect(state.settings).not.toBe(DEFAULT_BASE_GAME_SETTINGS);
    expect(state.victoryPoints).toBe(state.settings.victoryPoints);
  });

  it("accepts a three-player game and fills omitted settings", () => {
    const state = createDefaultGame(createTestPlayers().slice(0, 3), "three-player", {
      discardLimit: 12,
      maxPlayers: 3,
      victoryPoints: 8,
    });

    expect(state.players).toHaveLength(3);
    expect(state.settings).toEqual({
      ...DEFAULT_BASE_GAME_SETTINGS,
      discardLimit: 12,
      maxPlayers: 3,
      victoryPoints: 8,
    });
  });

  it.each([
    [{ victoryPoints: 2 }, "Victory points"],
    [{ victoryPoints: 14 }, "Victory points"],
    [{ discardLimit: 4 }, "Discard limit"],
    [{ discardLimit: 21 }, "Discard limit"],
    [{ maxPlayers: 3 as const }, "Expected 3 players"],
  ])("rejects invalid settings %#", (settings, message) => {
    expect(() => createDefaultGame(createTestPlayers(), "invalid-settings", settings)).toThrow(
      message,
    );
  });

  it("snapshots bot difficulty and defaults bots to medium", () => {
    const players = createTestPlayers(true).map((player, index) => ({
      ...player,
      botDifficulty: index === 0 ? ("easy" as const) : undefined,
    }));
    const state = createDefaultGame(players, "bot-difficulty");

    expect(state.players.map((player) => player.botDifficulty)).toEqual([
      "easy",
      "medium",
      "medium",
      "medium",
    ]);
  });
});
