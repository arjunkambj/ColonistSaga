import { TERRAIN_RESOURCE } from "./constants";
import { getGameMapDefinition } from "./maps";
import { deterministicShuffle } from "./random";
import {
  axialToPixel,
  createHexCoordinates,
  getBoardTopology,
  getTileId,
  type BoardTopology,
} from "./topology";
import { TERRAIN_TYPES } from "./types";
import type {
  AxialCoordinate,
  BoardState,
  GameMapId,
  PortDescriptor,
  ResourceType,
  TerrainType,
  TileState,
} from "./types";

const PORT_RESOURCE_ORDER: readonly ResourceType[] = ["tree", "brick", "sheep", "wheat", "stone"];

function coordinateRadius({ q, r }: AxialCoordinate): number {
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
}

function selectEvenly<Value>(values: readonly Value[], count: number): Value[] {
  return Array.from({ length: count }, (_, index) => {
    const value = values[Math.floor((index * values.length) / count)];
    if (value === undefined) {
      throw new Error("Could not select a map value");
    }
    return value;
  });
}

function createMapCoordinates(tileCount: number): AxialCoordinate[] {
  if (tileCount === 19) {
    return createHexCoordinates(2);
  }

  if (tileCount === 37) {
    return createHexCoordinates(3);
  }

  const innerRadius = tileCount < 37 ? 2 : 3;
  const inner = createHexCoordinates(innerRadius);
  const ring = createHexCoordinates(innerRadius + 1)
    .filter((coordinate) => coordinateRadius(coordinate) === innerRadius + 1)
    .sort((first, second) => {
      const firstPoint = axialToPixel(first, 1);
      const secondPoint = axialToPixel(second, 1);
      return Math.atan2(firstPoint.y, firstPoint.x) - Math.atan2(secondPoint.y, secondPoint.x);
    });

  return [...inner, ...selectEvenly(ring, tileCount - inner.length)];
}

function createTerrainPool(mapId: GameMapId): TerrainType[] {
  const { terrainCounts, tileCount } = getGameMapDefinition(mapId);
  const terrains = TERRAIN_TYPES.flatMap((terrain) =>
    Array.from({ length: terrainCounts[terrain] }, () => terrain),
  );

  if (terrains.length !== tileCount) {
    throw new Error(`The ${mapId} terrain distribution does not contain ${tileCount} tiles`);
  }

  return terrains;
}

function assignNumberTokens(
  terrainTiles: readonly Omit<TileState, "numberToken">[],
  mapId: GameMapId,
  seed: string,
  topology: BoardTopology,
): TileState[] {
  const producingTiles = terrainTiles.filter((tile) => TERRAIN_RESOURCE[tile.terrain] !== null);
  const numberTokens = getGameMapDefinition(mapId).numberTokens;

  if (producingTiles.length !== numberTokens.length) {
    throw new Error(`The ${mapId} map needs ${producingTiles.length} number tokens`);
  }

  const redNumbers = numberTokens.filter((number) => number === 6 || number === 8);
  const regularNumbers = numberTokens.filter((number) => number !== 6 && number !== 8);

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const redTiles: typeof producingTiles = [];
    const candidates = deterministicShuffle(producingTiles, `${seed}:red-tiles:${attempt}`);

    for (const candidate of candidates) {
      const candidateEdges = new Set(topology.tileById[candidate.id]?.edgeKeys ?? []);
      const touchesRedTile = redTiles.some((redTile) =>
        topology.tileById[redTile.id]?.edgeKeys.some((edgeKey) => candidateEdges.has(edgeKey)),
      );

      if (!touchesRedTile) {
        redTiles.push(candidate);
      }
      if (redTiles.length === redNumbers.length) {
        break;
      }
    }

    if (redTiles.length !== redNumbers.length) {
      continue;
    }

    const redTileIds = new Set(redTiles.map((tile) => tile.id));
    const shuffledRedNumbers = deterministicShuffle(redNumbers, `${seed}:red-numbers`);
    const shuffledRegularNumbers = deterministicShuffle(regularNumbers, `${seed}:numbers`);
    let redIndex = 0;
    let regularIndex = 0;

    return terrainTiles.map(
      (tile): TileState => ({
        ...tile,
        numberToken:
          TERRAIN_RESOURCE[tile.terrain] === null
            ? null
            : redTileIds.has(tile.id)
              ? (shuffledRedNumbers[redIndex++] ?? null)
              : (shuffledRegularNumbers[regularIndex++] ?? null),
      }),
    );
  }

  throw new Error(`Could not create a balanced number layout for ${mapId}`);
}

function edgeAngle(topology: BoardTopology, edgeKey: string): number {
  const [firstVertexKey, secondVertexKey] = topology.edgeVertices[edgeKey] ?? [];
  const first = firstVertexKey ? topology.vertexPositions[firstVertexKey] : undefined;
  const second = secondVertexKey ? topology.vertexPositions[secondVertexKey] : undefined;

  if (!first || !second) {
    throw new Error(`Missing coastline geometry for ${edgeKey}`);
  }

  const midpointX = first.x + second.x;
  const midpointY = Math.sqrt(3) * (first.y + second.y);
  return Math.atan2(midpointY, midpointX);
}

function createPortTrades(portCount: number, seed: string): ("any" | ResourceType)[] {
  const genericCount = Math.floor(portCount / 2);
  const resourceCount = portCount - genericCount;
  const resourceTrades = Array.from(
    { length: resourceCount },
    (_, index) => PORT_RESOURCE_ORDER[index % PORT_RESOURCE_ORDER.length]!,
  );

  return deterministicShuffle(
    [...Array.from({ length: genericCount }, () => "any" as const), ...resourceTrades],
    `${seed}:ports`,
  );
}

function createPorts(topology: BoardTopology, mapId: GameMapId, seed: string): PortDescriptor[] {
  const { portCount } = getGameMapDefinition(mapId);
  const coastEdges = [...topology.coastEdgeKeys].sort(
    (first, second) => edgeAngle(topology, first) - edgeAngle(topology, second),
  );
  const trades = createPortTrades(portCount, seed);

  return selectEvenly(coastEdges, portCount).map((edgeKey, index) => ({
    edgeKey,
    id: `port:${index}`,
    trade: trades[index] ?? "any",
  }));
}

export function createBoard(mapId: GameMapId, seed = "default-board"): BoardState {
  const coordinates = createMapCoordinates(getGameMapDefinition(mapId).tileCount);
  const topology = getBoardTopology(coordinates);
  const terrains = deterministicShuffle(createTerrainPool(mapId), `${seed}:terrain`);
  const terrainTiles = coordinates.map((coordinate, index) => {
    const terrain = terrains[index];
    if (!terrain) {
      throw new Error(`Missing terrain for ${getTileId(coordinate)}`);
    }
    return { ...coordinate, id: getTileId(coordinate), terrain };
  });
  const tiles = assignNumberTokens(terrainTiles, mapId, seed, topology);
  const desert = tiles.find((tile) => TERRAIN_RESOURCE[tile.terrain] === null);

  if (!desert) {
    throw new Error(`${mapId} requires a desert tile`);
  }

  return {
    buildings: [],
    ports: createPorts(topology, mapId, seed),
    roads: [],
    robberTileId: desert.id,
    tiles,
  };
}
