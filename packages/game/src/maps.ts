import { PLAYER_COUNTS, type GameMapId, type PlayerCount, type TerrainType } from "./types";

export interface GameMapDefinition {
  readonly description: string;
  readonly id: GameMapId;
  readonly label: string;
  readonly numberTokens: readonly number[];
  readonly playerCounts: readonly PlayerCount[];
  readonly portCount: number;
  readonly terrainCounts: Readonly<Record<TerrainType, number>>;
  readonly tileCount: number;
}

const ALL_PLAYER_COUNTS = Object.freeze([...PLAYER_COUNTS]);
const STANDARD_NUMBER_TOKENS = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
const EXTENDED_6_NUMBER_TOKENS = [
  2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 8, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12,
];
const EXTENDED_8_NUMBER_TOKENS = [
  2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10, 11, 11,
  11, 12, 12, 12,
];
const EXTENDED_10_NUMBER_TOKENS = [...EXTENDED_8_NUMBER_TOKENS, 2, 3, 4, 5, 6, 8, 9];

export const GAME_MAP_DEFINITIONS: Readonly<Record<GameMapId, GameMapDefinition>> = Object.freeze({
  base: Object.freeze({
    description: "19 terrain tiles and 1 desert — the standard 3–4 player island.",
    id: "base",
    label: "4-player map",
    numberTokens: Object.freeze(STANDARD_NUMBER_TOKENS),
    playerCounts: ALL_PLAYER_COUNTS,
    portCount: 9,
    terrainCounts: Object.freeze({
      desert: 1,
      fields: 4,
      forest: 4,
      hills: 3,
      mountains: 3,
      pasture: 4,
    }),
    tileCount: 19,
  }),
  "extended-6": Object.freeze({
    description: "30 terrain tiles and 2 deserts — the official 5–6 player board size.",
    id: "extended-6",
    label: "5–6 player map",
    numberTokens: Object.freeze(EXTENDED_6_NUMBER_TOKENS),
    playerCounts: ALL_PLAYER_COUNTS,
    portCount: 11,
    terrainCounts: Object.freeze({
      desert: 2,
      fields: 6,
      forest: 6,
      hills: 5,
      mountains: 5,
      pasture: 6,
    }),
    tileCount: 30,
  }),
  "extended-8": Object.freeze({
    description: "37 terrain tiles and 2 deserts — Colonist's 7–8 player board size.",
    id: "extended-8",
    label: "7–8 player map",
    numberTokens: Object.freeze(EXTENDED_8_NUMBER_TOKENS),
    playerCounts: ALL_PLAYER_COUNTS,
    portCount: 12,
    terrainCounts: Object.freeze({
      desert: 2,
      fields: 7,
      forest: 8,
      hills: 6,
      mountains: 6,
      pasture: 8,
    }),
    tileCount: 37,
  }),
  "extended-10": Object.freeze({
    description: "44 terrain tiles and 2 deserts — a balanced 9–10 player extrapolation.",
    id: "extended-10",
    label: "9–10 player map",
    numberTokens: Object.freeze(EXTENDED_10_NUMBER_TOKENS),
    playerCounts: ALL_PLAYER_COUNTS,
    portCount: 14,
    terrainCounts: Object.freeze({
      desert: 2,
      fields: 8,
      forest: 10,
      hills: 7,
      mountains: 7,
      pasture: 10,
    }),
    tileCount: 44,
  }),
});

export const AVAILABLE_GAME_MAPS: readonly GameMapDefinition[] = Object.freeze(
  Object.values(GAME_MAP_DEFINITIONS),
);

export function getGameMapDefinition(mapId: GameMapId): GameMapDefinition {
  return GAME_MAP_DEFINITIONS[mapId];
}

export function mapSupportsPlayerCount(mapId: unknown, playerCount: number): boolean {
  if (typeof mapId !== "string") {
    return false;
  }

  const definition = GAME_MAP_DEFINITIONS[mapId as GameMapId];
  return definition?.playerCounts.some((count) => count === playerCount) ?? false;
}
