import { describe, expect, it } from "vitest";

import { DEFAULT_PORTS, DEFAULT_TILE_DEFINITIONS } from "./board";
import { DEFAULT_TOPOLOGY } from "./topology";

describe("default board topology", () => {
  it("creates the canonical radius-two graph", () => {
    expect(DEFAULT_TOPOLOGY.tiles).toHaveLength(19);
    expect(DEFAULT_TOPOLOGY.vertexKeys).toHaveLength(54);
    expect(DEFAULT_TOPOLOGY.edgeKeys).toHaveLength(72);
    expect(DEFAULT_TOPOLOGY.coastEdgeKeys).toHaveLength(30);
    expect(
      Object.values(DEFAULT_TOPOLOGY.edgeTileIds).filter((tileIds) => tileIds.length === 2),
    ).toHaveLength(42);

    for (const tile of DEFAULT_TOPOLOGY.tiles) {
      expect(new Set(tile.vertexKeys)).toHaveLength(6);
      expect(new Set(tile.edgeKeys)).toHaveLength(6);
    }
  });

  it("uses canonical terrain, number token, and port counts", () => {
    const terrainCounts = Object.groupBy(DEFAULT_TILE_DEFINITIONS, (tile) => tile.terrain);
    const tokenCounts = Object.groupBy(
      DEFAULT_TILE_DEFINITIONS.filter((tile) => tile.numberToken !== null),
      (tile) => String(tile.numberToken),
    );

    expect(
      Object.fromEntries(
        Object.entries(terrainCounts).map(([terrain, tiles]) => [terrain, tiles?.length]),
      ),
    ).toEqual({
      desert: 1,
      fields: 4,
      forest: 4,
      hills: 3,
      mountains: 3,
      pasture: 4,
    });
    expect(
      Object.fromEntries(
        Object.entries(tokenCounts).map(([token, tiles]) => [token, tiles?.length]),
      ),
    ).toEqual({
      "2": 1,
      "3": 2,
      "4": 2,
      "5": 2,
      "6": 2,
      "8": 2,
      "9": 2,
      "10": 2,
      "11": 2,
      "12": 1,
    });
    expect(DEFAULT_PORTS).toHaveLength(9);
    expect(DEFAULT_PORTS.filter((port) => port.trade === "any")).toHaveLength(4);
    expect(new Set(DEFAULT_PORTS.map((port) => port.edgeKey))).toHaveLength(9);
    expect(
      DEFAULT_PORTS.every((port) => DEFAULT_TOPOLOGY.coastEdgeKeys.includes(port.edgeKey)),
    ).toBe(true);

    const redTiles = DEFAULT_TILE_DEFINITIONS.filter(
      (tile) => tile.numberToken === 6 || tile.numberToken === 8,
    );
    for (const [index, tile] of redTiles.entries()) {
      const tileId = `tile:${tile.q}:${tile.r}`;
      const edges = new Set(DEFAULT_TOPOLOGY.tileById[tileId]?.edgeKeys ?? []);

      for (const other of redTiles.slice(index + 1)) {
        const otherId = `tile:${other.q}:${other.r}`;
        expect(
          (DEFAULT_TOPOLOGY.tileById[otherId]?.edgeKeys ?? []).some((edgeKey) =>
            edges.has(edgeKey),
          ),
        ).toBe(false);
      }
    }
  });
});
