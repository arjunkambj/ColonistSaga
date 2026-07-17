import { DEFAULT_TOPOLOGY, axialToPixel } from "@catansaga/game";
import type { AxialCoordinate, PixelCoordinate } from "@catansaga/game";

export const BOARD_CANVAS = {
  centerX: 600,
  centerY: 660,
  height: 1320,
  tileImageSize: 360,
  tileRadius: 145,
  width: 1200,
} as const;

export interface EdgePlacement extends PixelCoordinate {
  angle: number;
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

export function getPortPoint(edgeKey: string): EdgePlacement | null {
  const edge = getEdgePlacement(edgeKey);
  if (!edge) {
    return null;
  }

  const relativeX = edge.x - BOARD_CANVAS.centerX;
  const relativeY = edge.y - BOARD_CANVAS.centerY;
  const length = Math.hypot(relativeX, relativeY) || 1;
  const outwardDistance = 66;

  return {
    ...edge,
    x: edge.x + (relativeX / length) * outwardDistance,
    y: edge.y + (relativeY / length) * outwardDistance,
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
