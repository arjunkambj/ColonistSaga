import { TERRAIN_RESOURCE } from "./constants";
import { DEFAULT_TOPOLOGY, getTileId } from "./topology";
import type {
  BoardState,
  GameMapId,
  PortDescriptor,
  ResourceType,
  TerrainType,
  TileState,
} from "./types";

interface TileDefinition {
  numberToken: number | null;
  q: number;
  r: number;
  terrain: TerrainType;
}

export const DEFAULT_TILE_DEFINITIONS: readonly TileDefinition[] = [
  { numberToken: 10, q: 0, r: -2, terrain: "mountains" },
  { numberToken: 2, q: 1, r: -2, terrain: "pasture" },
  { numberToken: 9, q: 2, r: -2, terrain: "forest" },
  { numberToken: 12, q: -1, r: -1, terrain: "fields" },
  { numberToken: 6, q: 0, r: -1, terrain: "hills" },
  { numberToken: 4, q: 1, r: -1, terrain: "pasture" },
  { numberToken: 10, q: 2, r: -1, terrain: "forest" },
  { numberToken: 9, q: -2, r: 0, terrain: "forest" },
  { numberToken: 11, q: -1, r: 0, terrain: "fields" },
  { numberToken: null, q: 0, r: 0, terrain: "desert" },
  { numberToken: 3, q: 1, r: 0, terrain: "mountains" },
  { numberToken: 8, q: 2, r: 0, terrain: "fields" },
  { numberToken: 8, q: -2, r: 1, terrain: "pasture" },
  { numberToken: 3, q: -1, r: 1, terrain: "hills" },
  { numberToken: 4, q: 0, r: 1, terrain: "forest" },
  { numberToken: 5, q: 1, r: 1, terrain: "mountains" },
  { numberToken: 5, q: -2, r: 2, terrain: "hills" },
  { numberToken: 6, q: -1, r: 2, terrain: "fields" },
  { numberToken: 11, q: 0, r: 2, terrain: "pasture" },
];

function edgeAngle(edgeKey: string) {
  const [firstVertexKey, secondVertexKey] = DEFAULT_TOPOLOGY.edgeVertices[edgeKey] ?? [];
  const first = firstVertexKey ? DEFAULT_TOPOLOGY.vertexPositions[firstVertexKey] : undefined;
  const second = secondVertexKey ? DEFAULT_TOPOLOGY.vertexPositions[secondVertexKey] : undefined;

  if (!first || !second) {
    throw new Error(`Missing coastline geometry for ${edgeKey}`);
  }

  const midpointX = first.x + second.x;
  const midpointY = Math.sqrt(3) * (first.y + second.y);
  return Math.atan2(midpointY, midpointX);
}

const PORT_EDGE_INDEXES = [0, 3, 7, 10, 13, 17, 20, 23, 27] as const;
const PORT_TRADES: readonly ("any" | ResourceType)[] = [
  "any",
  "tree",
  "any",
  "brick",
  "any",
  "sheep",
  "any",
  "wheat",
  "stone",
];

const orderedCoastEdges = [...DEFAULT_TOPOLOGY.coastEdgeKeys].sort(
  (first, second) => edgeAngle(first) - edgeAngle(second),
);

export const DEFAULT_PORTS: readonly PortDescriptor[] = PORT_EDGE_INDEXES.map(
  (edgeIndex, index) => {
    const edgeKey = orderedCoastEdges[edgeIndex];
    const trade = PORT_TRADES[index];

    if (!edgeKey || !trade) {
      throw new Error("Default port configuration is incomplete");
    }

    return { edgeKey, id: `port:${index}`, trade };
  },
);

export function createDefaultBoard(): BoardState {
  const tiles: TileState[] = DEFAULT_TILE_DEFINITIONS.map((tile) => ({
    ...tile,
    id: getTileId(tile),
  }));
  const desert = tiles.find((tile) => TERRAIN_RESOURCE[tile.terrain] === null);

  if (!desert) {
    throw new Error("Default board requires a desert tile");
  }

  return {
    buildings: [],
    ports: DEFAULT_PORTS.map((port) => ({ ...port })),
    roads: [],
    robberTileId: desert.id,
    tiles,
  };
}

export function createBoard(mapId: GameMapId): BoardState {
  switch (mapId) {
    case "base":
      return createDefaultBoard();
  }
}
