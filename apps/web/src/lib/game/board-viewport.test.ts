import assert from "node:assert/strict";
import test from "node:test";

import {
  BOARD_VIEWPORT_PAN,
  BOARD_VIEWPORT_SCALE,
  DEFAULT_BOARD_VIEWPORT,
  clampBoardViewport,
  getBoardViewportFocus,
  getBoardViewportTransform,
  normalizeBoardWheelDelta,
  panBoardViewport,
  pinchBoardViewport,
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

test("limits drag distance while preserving useful fitted-board travel", () => {
  const viewport = { scale: 1.5, x: 0, y: 0 };
  const panned = panBoardViewport(viewport, { x: 1_000, y: -1_000 }, BOUNDS);

  assert.deepEqual(panned, { scale: 1.5, x: 477, y: -282 });
});

test("allows broad board repositioning at the default zoom", () => {
  const panned = panBoardViewport(DEFAULT_BOARD_VIEWPORT, { x: 1_000, y: -1_000 }, BOUNDS);

  assert.deepEqual(panned, {
    scale: 1,
    x: BOUNDS.width * BOARD_VIEWPORT_PAN.fittedX,
    y: -BOUNDS.height * BOARD_VIEWPORT_PAN.fittedY,
  });
});

test("uses stationary stage coordinates for the zoom focus", () => {
  const stageBounds = { height: 600, left: 50, top: 100, width: 900 };

  assert.deepEqual(getBoardViewportFocus({ x: 620, y: 320 }, stageBounds), {
    x: 120,
    y: -80,
  });
});

test("combines pinch zoom and centroid pan in one viewport update", () => {
  const pinched = pinchBoardViewport(
    DEFAULT_BOARD_VIEWPORT,
    1.5,
    { x: 100, y: 40 },
    { x: 130, y: 55 },
    BOUNDS,
  );

  assert.deepEqual(pinched, { scale: 1.5, x: -20, y: -5 });
});

test("normalizes pixel, line, and page wheel deltas", () => {
  assert.equal(normalizeBoardWheelDelta(12, 0, 600), 12);
  assert.equal(normalizeBoardWheelDelta(3, 1, 600), 48);
  assert.equal(normalizeBoardWheelDelta(-1, 2, 600), -600);
  assert.equal(normalizeBoardWheelDelta(-1, 2, 600, 80), -80);
});

test("serializes the camera viewport as one compositor transform", () => {
  assert.equal(
    getBoardViewportTransform({ scale: 1.25, x: 18, y: -7 }),
    "translate3d(18px, -7px, 0) scale(1.25)",
  );
});
