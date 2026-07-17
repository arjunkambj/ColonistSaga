import type { BaseGameSettings } from "@catansaga/game";

export type BotCount = 0 | 1 | 2 | 3;

export function getBotCapacity(
  maxPlayers: BaseGameSettings["maxPlayers"],
  humanCount: number,
): BotCount {
  return toBotCount(Math.max(0, maxPlayers - humanCount));
}

export function getMinimumPlayerCount(humanCount: number): BaseGameSettings["maxPlayers"] {
  return humanCount > 3 ? 4 : 3;
}

export function toBotCount(value: number): BotCount {
  return clampInteger(value, 0, 3) as BotCount;
}

function clampInteger(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) {
    return minimum;
  }
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}
