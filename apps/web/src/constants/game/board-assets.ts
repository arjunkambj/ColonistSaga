export const BOARD_TILE = {
  radius: 145,
  renderSize: 364,
} as const;

export const TERRAIN_ASSET = {
  revision: "regular-hex-v1",
  size: 512,
  visibleHeight: 358,
  visibleWidth: 412,
} as const;

export function getTerrainAssetPath(terrain: string) {
  return `/game-assets/terrain/${terrain}.png?v=${TERRAIN_ASSET.revision}`;
}

export const ROAD_ASSET_ROTATION_OFFSET = 0 as const;
