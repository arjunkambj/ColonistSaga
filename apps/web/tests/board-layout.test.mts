import { describe, expect, test } from "bun:test";

import { createBoard, type GameMapId } from "@colonistsaga/game";

import { PORT_BOAT_RENDER_SIZE } from "../src/constants/game/board-assets";
import {
  BOARD_CANVAS,
  createBoardLayout,
  getEdgePlacement,
  getPortPlacement,
  getTilePoint,
} from "../src/lib/game/board-layout";

const MAP_IDS: GameMapId[] = ["base", "extended-6", "extended-8"];

describe("port placement", () => {
  test.each(MAP_IDS)("places every %s port offshore from its coastal tile", (mapId) => {
    const board = createBoard(mapId, "port-layout");
    const layout = createBoardLayout(board.tiles);

    for (const port of board.ports) {
      const placement = getPortPlacement(layout, port.edgeKey);
      const coastalTileId = layout.topology.edgeTileIds[port.edgeKey]?.[0];
      const coastalTile = coastalTileId ? layout.topology.tileById[coastalTileId] : null;

      expect(placement).not.toBeNull();
      expect(coastalTile).toBeDefined();
      if (!placement || !coastalTile) {
        continue;
      }

      const tilePoint = getTilePoint(layout, coastalTile);
      const edgePoint = getEdgePlacement(layout, port.edgeKey);
      expect(edgePoint).not.toBeNull();
      if (!edgePoint) {
        continue;
      }
      const coastNormal = {
        x: edgePoint.x - tilePoint.x,
        y: edgePoint.y - tilePoint.y,
      };
      const portDirection = {
        x: placement.x - edgePoint.x,
        y: placement.y - edgePoint.y,
      };

      expect(portDirection.x * coastNormal.x + portDirection.y * coastNormal.y).toBeGreaterThan(0);
      expect(Math.hypot(portDirection.x, portDirection.y)).toBeGreaterThan(
        PORT_BOAT_RENDER_SIZE.height / 2,
      );
    }
  });

  test.each(MAP_IDS)("connects every %s port to its coastal edge", (mapId) => {
    const board = createBoard(mapId, "port-layout");
    const layout = createBoardLayout(board.tiles);

    for (const port of board.ports) {
      const placement = getPortPlacement(layout, port.edgeKey);
      const edge = getEdgePlacement(layout, port.edgeKey);

      expect(placement).not.toBeNull();
      expect(edge).not.toBeNull();
      if (!placement || !edge) {
        continue;
      }

      expect(
        Math.hypot(placement.dock.start.x - edge.x, placement.dock.start.y - edge.y),
      ).toBeCloseTo(0, 5);
      expect(
        Math.hypot(placement.dock.end.x - placement.x, placement.dock.end.y - placement.y),
      ).toBeGreaterThan(PORT_BOAT_RENDER_SIZE.width * 0.3);
      expect(
        Math.hypot(placement.dock.end.x - placement.x, placement.dock.end.y - placement.y),
      ).toBeLessThanOrEqual(PORT_BOAT_RENDER_SIZE.height / 2);
    }
  });

  test.each(MAP_IDS)("keeps every %s port inside the board canvas", (mapId) => {
    const board = createBoard(mapId, "port-layout");
    const layout = createBoardLayout(board.tiles);

    for (const port of board.ports) {
      const placement = getPortPlacement(layout, port.edgeKey);
      expect(placement).not.toBeNull();
      if (!placement) {
        continue;
      }

      expect(placement.x).toBeGreaterThan(PORT_BOAT_RENDER_SIZE.width / 2);
      expect(placement.x).toBeLessThan(BOARD_CANVAS.width - PORT_BOAT_RENDER_SIZE.width / 2);
      expect(placement.y).toBeGreaterThan(PORT_BOAT_RENDER_SIZE.height / 2);
      expect(placement.y).toBeLessThan(BOARD_CANVAS.height - PORT_BOAT_RENDER_SIZE.height / 2);
    }
  });
});
