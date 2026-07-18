import assert from "node:assert/strict";
import test from "node:test";

import {
  BOARD_VIEWPORT_SCALE,
  DEFAULT_BOARD_VIEWPORT,
  clampBoardViewport,
  panBoardViewport,
  zoomBoardViewport,
} from "./board-viewport.ts";

const BOUNDS = { height: 600, width: 900 };

test("clamps board scale and prevents panning below the fitted scale", () => {
  assert.deepEqual(clampBoardViewport({ scale: 0.82, x: 100, y: -100 }, BOUNDS), {
    scale: 0.82,
    x: 0,
    y: 0,
  });
  assert.equal(
    clampBoardViewport({ scale: 20, x: 0, y: 0 }, BOUNDS).scale,
    BOARD_VIEWPORT_SCALE.max,
  );
});

test("keeps the cursor focus stable while zooming", () => {
  const focus = { x: 120, y: -80 };
  const zoomed = zoomBoardViewport(DEFAULT_BOARD_VIEWPORT, 1.5, focus, BOUNDS);

  assert.deepEqual(zoomed, { scale: 1.5, x: -60, y: 40 });
});

test("limits drag distance to the visible zoomed board overflow", () => {
  const viewport = { scale: 1.5, x: 0, y: 0 };
  const panned = panBoardViewport(viewport, { x: 1_000, y: -1_000 }, BOUNDS);

  assert.deepEqual(panned, { scale: 1.5, x: 279, y: -186 });
});

test("allows a small mouse drag at the default zoom", () => {
  const panned = panBoardViewport(DEFAULT_BOARD_VIEWPORT, { x: 40, y: -30 }, BOUNDS);

  assert.deepEqual(panned, { scale: 1, x: 40, y: -30 });
});
