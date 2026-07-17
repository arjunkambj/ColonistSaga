import assert from "node:assert/strict";
import test from "node:test";

import { BOARD_TILE, ROAD_ASSET_ROTATION_OFFSET, TERRAIN_ASSET } from "./board-assets.ts";

test("terrain artwork overlaps neighboring hexes enough to prevent seams", () => {
  const renderedWidth = (TERRAIN_ASSET.visibleWidth / TERRAIN_ASSET.size) * BOARD_TILE.renderSize;
  const renderedHeight = (TERRAIN_ASSET.visibleHeight / TERRAIN_ASSET.size) * BOARD_TILE.renderSize;
  const hexWidth = BOARD_TILE.radius * 2;
  const hexHeight = Math.sqrt(3) * BOARD_TILE.radius;

  assert.ok(renderedWidth >= hexWidth);
  assert.ok(renderedHeight >= hexHeight);
  assert.ok(renderedWidth - hexWidth < 4);
  assert.ok(renderedHeight - hexHeight < 4);
});

test("roads follow board edges without an asset-specific angle correction", () => {
  assert.equal(ROAD_ASSET_ROTATION_OFFSET, 0);
});
