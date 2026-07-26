import { describe, expect, test } from "bun:test";

import {
  BUILD_COSTS,
  RESOURCE_TYPES,
  applyCommand,
  assertGameState,
  createDefaultGame,
  getBoardTopology,
  getLongestRoadLength,
  reconcileLongestRoadAward,
  type BoardTopology,
  type GameState,
  type ResourceInventory,
} from "../src/index";

const PLAYERS = Array.from({ length: 3 }, (_, index) => ({
  displayName: `Player ${index + 1}`,
  id: `player-${index + 1}`,
  isBot: true,
}));

function findSimpleRoadPath(
  topology: BoardTopology,
  length: number,
  excludedEdgeKeys = new Set<string>(),
): string[] {
  const visit = (
    vertexKey: string,
    edgeKeys: string[],
    visitedVertexKeys: Set<string>,
  ): string[] | null => {
    if (edgeKeys.length === length) {
      return edgeKeys;
    }

    for (const edgeKey of topology.vertexEdges[vertexKey] ?? []) {
      if (excludedEdgeKeys.has(edgeKey)) {
        continue;
      }
      const [firstVertexKey, secondVertexKey] = topology.edgeVertices[edgeKey] ?? [];
      const nextVertexKey = firstVertexKey === vertexKey ? secondVertexKey : firstVertexKey;
      if (!nextVertexKey || visitedVertexKeys.has(nextVertexKey)) {
        continue;
      }

      visitedVertexKeys.add(nextVertexKey);
      const path = visit(nextVertexKey, [...edgeKeys, edgeKey], visitedVertexKeys);
      visitedVertexKeys.delete(nextVertexKey);
      if (path) {
        return path;
      }
    }

    return null;
  };

  for (const vertexKey of topology.vertexKeys) {
    const path = visit(vertexKey, [], new Set([vertexKey]));
    if (path) {
      return path;
    }
  }

  throw new Error(`Could not find a ${length}-edge road path`);
}

function sharedVertexKey(topology: BoardTopology, firstEdgeKey: string, secondEdgeKey: string) {
  const secondVertices = new Set(topology.edgeVertices[secondEdgeKey] ?? []);
  const vertexKey = (topology.edgeVertices[firstEdgeKey] ?? []).find((candidate) =>
    secondVertices.has(candidate),
  );

  if (!vertexKey) {
    throw new Error("Expected adjacent road edges");
  }

  return vertexKey;
}

describe("longest road length", () => {
  test("counts the longest continuous trail instead of every owned road", () => {
    const game = createDefaultGame(PLAYERS, "longest-road-branch");
    const topology = getBoardTopology(game.board.tiles);
    const branchVertexKey = topology.vertexKeys.find(
      (vertexKey) => (topology.vertexEdges[vertexKey]?.length ?? 0) === 3,
    );

    expect(branchVertexKey).toBeDefined();
    game.board.roads = (topology.vertexEdges[branchVertexKey!] ?? []).map((edgeKey) => ({
      edgeKey,
      playerId: PLAYERS[0]!.id,
    }));

    expect(getLongestRoadLength(game.board, PLAYERS[0]!.id)).toBe(2);
    expect(getLongestRoadLength(game.board, PLAYERS[1]!.id)).toBe(0);
  });

  test("stops a route at another player's building", () => {
    const game = createDefaultGame(PLAYERS, "longest-road-blocked");
    const topology = getBoardTopology(game.board.tiles);
    const roadEdgeKeys = findSimpleRoadPath(topology, 5);
    const blockingVertexKey = sharedVertexKey(topology, roadEdgeKeys[1]!, roadEdgeKeys[2]!);

    game.board.roads = roadEdgeKeys.map((edgeKey) => ({
      edgeKey,
      playerId: PLAYERS[0]!.id,
    }));
    game.board.buildings = [
      { kind: "settlement", playerId: PLAYERS[1]!.id, vertexKey: blockingVertexKey },
    ];

    expect(getLongestRoadLength(game.board, PLAYERS[0]!.id)).toBe(3);
  });
});

