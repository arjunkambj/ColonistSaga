import { describe, expect, test } from "bun:test";

import {
  createDefaultGame,
  getBoardTopology,
  getLongestRoadLength,
  type BoardTopology,
} from "../src/index";

const PLAYERS = Array.from({ length: 3 }, (_, index) => ({
  displayName: `Player ${index + 1}`,
  id: `player-${index + 1}`,
  isBot: true,
}));

function findSimpleRoadPath(topology: BoardTopology, length: number): string[] {
  const visit = (
    vertexKey: string,
    edgeKeys: string[],
    visitedVertexKeys: Set<string>,
  ): string[] | null => {
    if (edgeKeys.length === length) {
      return edgeKeys;
    }

    for (const edgeKey of topology.vertexEdges[vertexKey] ?? []) {
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
