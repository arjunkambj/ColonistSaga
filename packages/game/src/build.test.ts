import { describe, expect, it } from "vitest";

import { BUILD_COSTS } from "./constants";
import { totalResources } from "./resources";
import { applyCommand, getLegalActions, getRoadEdgeKeys, getSettlementVertexKeys } from "./rules";
import { DEFAULT_TOPOLOGY } from "./topology";
import type { GameCommand, GameState } from "./types";
import { completeSetup, createTestGame, giveBuildCost } from "./test-helpers";

function enterBuildPhase(state: GameState = completeSetup()): GameState {
  return { ...state, phase: { kind: "build_and_trade" as const } };
}

describe("building", () => {
  it("charges road cost and consumes a road piece", () => {
    let state = enterBuildPhase();
    const playerId = state.activePlayerId;
    state = giveBuildCost(state, playerId, "road");
    const playerBefore = state.players.find((player) => player.id === playerId)!;
    const bankBefore = { ...state.bank };
    const edgeKey = getLegalActions(state, playerId).roadEdgeKeys[0];

    expect(edgeKey).toBeDefined();
    const built = applyCommand(state, playerId, {
      edgeKey: edgeKey!,
      kind: "place_road",
    });
    const playerAfter = built.players.find((player) => player.id === playerId)!;

    expect(playerAfter.resources.tree).toBe(playerBefore.resources.tree - 1);
    expect(playerAfter.resources.brick).toBe(playerBefore.resources.brick - 1);
    expect(playerAfter.piecesRemaining.roads).toBe(playerBefore.piecesRemaining.roads - 1);
    expect(built.bank.tree).toBe(bankBefore.tree + 1);
    expect(built.bank.brick).toBe(bankBefore.brick + 1);
    expect(built.board.roads).toContainEqual({ edgeKey, playerId });
  });

  it("rejects disconnected roads and roads blocked by an opponent building", () => {
    let state = enterBuildPhase();
    const playerId = state.activePlayerId;
    state = giveBuildCost(state, playerId, "road");
    const connected = new Set(getRoadEdgeKeys(state, playerId));
    const disconnected = DEFAULT_TOPOLOGY.edgeKeys.find(
      (edgeKey) =>
        !connected.has(edgeKey) && !state.board.roads.some((road) => road.edgeKey === edgeKey),
    );

    expect(disconnected).toBeDefined();
    expect(() =>
      applyCommand(state, playerId, {
        edgeKey: disconnected!,
        kind: "place_road",
      }),
    ).toThrowError(expect.objectContaining({ code: "ROAD_NOT_CONNECTED" }));

    const vertexKey = DEFAULT_TOPOLOGY.vertexKeys.find(
      (candidate) => (DEFAULT_TOPOLOGY.vertexEdges[candidate]?.length ?? 0) === 3,
    )!;
    const [existingEdge, blockedEdge] = DEFAULT_TOPOLOGY.vertexEdges[vertexKey] ?? [];
    const opponentId = state.players.find((player) => player.id !== playerId)!.id;
    const blockedFixture = {
      ...createTestGame(),
      activePlayerId: playerId,
      phase: { kind: "build_and_trade" as const },
      board: {
        ...createTestGame().board,
        buildings: [{ kind: "settlement" as const, playerId: opponentId, vertexKey }],
        roads: [{ edgeKey: existingEdge!, playerId }],
      },
    };
    const fundedFixture = giveBuildCost(blockedFixture, playerId, "road");

    expect(() =>
      applyCommand(fundedFixture, playerId, {
        edgeKey: blockedEdge!,
        kind: "place_road",
      }),
    ).toThrowError(expect.objectContaining({ code: "ROAD_NOT_CONNECTED" }));
  });

  it("charges settlement cost and enforces the distance rule", () => {
    let state = enterBuildPhase();
    const playerId = state.activePlayerId;
    const targetVertex = getSettlementVertexKeys(state, playerId, false)[0];
    const adjoiningEdge = targetVertex
      ? DEFAULT_TOPOLOGY.vertexEdges[targetVertex]?.find(
          (edgeKey) => !state.board.roads.some((road) => road.edgeKey === edgeKey),
        )
      : undefined;

    expect(targetVertex).toBeDefined();
    expect(adjoiningEdge).toBeDefined();
    state = {
      ...state,
      board: {
        ...state.board,
        roads: [...state.board.roads, { edgeKey: adjoiningEdge!, playerId }],
      },
      players: state.players.map((player) =>
        player.id === playerId
          ? {
              ...player,
              piecesRemaining: {
                ...player.piecesRemaining,
                roads: player.piecesRemaining.roads - 1,
              },
            }
          : player,
      ),
    };
    state = giveBuildCost(state, playerId, "settlement");
    const before = state.players.find((player) => player.id === playerId)!;
    const built = applyCommand(state, playerId, {
      kind: "place_settlement",
      vertexKey: targetVertex!,
    });
    const after = built.players.find((player) => player.id === playerId)!;

    expect(totalResources(before.resources) - totalResources(after.resources)).toBe(
      totalResources(BUILD_COSTS.settlement),
    );
    expect(after.victoryPoints).toBe(before.victoryPoints + 1);
    expect(after.piecesRemaining.settlements).toBe(before.piecesRemaining.settlements - 1);

    const occupiedVertex = built.board.buildings[0]!.vertexKey;
    const adjacentVertex = DEFAULT_TOPOLOGY.vertexNeighbors[occupiedVertex]?.[0];
    expect(() =>
      applyCommand(built, playerId, {
        kind: "place_settlement",
        vertexKey: adjacentVertex!,
      }),
    ).toThrowError(expect.objectContaining({ code: "DISTANCE_RULE" }));
  });

  it("upgrades a settlement, reuses its piece, and can finish the game", () => {
    let state = enterBuildPhase(completeSetup(createTestGame("city-win", 3)));
    const playerId = state.activePlayerId;
    const settlement = state.board.buildings.find(
      (building) => building.playerId === playerId && building.kind === "settlement",
    )!;
    state = giveBuildCost(state, playerId, "city");
    const before = state.players.find((player) => player.id === playerId)!;
    const built = applyCommand(state, playerId, {
      kind: "build_city",
      vertexKey: settlement.vertexKey,
    });
    const after = built.players.find((player) => player.id === playerId)!;

    expect(after.piecesRemaining.cities).toBe(before.piecesRemaining.cities - 1);
    expect(after.piecesRemaining.settlements).toBe(before.piecesRemaining.settlements + 1);
    expect(after.victoryPoints).toBe(3);
    expect(built.status).toBe("completed");
    expect(built.winnerPlayerId).toBe(playerId);
    expect(() => applyCommand(built, playerId, { kind: "end_turn" })).toThrowError(
      expect.objectContaining({ code: "GAME_FINISHED" }),
    );
  });

  it("performs a conservative four-to-one bank trade", () => {
    let state = enterBuildPhase();
    const playerId = state.activePlayerId;
    state = giveBuildCost(
      giveBuildCost(
        giveBuildCost(giveBuildCost(state, playerId, "road"), playerId, "road"),
        playerId,
        "road",
      ),
      playerId,
      "road",
    );
    const before = state.players.find((player) => player.id === playerId)!;
    const traded = applyCommand(state, playerId, {
      give: "brick",
      kind: "trade_bank",
      receive: "stone",
    });
    const after = traded.players.find((player) => player.id === playerId)!;

    expect(after.resources.brick).toBe(before.resources.brick - 4);
    expect(after.resources.stone).toBe(before.resources.stone + 1);
    expect(traded.bank.brick).toBe(state.bank.brick + 4);
    expect(traded.bank.stone).toBe(state.bank.stone - 1);
  });

  it("rejects unknown bank-trade resources without changing state", () => {
    const state = enterBuildPhase();
    const unchanged = structuredClone(state);
    const invalidTrades = [
      { give: "gold", kind: "trade_bank", receive: "stone" },
      { give: "brick", kind: "trade_bank", receive: "gold" },
    ] as const;

    for (const command of invalidTrades) {
      expect(() =>
        applyCommand(state, state.activePlayerId, command as unknown as GameCommand),
      ).toThrowError(expect.objectContaining({ code: "INVALID_TRADE" }));
      expect(state).toEqual(unchanged);
    }
  });
});
