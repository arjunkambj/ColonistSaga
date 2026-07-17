import { describe, expect, it } from "vitest";

import { applyCommand, getLegalActions } from "./rules";
import { createDefaultGame } from "./state";
import {
  completeSetup,
  createTestPlayers,
  inventory,
  seedForDiceTotal,
  transferFromBank,
} from "./test-helpers";
import { DEFAULT_TOPOLOGY } from "./topology";
import { toPlayerView } from "./views";

describe("settings-dependent rules", () => {
  it("uses the configured discard limit", () => {
    const players = createTestPlayers();
    const seed = seedForDiceTotal(7);
    const createFixture = (discardLimit: number) =>
      transferFromBank(
        {
          ...createDefaultGame(players, seed, {
            balancedDice: false,
            discardLimit,
            friendlyRobber: false,
          }),
          phase: { kind: "roll" as const },
        },
        players[0]!.id,
        inventory({ tree: 6 }),
      );

    const lowerLimit = applyCommand(createFixture(5), players[0]!.id, { kind: "roll" });
    const standardLimit = applyCommand(createFixture(7), players[0]!.id, { kind: "roll" });

    expect(getLegalActions(lowerLimit, players[0]!.id).discardCount).toBe(3);
    expect(standardLimit.phase.kind).toBe("move_robber");
  });

  it("keeps the robber away from players with two or fewer points", () => {
    const players = createTestPlayers();
    let state = completeSetup(
      createDefaultGame(players, "friendly-robber", {
        balancedDice: false,
        friendlyRobber: true,
      }),
    );
    const mover = state.players[0]!;
    const protectedPlayer = state.players[1]!;
    state = {
      ...state,
      activePlayerId: mover.id,
      phase: { kind: "move_robber", rollerPlayerId: mover.id },
      players: state.players.map((player) => ({
        ...player,
        victoryPoints: player.id === protectedPlayer.id ? 2 : player.id === mover.id ? 1 : 4,
      })),
    };
    const protectedBuilding = state.board.buildings.find(
      (building) => building.playerId === protectedPlayer.id,
    )!;
    const protectedTileId = DEFAULT_TOPOLOGY.vertexTileIds[protectedBuilding.vertexKey]?.find(
      (tileId) => tileId !== state.board.robberTileId,
    );

    expect(protectedTileId).toBeDefined();
    expect(getLegalActions(state, mover.id).robberTileIds).not.toContain(protectedTileId);
    expect(() =>
      applyCommand(state, mover.id, { kind: "move_robber", tileId: protectedTileId! }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_ROBBER_TILE" }));

    const unrestricted = {
      ...state,
      settings: { ...state.settings, friendlyRobber: false },
    };
    expect(getLegalActions(unrestricted, mover.id).robberTileIds).toContain(protectedTileId);
  });

  it("projects bank counts or null without exposing random state", () => {
    const visible = createDefaultGame(createTestPlayers(), "visible-bank", {
      hideBankCards: false,
    });
    const hidden = {
      ...visible,
      settings: { ...visible.settings, hideBankCards: true },
    };

    expect(toPlayerView(visible, visible.activePlayerId).bank).toEqual(visible.bank);
    expect(toPlayerView(hidden, hidden.activePlayerId).bank).toBeNull();
    expect("balancedDiceBag" in toPlayerView(hidden, hidden.activePlayerId)).toBe(false);
  });
});
