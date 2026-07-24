export const BOARD_TILE = {
  radius: 145,
  renderSize: 364,
} as const;

export const TERRAIN_ASSET = {
  size: 512,
  visibleHeight: 358,
  visibleWidth: 412,
} as const;

export function getTerrainAssetPath(terrain: string) {
  return `/game-assets/terrain/${terrain}.png`;
}

export const OCEAN_BOARD_ASSET_PATH = "/game-assets/ui/ocean-board-canvas.webp";
export const PORT_SKIFF_ASSET_PATH = "/game-assets/ui/port-skiff.png";
export const ISLAND_SHELF_ASSET_PATH = "/game-assets/ui/island-shelf.png";

export const ROAD_ASSET_ROTATION_OFFSET = 0 as const;
