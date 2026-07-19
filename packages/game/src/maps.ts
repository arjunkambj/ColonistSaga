import { PLAYER_COUNTS, type GameMapId, type PlayerCount } from "./types";

export interface GameMapDefinition {
  readonly description: string;
  readonly id: GameMapId;
  readonly label: string;
  readonly playerCounts: readonly PlayerCount[];
}

export const GAME_MAP_DEFINITIONS: Readonly<Record<GameMapId, GameMapDefinition>> = Object.freeze({
  base: Object.freeze({
    description: "The standard 19-tile island for three to eight players.",
    id: "base",
    label: "Base Map",
    playerCounts: Object.freeze([...PLAYER_COUNTS]),
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
