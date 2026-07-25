import { describe, expect, test } from "bun:test";

import { axialToPixel, createBoard, getBoardTopology, type TileState } from "../src/index";

const OFFICIAL_BASE_NUMBER_SEQUENCE = [5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11];

function coordinateRadius({ q, r }: TileState): number {
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
}

function clockwiseAngleFromTop(tile: TileState): number {
  const point = axialToPixel(tile, 1);
  return (Math.atan2(point.y, point.x) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
}

function orientRing(ring: readonly TileState[], orientation: number, direction: number) {
  const start = orientation * (ring.length / 6);
  return Array.from({ length: ring.length }, (_, index) =>
    ring.at((start + direction * index + ring.length) % ring.length),
  ).filter((tile): tile is TileState => tile !== undefined);
}

function createNumberSpirals(tiles: readonly TileState[]) {
  const outer = tiles
    .filter((tile) => coordinateRadius(tile) === 2)
    .sort((first, second) => clockwiseAngleFromTop(first) - clockwiseAngleFromTop(second));
  const inner = tiles
    .filter((tile) => coordinateRadius(tile) === 1)
    .sort((first, second) => clockwiseAngleFromTop(first) - clockwiseAngleFromTop(second));
  const center = tiles.find((tile) => coordinateRadius(tile) === 0);

  if (!center) throw new Error("Base board needs a center tile");

  return Array.from({ length: 6 }, (_, orientation) =>
    [-1, 1].map((direction) => [
      ...orientRing(outer, orientation, direction),
      ...orientRing(inner, orientation, direction),
      center,
    ]),
  ).flat();
}

describe("base board generation", () => {
  test("places the official sequence outer-ring inward under a seeded dihedral orientation", () => {
    for (const seed of ["base-sequence-a", "base-sequence-b", "base-sequence-c"]) {
      const board = createBoard("base", seed);
      const sequences = createNumberSpirals(board.tiles).map((spiral) =>
        spiral.flatMap((tile) => (tile.numberToken === null ? [] : [tile.numberToken])),
      );

      expect(sequences).toContainEqual(OFFICIAL_BASE_NUMBER_SEQUENCE);
    }
  });

  test("keeps duplicate and red numbers apart and 2/12 on the coast", () => {
    for (let index = 0; index < 100; index += 1) {
      const board = createBoard("base", `base-invariants-${index}`);
      const topology = getBoardTopology(board.tiles);
      const numberByTileId = new Map(board.tiles.map((tile) => [tile.id, tile.numberToken]));
      const coastTileIds = new Set(
        topology.coastEdgeKeys.flatMap((edgeKey) => topology.edgeTileIds[edgeKey] ?? []),
      );

      for (const tile of board.tiles) {
        if (tile.numberToken === 2 || tile.numberToken === 12) {
          expect(coastTileIds.has(tile.id)).toBe(true);
        }
      }

      for (const tileIds of Object.values(topology.edgeTileIds)) {
        if (tileIds.length !== 2) continue;
        const [firstTileId, secondTileId] = tileIds;
        const firstNumber = firstTileId ? numberByTileId.get(firstTileId) : null;
        const secondNumber = secondTileId ? numberByTileId.get(secondTileId) : null;

        if (firstNumber !== null && firstNumber !== undefined) {
          expect(firstNumber).not.toBe(secondNumber);
        }
        if (firstNumber === 6 || firstNumber === 8) {
          expect(secondNumber === 6 || secondNumber === 8).toBe(false);
        }
      }
    }
  });

  test("keeps same-terrain groups to at most two connected tiles", () => {
    for (let index = 0; index < 100; index += 1) {
      const board = createBoard("base", `base-terrain-clusters-${index}`);
      const topology = getBoardTopology(board.tiles);
      const terrainByTileId = new Map(board.tiles.map((tile) => [tile.id, tile.terrain]));
      const matchingNeighborCounts = new Map<string, number>();

      for (const tileIds of Object.values(topology.edgeTileIds)) {
        if (tileIds.length !== 2) continue;
        const [firstTileId, secondTileId] = tileIds;
        if (!firstTileId || !secondTileId) continue;

        const firstTerrain = terrainByTileId.get(firstTileId);
        const secondTerrain = terrainByTileId.get(secondTileId);
        if (!firstTerrain || firstTerrain === "desert" || firstTerrain !== secondTerrain) continue;

        matchingNeighborCounts.set(firstTileId, (matchingNeighborCounts.get(firstTileId) ?? 0) + 1);
        matchingNeighborCounts.set(
          secondTileId,
          (matchingNeighborCounts.get(secondTileId) ?? 0) + 1,
        );
      }

      expect(Math.max(0, ...matchingNeighborCounts.values())).toBeLessThanOrEqual(1);
    }
  });
});