describe("longest road award", () => {
  test("awards two victory points to the first player with five continuous roads", () => {
    const game = createDefaultGame(PLAYERS, "longest-road-award");
    const roadEdgeKeys = findSimpleRoadPath(getBoardTopology(game.board.tiles), 5);
    const playerId = PLAYERS[0]!.id;
    const withRoads: GameState = {
      ...game,
      board: {
        ...game.board,
        roads: roadEdgeKeys.map((edgeKey) => ({ edgeKey, playerId })),
      },
      players: game.players.map((player) =>
        player.id === playerId
          ? { ...player, piecesRemaining: { ...player.piecesRemaining, roads: 10 } }
          : player,
      ),
    };

    const awarded = reconcileLongestRoadAward(withRoads);

    expect(awarded.longestRoadPlayerId).toBe(playerId);
    expect(awarded.players[0]!.victoryPoints).toBe(2);
  });

  test("removes the award when an opponent settlement breaks the route below five", () => {
    const game = createDefaultGame(PLAYERS, "longest-road-award-blocked");
    const topology = getBoardTopology(game.board.tiles);
    const roadEdgeKeys = findSimpleRoadPath(topology, 5);
    const playerId = PLAYERS[0]!.id;
    const blockingVertexKey = sharedVertexKey(topology, roadEdgeKeys[1]!, roadEdgeKeys[2]!);
    const awarded = reconcileLongestRoadAward({
      ...game,
      board: {
        ...game.board,
        roads: roadEdgeKeys.map((edgeKey) => ({ edgeKey, playerId })),
      },
      players: game.players.map((player) =>
        player.id === playerId
          ? { ...player, piecesRemaining: { ...player.piecesRemaining, roads: 10 } }
          : player,
      ),
    });

    const blocked = reconcileLongestRoadAward({
      ...awarded,
      board: {
        ...awarded.board,
        buildings: [
          {
            kind: "settlement",
            playerId: PLAYERS[1]!.id,
            vertexKey: blockingVertexKey,
          },
        ],
      },
    });

    expect(blocked.longestRoadPlayerId).toBeNull();
    expect(blocked.players[0]!.victoryPoints).toBe(0);
  });

  test("keeps the award with its current holder when another player ties its length", () => {
    const game = createDefaultGame(PLAYERS, "longest-road-award-tie");
    const topology = getBoardTopology(game.board.tiles);
    const firstPlayerRoads = findSimpleRoadPath(topology, 5);
    const secondPlayerRoads = findSimpleRoadPath(topology, 5, new Set(firstPlayerRoads));
    const firstPlayerId = PLAYERS[0]!.id;
    const secondPlayerId = PLAYERS[1]!.id;
    const awarded = reconcileLongestRoadAward({
      ...game,
      board: {
        ...game.board,
        roads: firstPlayerRoads.map((edgeKey) => ({ edgeKey, playerId: firstPlayerId })),
      },
      players: game.players.map((player) =>
        player.id === firstPlayerId
          ? { ...player, piecesRemaining: { ...player.piecesRemaining, roads: 10 } }
          : player,
      ),
    });
    const tied = reconcileLongestRoadAward({
      ...awarded,
      board: {
        ...awarded.board,
        roads: [
          ...awarded.board.roads,
          ...secondPlayerRoads.map((edgeKey) => ({ edgeKey, playerId: secondPlayerId })),
        ],
      },
      players: awarded.players.map((player) =>
        player.id === secondPlayerId
          ? { ...player, piecesRemaining: { ...player.piecesRemaining, roads: 10 } }
          : player,
      ),
    });

    expect(tied.longestRoadPlayerId).toBe(firstPlayerId);
    expect(tied.players[0]!.victoryPoints).toBe(2);
    expect(tied.players[1]!.victoryPoints).toBe(0);
  });

  test("the fifth road immediately completes the game when its award reaches the target", () => {
    const game = createDefaultGame(PLAYERS, "longest-road-winning-road", {
      victoryPoints: 3,
    });
    const topology = getBoardTopology(game.board.tiles);
    const roadEdgeKeys = findSimpleRoadPath(topology, 5);
    const playerId = PLAYERS[0]!.id;
    const settlementVertexKey = topology.vertexKeys[0]!;
    const resources = { ...BUILD_COSTS.road };
    const ready: GameState = {
      ...game,
      activePlayerId: playerId,
      bank: RESOURCE_TYPES.reduce<ResourceInventory>(
        (bank, resource) => {
          bank[resource] -= resources[resource];
          return bank;
        },
        { ...game.bank },
      ),
      board: {
        ...game.board,
        buildings: [{ kind: "settlement", playerId, vertexKey: settlementVertexKey }],
        roads: roadEdgeKeys.slice(0, 4).map((edgeKey) => ({ edgeKey, playerId })),
      },
      phase: { kind: "build_and_trade" },
      players: game.players.map((player) =>
        player.id === playerId
          ? {
              ...player,
              piecesRemaining: {
                ...player.piecesRemaining,
                roads: 11,
                settlements: 4,
              },
              resources,
              victoryPoints: 1,
            }
          : player,
      ),
      turnNumber: 1,
    };
    assertGameState(ready);

    const completed = applyCommand(ready, playerId, {
      edgeKey: roadEdgeKeys[4]!,
      kind: "place_road",
    });

    expect(completed.longestRoadPlayerId).toBe(playerId);
    expect(completed.players[0]!.victoryPoints).toBe(3);
    expect(completed.status).toBe("completed");
    expect(completed.winnerPlayerId).toBe(playerId);
    assertGameState(completed);
  });
});
