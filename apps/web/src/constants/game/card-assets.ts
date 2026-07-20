import type { ResourceType } from "@colonistsaga/game";

export const RESOURCE_CARD_ASSET_PATHS: Readonly<Record<ResourceType, string>> = {
  brick: "/game-assets/cards/resources/brick-card-v1.png",
  sheep: "/game-assets/cards/resources/sheep-card-v1.png",
  stone: "/game-assets/cards/resources/stone-card-v1.png",
  tree: "/game-assets/cards/resources/tree-card-v1.png",
  wheat: "/game-assets/cards/resources/wheat-card-v1.png",
};

export const ACTION_CARD_ASSET_PATHS = {
  city: "/game-assets/cards/actions/city-card-v1.png",
  endTurn: "/game-assets/cards/actions/end-turn-card-v1.png",
  road: "/game-assets/cards/actions/road-card-v1.png",
  settlement: "/game-assets/cards/actions/settlement-card-v1.png",
  trade: "/game-assets/cards/actions/trade-card-v1.png",
} as const;

export const DEVELOPMENT_CARD_BACK_ASSET_PATH =
  "/game-assets/cards/development/hidden-card-back-v1.png";

export const DEVELOPMENT_CARD_ASSETS = [
  {
    description: "Robber-movement card concept.",
    id: "knight",
    label: "Knight",
    path: "/game-assets/cards/development/knight-v1.png",
  },
  {
    description: "Two-road construction card concept.",
    id: "road-building",
    label: "Road Building",
    path: "/game-assets/cards/development/road-building-v1.png",
  },
  {
    description: "Two-resource choice card concept.",
    id: "year-of-plenty",
    label: "Year of Plenty",
    path: "/game-assets/cards/development/year-of-plenty-v1.png",
  },
  {
    description: "Named-resource collection card concept.",
    id: "monopoly",
    label: "Monopoly",
    path: "/game-assets/cards/development/monopoly-v1.png",
  },
  {
    description: "Hidden victory achievement card concept.",
    id: "victory-point",
    label: "Victory Point",
    path: "/game-assets/cards/development/victory-point-v1.png",
  },
] as const;

export const GAME_CARD_ASSET_PATHS = [
  ...Object.values(RESOURCE_CARD_ASSET_PATHS),
  ...Object.values(ACTION_CARD_ASSET_PATHS),
  DEVELOPMENT_CARD_BACK_ASSET_PATH,
  ...DEVELOPMENT_CARD_ASSETS.map(({ path }) => path),
] as const;

export function getCardRuntimeAssetPath(sourcePath: string): string {
  const cardRoot = "/game-assets/cards/";
  if (!sourcePath.startsWith(cardRoot) || !sourcePath.endsWith(".png")) {
    throw new Error(`Invalid source card asset path: ${sourcePath}`);
  }

  return sourcePath.replace(cardRoot, `${cardRoot}runtime/`).replace(/\.png$/, ".webp");
}

export const GAME_CARD_RUNTIME_ASSET_PATHS = GAME_CARD_ASSET_PATHS.map(getCardRuntimeAssetPath);
