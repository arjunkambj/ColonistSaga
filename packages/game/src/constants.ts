import type {
  BaseGameSettings,
  BuildingKind,
  PlayerPieces,
  ResourceInventory,
  ResourceType,
  TerrainType,
} from "./types";

export const BANK_RESOURCE_COUNT = 19;
export const BANK_TRADE_RATIO = 4;
export const ANY_PORT_TRADE_RATIO = 3;
export const RESOURCE_PORT_TRADE_RATIO = 2;
export const DEFAULT_DISCARD_LIMIT = 7;
export const MAX_PLAYER_TURNS = 500;

export const DEFAULT_BASE_GAME_SETTINGS: Readonly<BaseGameSettings> = Object.freeze({
  balancedDice: true,
  discardLimit: DEFAULT_DISCARD_LIMIT,
  friendlyRobber: true,
  hideBankCards: false,
  map: "base",
  maxPlayers: 4,
  turnTimerSeconds: 60,
  victoryPoints: 10,
});

export const INITIAL_PIECES: Readonly<PlayerPieces> = {
  cities: 4,
  roads: 15,
  settlements: 5,
};

export const BUILD_COSTS: Readonly<Record<BuildingKind | "road", Readonly<ResourceInventory>>> = {
  city: { brick: 0, sheep: 0, stone: 3, tree: 0, wheat: 2 },
  road: { brick: 1, sheep: 0, stone: 0, tree: 1, wheat: 0 },
  settlement: { brick: 1, sheep: 1, stone: 0, tree: 1, wheat: 1 },
};

export const TERRAIN_RESOURCE: Readonly<Record<TerrainType, ResourceType | null>> = {
  desert: null,
  fields: "wheat",
  forest: "tree",
  hills: "brick",
  mountains: "stone",
  pasture: "sheep",
};

export const NUMBER_TOKEN_PIPS: Readonly<Record<number, number>> = {
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  8: 5,
  9: 4,
  10: 3,
  11: 2,
  12: 1,
};

export const SETUP_SEAT_ORDER = [0, 1, 2, 3, 3, 2, 1, 0] as const;

export function getSetupSeatOrder(playerCount: 3 | 4): number[] {
  const ascending = Array.from({ length: playerCount }, (_, index) => index);
  return [...ascending, ...[...ascending].reverse()];
}

export const RESOURCE_ORDER: readonly ResourceType[] = ["tree", "brick", "sheep", "wheat", "stone"];
