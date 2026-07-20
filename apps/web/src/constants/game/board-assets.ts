export const BOARD_TILE = {
  radius: 145,
  renderSize: 364,
} as const;

export const TERRAIN_ASSET = {
  revision: "tactile-v10",
  size: 512,
  visibleHeight: 358,
  visibleWidth: 412,
} as const;

const TERRAIN_ASSET_VARIANTS = ["base", "alternate", "alternate-2"] as const;

export type TerrainAssetVariant = (typeof TERRAIN_ASSET_VARIANTS)[number];

export function getTerrainAssetVariant(occurrence: number): TerrainAssetVariant {
  return TERRAIN_ASSET_VARIANTS[Math.abs(occurrence) % TERRAIN_ASSET_VARIANTS.length]!;
}

export function getTerrainAssetPath(terrain: string, variant: TerrainAssetVariant = "base") {
  const suffix = variant === "base" ? "" : `-${variant}`;

  return `/game-assets/terrain/${terrain}${suffix}.png?v=${TERRAIN_ASSET.revision}`;
}

export const OCEAN_BOARD_ASSET_PATH = "/game-assets/ui/ocean-board-canvas-v2.webp?v=tactile-v10";
export const PORT_SKIFF_ASSET_PATH = "/game-assets/ui/port-skiff-v1.png?v=tactile-v10";

export const ROAD_ASSET_ROTATION_OFFSET = 0 as const;
