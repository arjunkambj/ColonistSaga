import { describe, expect, it } from "vitest";

import { createBoard } from "./board";
import { GAME_MAP_DEFINITIONS } from "./maps";
import { createDefaultGame } from "./state";
import { createTestPlayers } from "./test-helpers";
import { getBoardTopology } from "./topology";
import type { GameMapId, TerrainType } from "./types";

const EXPECTED_MAPS = [
  { deserts: 1, id: "base", ports: 9, tiles: 19 },
  { deserts: 2, id: "extended-6", ports: 11, tiles: 30 },
  { deserts: 2, id: "extended-8", ports: 12, tiles: 37 },
  { deserts: 2, id: "extended-10", ports: 14, tiles: 44 },
] as const;

describe("map sizes", () => {
  it.each(EXPECTED_MAPS)("creates the $id tile distribution", ({ deserts, id, ports, tiles }) => {
    const definition = GAME_MAP_DEFINITIONS[id];
    const board = createBoard(id, `map-size:${id}`);
    const topology = getBoardTopology(board.tiles);
    const terrainCounts = board.tiles.reduce<Partial<Record<TerrainType, number>>>(
      (counts, tile) => ({ ...counts, [tile.terrain]: (counts[tile.terrain] ?? 0) + 1 }),
      {},
    );

    expect(board.tiles).toHaveLength(tiles);
    expect(topology.tiles).toHaveLength(tiles);
    expect(board.ports).toHaveLength(ports);
    expect(terrainCounts.desert).toBe(deserts);
    expect(terrainCounts).toEqual(definition.terrainCounts);
    expect(board.tiles.filter((tile) => tile.numberToken !== null)).toHaveLength(
      definition.numberTokens.length,
    );
    expect(board.ports.every((port) => topology.coastEdgeKeys.includes(port.edgeKey))).toBe(true);
  });

  it.each(EXPECTED_MAPS)("keeps red number tokens separated on $id", ({ id }) => {
    const board = createBoard(id, `red-spacing:${id}`);
    const topology = getBoardTopology(board.tiles);
    const redTileIds = new Set(
      board.tiles
        .filter((tile) => tile.numberToken === 6 || tile.numberToken === 8)
        .map((tile) => tile.id),
    );

    for (const tileId of redTileIds) {
      for (const edgeKey of topology.tileById[tileId]?.edgeKeys ?? []) {
        expect(
          topology.edgeTileIds[edgeKey]?.filter((neighborId) => redTileIds.has(neighborId)),
        ).toEqual([tileId]);
      }
    }
  });

  it("randomizes desert placement deterministically instead of fixing it at the center", () => {
    const first = createBoard("base", "random-desert:first");
    const repeated = createBoard("base", "random-desert:first");
    const desertTileIds = new Set(
      Array.from(
        { length: 12 },
        (_, index) =>
          createBoard("base", `random-desert:${index}`).tiles.find(
            (tile) => tile.terrain === "desert",
          )?.id,
      ),
    );

    expect(repeated).toEqual(first);
    expect(desertTileIds.size).toBeGreaterThan(1);
    expect([...desertTileIds].some((tileId) => tileId !== "tile:0:0")).toBe(true);
  });

  it.each(["extended-6", "extended-8", "extended-10"] as const)(
    "supports a four-seat game on the larger %s map",
    (map: GameMapId) => {
      const state = createDefaultGame(createTestPlayers(), `larger-map:${map}`, { map });

      expect(state.settings.map).toBe(map);
      expect(state.board.tiles).toHaveLength(GAME_MAP_DEFINITIONS[map].tileCount);
    },
  );
});
