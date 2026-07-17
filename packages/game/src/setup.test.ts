import { describe, expect, it } from "vitest";

import { SETUP_SEAT_ORDER, TERRAIN_RESOURCE, getSetupSeatOrder } from "./constants";
import { totalResources } from "./resources";
import { applyCommand, getLegalActions } from "./rules";
import { DEFAULT_TOPOLOGY } from "./topology";
import { createDefaultGame } from "./state";
import { createTestGame, createTestPlayers } from "./test-helpers";

describe("snake setup", () => {
  it("places two free settlement-road pairs per player in snake order", () => {
    let state = createTestGame();

    for (const [setupIndex, seatIndex] of SETUP_SEAT_ORDER.entries()) {
      const expectedPlayer = state.players[seatIndex];
      expect(state.phase).toEqual({ kind: "setup_settlement", setupIndex });
      expect(state.activePlayerId).toBe(expectedPlayer?.id);

      const actorPlayerId = state.activePlayerId;
      const settlement = getLegalActions(state, actorPlayerId).settlementVertexKeys[0];
      expect(settlement).toBeDefined();

      const beforeCards = totalResources(
        state.players.find((player) => player.id === actorPlayerId)?.resources ?? {
          brick: 0,
          sheep: 0,
          stone: 0,
          tree: 0,
          wheat: 0,
        },
      );
      state = applyCommand(state, actorPlayerId, {
        kind: "place_settlement",
        vertexKey: settlement!,
      });

      if (setupIndex >= 4) {
        const adjacentProducingTiles = (DEFAULT_TOPOLOGY.vertexTileIds[settlement!] ?? []).filter(
          (tileId) => {
            const tile = state.board.tiles.find((candidate) => candidate.id === tileId);
            return tile ? TERRAIN_RESOURCE[tile.terrain] !== null : false;
          },
        ).length;
        const afterCards = totalResources(
          state.players.find((player) => player.id === actorPlayerId)?.resources ?? {
            brick: 0,
            sheep: 0,
            stone: 0,
            tree: 0,
            wheat: 0,
          },
        );
        expect(afterCards - beforeCards).toBe(adjacentProducingTiles);
      }

      expect(state.phase.kind).toBe("setup_road");
      const road = getLegalActions(state, actorPlayerId).roadEdgeKeys[0];
      expect(road).toBeDefined();
      expect(DEFAULT_TOPOLOGY.edgeVertices[road!]).toContain(settlement);
      state = applyCommand(state, actorPlayerId, {
        edgeKey: road!,
        kind: "place_road",
      });
    }

    expect(state.phase.kind).toBe("roll");
    expect(state.activePlayerId).toBe(state.turnOrder[0]);
    expect(state.turnNumber).toBe(1);
    expect(state.players.map((player) => player.victoryPoints)).toEqual([2, 2, 2, 2]);
    expect(state.players.map((player) => player.piecesRemaining)).toEqual(
      Array.from({ length: 4 }, () => ({ cities: 4, roads: 13, settlements: 3 })),
    );
  });

  it("rejects adjacent setup settlements without changing the input state", () => {
    const state = createTestGame();
    const actorPlayerId = state.activePlayerId;
    const firstVertex = getLegalActions(state, actorPlayerId).settlementVertexKeys[0]!;
    const withSettlement = applyCommand(state, actorPlayerId, {
      kind: "place_settlement",
      vertexKey: firstVertex,
    });
    const adjacentVertex = DEFAULT_TOPOLOGY.vertexNeighbors[firstVertex]?.[0];

    expect(adjacentVertex).toBeDefined();
    expect(() =>
      applyCommand(
        {
          ...withSettlement,
          phase: { kind: "setup_settlement", setupIndex: 1 },
        },
        actorPlayerId,
        { kind: "place_settlement", vertexKey: adjacentVertex! },
      ),
    ).toThrowError(expect.objectContaining({ code: "DISTANCE_RULE" }));
    expect(state.board.buildings).toEqual([]);
  });

  it("uses a dynamic snake order for three players", () => {
    let state = createDefaultGame(createTestPlayers().slice(0, 3), "three-player-setup", {
      balancedDice: false,
      friendlyRobber: false,
      maxPlayers: 3,
    });
    const settlementOrder: string[] = [];

    while (state.phase.kind === "setup_settlement" || state.phase.kind === "setup_road") {
      const playerId = state.activePlayerId;
      const legal = getLegalActions(state, playerId);

      if (state.phase.kind === "setup_settlement") {
        settlementOrder.push(playerId);
        state = applyCommand(state, playerId, {
          kind: "place_settlement",
          vertexKey: legal.settlementVertexKeys[0]!,
        });
      } else {
        state = applyCommand(state, playerId, {
          edgeKey: legal.roadEdgeKeys[0]!,
          kind: "place_road",
        });
      }
    }

    expect(getSetupSeatOrder(3)).toEqual([0, 1, 2, 2, 1, 0]);
    expect(settlementOrder).toEqual([
      "player-1",
      "player-2",
      "player-3",
      "player-3",
      "player-2",
      "player-1",
    ]);
    expect(state.phase.kind).toBe("roll");
    expect(state.activePlayerId).toBe("player-1");
    expect(state.players.map((player) => player.victoryPoints)).toEqual([2, 2, 2]);
  });
});
