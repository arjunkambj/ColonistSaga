export interface BoardViewportBounds {
  height: number;
  width: number;
}

export interface BoardViewportPoint {
  x: number;
  y: number;
}

export interface BoardViewportState extends BoardViewportPoint {
  scale: number;
}

export const DEFAULT_BOARD_VIEWPORT: BoardViewportState = {
  scale: 1,
  x: 0,
  y: 0,
};

export const BOARD_VIEWPORT_SCALE = {
  max: 2,
  min: 0.82,
  step: 0.16,
} as const;

export function clampBoardViewport(
  viewport: BoardViewportState,
  bounds: BoardViewportBounds,
): BoardViewportState {
  const scale = clamp(viewport.scale, BOARD_VIEWPORT_SCALE.min, BOARD_VIEWPORT_SCALE.max);
  const overflow = Math.max(0, scale - 1);
  const fittedPan = scale >= 1 ? 0.06 : 0;
  const maxX = bounds.width * (fittedPan + overflow * 0.5);
  const maxY = bounds.height * (fittedPan + overflow * 0.5);

  return {
    scale,
    x: clampOffset(viewport.x, maxX),
    y: clampOffset(viewport.y, maxY),
  };
}

export function panBoardViewport(
  viewport: BoardViewportState,
  delta: BoardViewportPoint,
  bounds: BoardViewportBounds,
): BoardViewportState {
  return clampBoardViewport(
    {
      ...viewport,
      x: viewport.x + delta.x,
      y: viewport.y + delta.y,
    },
    bounds,
  );
}

export function zoomBoardViewport(
  viewport: BoardViewportState,
  nextScale: number,
  focus: BoardViewportPoint,
  bounds: BoardViewportBounds,
): BoardViewportState {
  const scale = clamp(nextScale, BOARD_VIEWPORT_SCALE.min, BOARD_VIEWPORT_SCALE.max);
  const ratio = scale / viewport.scale;

  return clampBoardViewport(
    {
      scale,
      x: focus.x - (focus.x - viewport.x) * ratio,
      y: focus.y - (focus.y - viewport.y) * ratio,
    },
    bounds,
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampOffset(value: number, max: number): number {
  return max === 0 ? 0 : clamp(value, -max, max);
}
