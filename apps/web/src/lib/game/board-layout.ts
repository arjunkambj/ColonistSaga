import { DEFAULT_TOPOLOGY, axialToPixel } from "@catansaga/game";
import type { AxialCoordinate, PixelCoordinate } from "@catansaga/game";

import { BOARD_TILE } from "@/constants/game/board-assets";

export const BOARD_CANVAS = {
  centerX: 600,
  centerY: 660,
  height: 1320,
  tileRadius: BOARD_TILE.radius,
  tileSize: BOARD_TILE.renderSize,
  width: 1200,
} as const;

export interface EdgePlacement extends PixelCoordinate {
  angle: number;
}

export interface PortPlacement extends EdgePlacement {
  docks: readonly [
    { end: PixelCoordinate; start: PixelCoordinate },
    { end: PixelCoordinate; start: PixelCoordinate },
  ];
}

export function getTilePoint(coordinate: AxialCoordinate): PixelCoordinate {
  return toCanvasPoint(axialToPixel(coordinate, BOARD_CANVAS.tileRadius));
}

export function getVertexPoint(vertexKey: string): PixelCoordinate | null {
  const position = DEFAULT_TOPOLOGY.vertexPositions[vertexKey];
  if (!position) {
    return null;
  }

  return toCanvasPoint({
    x: (BOARD_CANVAS.tileRadius / 2) * position.x,
    y: ((Math.sqrt(3) * BOARD_CANVAS.tileRadius) / 2) * position.y,
  });
}

export function getEdgePlacement(edgeKey: string): EdgePlacement | null {
  const [firstKey, secondKey] = DEFAULT_TOPOLOGY.edgeVertices[edgeKey] ?? [];
  const first = firstKey ? getVertexPoint(firstKey) : null;
  const second = secondKey ? getVertexPoint(secondKey) : null;

  if (!first || !second) {
    return null;
  }

  return {
    angle: (Math.atan2(second.y - first.y, second.x - first.x) * 180) / Math.PI,
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

export function getPortPlacement(edgeKey: string): PortPlacement | null {
  const edge = getEdgePlacement(edgeKey);
  const [firstVertexKey, secondVertexKey] = DEFAULT_TOPOLOGY.edgeVertices[edgeKey] ?? [];
  const firstVertex = firstVertexKey ? getVertexPoint(firstVertexKey) : null;
  const secondVertex = secondVertexKey ? getVertexPoint(secondVertexKey) : null;

  if (!edge || !firstVertex || !secondVertex) {
    return null;
  }

  const relativeX = edge.x - BOARD_CANVAS.centerX;
  const relativeY = edge.y - BOARD_CANVAS.centerY;
  const length = Math.hypot(relativeX, relativeY) || 1;
  const outward = { x: relativeX / length, y: relativeY / length };
  const tangent = { x: -outward.y, y: outward.x };
  const outwardDistance = 82;
  const point = {
    x: edge.x + outward.x * outwardDistance,
    y: edge.y + outward.y * outwardDistance,
  };
  const dockHalfWidth = 20;
  const dockInset = 12;
  const firstSide =
    (firstVertex.x - edge.x) * tangent.x + (firstVertex.y - edge.y) * tangent.y < 0 ? -1 : 1;
  const getDockEnd = (side: number) => ({
    x: point.x - outward.x * dockInset + tangent.x * dockHalfWidth * side,
    y: point.y - outward.y * dockInset + tangent.y * dockHalfWidth * side,
  });

  return {
    ...edge,
    ...point,
    docks: [
      { end: getDockEnd(firstSide), start: firstVertex },
      { end: getDockEnd(-firstSide), start: secondVertex },
    ],
  };
}

export function getPointStyle(point: PixelCoordinate) {
  return {
    left: `${(point.x / BOARD_CANVAS.width) * 100}%`,
    top: `${(point.y / BOARD_CANVAS.height) * 100}%`,
  };
}

function toCanvasPoint(point: PixelCoordinate): PixelCoordinate {
  return {
    x: BOARD_CANVAS.centerX + point.x,
    y: BOARD_CANVAS.centerY + point.y,
  };
}
