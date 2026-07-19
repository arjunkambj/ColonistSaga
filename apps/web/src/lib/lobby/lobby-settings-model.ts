import type { BaseGameSettings, GameMapId } from "@colonistsaga/game";
import { getGameMapDefinition } from "@colonistsaga/game/maps";

export type BotCount = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export function getBotCapacity(
  maxPlayers: BaseGameSettings["maxPlayers"],
  humanCount: number,
): BotCount {
  return toBotCount(Math.max(0, maxPlayers - humanCount));
}

export function getMinimumPlayerCount(
  mapId: GameMapId,
  humanCount: number,
): BaseGameSettings["maxPlayers"] {
  const playerCounts = getGameMapDefinition(mapId).playerCounts;
  return (
    playerCounts.find((playerCount) => playerCount >= humanCount) ??
    playerCounts[playerCounts.length - 1]!
  );
}

export function toBotCount(value: number): BotCount {
  return clampInteger(value, 0, 7) as BotCount;
}

function clampInteger(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) {
    return minimum;
  }
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}
