import { getBoardTopology } from "./topology";
import type { BoardState, PlayerId } from "./types";

export function getLongestRoadLength(board: BoardState, playerId: PlayerId): number {
  const topology = getBoardTopology(board.tiles);
  const playerRoadEdgeKeys = new Set(
    board.roads.filter((road) => road.playerId === playerId).map((road) => road.edgeKey),
  );

  if (playerRoadEdgeKeys.size === 0) {
    return 0;
  }

  const blockedVertexKeys = new Set(
    board.buildings
      .filter((building) => building.playerId !== playerId)
      .map((building) => building.vertexKey),
  );

  const visit = (vertexKey: string, usedEdgeKeys: Set<string>): number => {
    if (usedEdgeKeys.size > 0 && blockedVertexKeys.has(vertexKey)) {
      return usedEdgeKeys.size;
    }

    let longestLength = usedEdgeKeys.size;

    for (const edgeKey of topology.vertexEdges[vertexKey] ?? []) {
      if (!playerRoadEdgeKeys.has(edgeKey) || usedEdgeKeys.has(edgeKey)) {
        continue;
      }

      const [firstVertexKey, secondVertexKey] = topology.edgeVertices[edgeKey] ?? [];
      const nextVertexKey = firstVertexKey === vertexKey ? secondVertexKey : firstVertexKey;
      if (!nextVertexKey) {
        continue;
      }

      usedEdgeKeys.add(edgeKey);
      longestLength = Math.max(longestLength, visit(nextVertexKey, usedEdgeKeys));
      usedEdgeKeys.delete(edgeKey);
    }

    return longestLength;
  };

  const endpointKeys = new Set(
    [...playerRoadEdgeKeys].flatMap((edgeKey) => topology.edgeVertices[edgeKey] ?? []),
  );

  let longestLength = 0;
  for (const vertexKey of endpointKeys) {
    longestLength = Math.max(longestLength, visit(vertexKey, new Set()));
  }

  return longestLength;
}
