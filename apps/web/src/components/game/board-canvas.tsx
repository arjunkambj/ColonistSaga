"use client";

import {
  NUMBER_TOKEN_PIPS,
  type PixelCoordinate,
  type PlayerColor,
  type PlayerGameView,
  type ResourceType,
} from "@colonistsaga/game";
import { memo, useEffect, useRef, type CSSProperties, type RefObject } from "react";

import {
  ISLAND_SHELF_ASSET_PATH,
  PORT_SKIFF_ASSET_PATH,
  getTerrainAssetPath,
} from "@/constants/game/board-assets";
import { getResourceCardRuntimeAssetPath } from "@/constants/game/card-assets";
import {
  BOARD_CANVAS,
  getEdgePlacement,
  getPortPlacement,
  getTilePoint,
  getVertexPoint,
  type BoardLayout,
} from "@/lib/game/board-layout";

import { getPieceAssetPath } from "./piece-icon";

type Board = PlayerGameView["board"];
type BoardTile = Board["tiles"][number];

export interface BoardCanvasTarget {
  readonly angle: number;
  readonly asset: "city" | "road" | "robber" | "settlement";
  readonly disabled?: boolean;
  readonly highlighted?: boolean;
  readonly point: Readonly<PixelCoordinate>;
  readonly theme: PlayerColor;
}

export interface BoardCanvasProps {
  board: Board;
  boardLayout: BoardLayout;
  playerThemes: ReadonlyMap<string, PlayerColor>;
  renderScale: number;
  targets: readonly BoardCanvasTarget[];
}

interface StaticScene {
  boardLayout: BoardLayout;
  ports: Board["ports"];
  renderScale: number;
  tiles: Board["tiles"];
}

interface DynamicScene {
  boardLayout: BoardLayout;
  buildings: Board["buildings"];
  playerThemes: ReadonlyMap<string, PlayerColor>;
  renderScale: number;
  roads: Board["roads"];
  robberTileId: string;
  targets: readonly BoardCanvasTarget[];
  tiles: Board["tiles"];
}

type SceneRenderer<Scene> = (
  canvas: HTMLCanvasElement,
  scene: Scene,
  isCancelled: () => boolean,
) => Promise<void>;

const MAX_CANVAS_PIXEL_RATIO = 3;
const ROBBER_ASSET_PATH = "/game-assets/pieces/robber-piece.png";

const PLAYER_COLOR_VALUES: Readonly<Record<PlayerColor, string>> = {
  blue: "#2f8ee8",
  green: "#2fb86a",
  orange: "#f18c2c",
  pink: "#d74786",
  purple: "#8357d9",
  red: "#f04f49",
  teal: "#0f9696",
  yellow: "#bd8100",
};

const BOARD_CANVAS_STYLE: CSSProperties = {
  display: "block",
  height: "100%",
  inset: 0,
  pointerEvents: "none",
  position: "absolute",
  width: "100%",
};

const BOARD_CANVAS_CONTAINER_STYLE: CSSProperties = {
  inset: 0,
  isolation: "isolate",
  pointerEvents: "none",
  position: "absolute",
  zIndex: 1,
};

const imagePromises = new Map<string, Promise<HTMLImageElement | null>>();
const tintedPieceCanvases = new Map<string, HTMLCanvasElement>();

export const BoardCanvas = memo(function BoardCanvas({
  board,
  boardLayout,
  playerThemes,
  renderScale,
  targets,
}: BoardCanvasProps) {
  const staticCanvasRef = useRef<HTMLCanvasElement>(null);
  const dynamicCanvasRef = useRef<HTMLCanvasElement>(null);
  const staticScene: StaticScene = {
    boardLayout,
    ports: board.ports,
    renderScale,
    tiles: board.tiles,
  };
  const dynamicScene: DynamicScene = {
    boardLayout,
    buildings: board.buildings,
    playerThemes,
    renderScale,
    roads: board.roads,
    robberTileId: board.robberTileId,
    targets,
    tiles: board.tiles,
  };

  useCanvasLayer(
    staticCanvasRef,
    staticScene,
    createStaticSceneKey(staticScene),
    renderStaticScene,
  );
  useCanvasLayer(
    dynamicCanvasRef,
    dynamicScene,
    createDynamicSceneKey(dynamicScene),
    renderDynamicScene,
  );

  return (
    <div aria-hidden="true" className="board-canvas" style={BOARD_CANVAS_CONTAINER_STYLE}>
      <canvas
        aria-hidden="true"
        className="board-canvas-layer board-canvas-static"
        data-board-canvas-layer="static"
        ref={staticCanvasRef}
        style={BOARD_CANVAS_STYLE}
      />
      <canvas
        aria-hidden="true"
        className="board-canvas-layer board-canvas-dynamic"
        data-board-canvas-layer="dynamic"
        ref={dynamicCanvasRef}
        style={{ ...BOARD_CANVAS_STYLE, zIndex: 1 }}
      />
    </div>
  );
});

function useCanvasLayer<Scene>(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  scene: Scene,
  sceneKey: string,
  renderScene: SceneRenderer<Scene>,
) {
  const sceneRef = useRef(scene);
  const scheduleDrawRef = useRef<() => void>(() => undefined);
  sceneRef.current = scene;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let cancelled = false;
    let drawRevision = 0;
    let frameId = 0;

    const draw = () => {
      const revision = ++drawRevision;
      void renderScene(canvas, sceneRef.current, () => cancelled || revision !== drawRevision);
    };

    const scheduleDraw = () => {
      if (frameId !== 0) {
        cancelAnimationFrame(frameId);
      }

      frameId = requestAnimationFrame(() => {
        frameId = 0;
        draw();
      });
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleDraw);
    scheduleDrawRef.current = scheduleDraw;
    resizeObserver?.observe(canvas);
    window.addEventListener("resize", scheduleDraw, { passive: true });
    draw();

    return () => {
      cancelled = true;
      drawRevision += 1;
      scheduleDrawRef.current = () => undefined;
      resizeObserver?.disconnect();
      window.removeEventListener("resize", scheduleDraw);
      if (frameId !== 0) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [canvasRef, renderScene]);

  useEffect(() => {
    scheduleDrawRef.current();
  }, [sceneKey]);
}

async function renderStaticScene(
  canvas: HTMLCanvasElement,
  scene: StaticScene,
  isCancelled: () => boolean,
) {
  const terrainPaths = scene.tiles.map((tile) => getTerrainAssetPath(tile.terrain));
  const portResourcePaths = scene.ports.flatMap((port) =>
    port.trade === "any" ? [] : [getResourceCardRuntimeAssetPath(port.trade)],
  );
  const images = await loadImages([
    ISLAND_SHELF_ASSET_PATH,
    PORT_SKIFF_ASSET_PATH,
    ...terrainPaths,
    ...portResourcePaths,
  ]);

  if (isCancelled()) {
    return;
  }

  const context = prepareCanvas(canvas, scene.renderScale);
  if (!context) {
    return;
  }

  drawIslandShelf(context, images.get(ISLAND_SHELF_ASSET_PATH) ?? null);
  drawTerrain(context, scene, images, terrainPaths);
  drawPorts(context, scene, images);
}

async function renderDynamicScene(
  canvas: HTMLCanvasElement,
  scene: DynamicScene,
  isCancelled: () => boolean,
) {
  const piecePaths = [
    getPieceAssetPath("city"),
    getPieceAssetPath("road"),
    getPieceAssetPath("settlement"),
    ROBBER_ASSET_PATH,
  ];
  const images = await loadImages(piecePaths);

  if (isCancelled()) {
    return;
  }

  const context = prepareCanvas(canvas, scene.renderScale);
  if (!context) {
    return;
  }

  drawRoads(context, scene, images);
  drawBuildings(context, scene, images);
  drawRobber(context, scene, images.get(ROBBER_ASSET_PATH) ?? null);
  drawTargets(context, scene, images);
}

function prepareCanvas(
  canvas: HTMLCanvasElement,
  renderScale: number,
): CanvasRenderingContext2D | null {
  const cssWidth = canvas.clientWidth;
  const cssHeight = canvas.clientHeight;
  if (cssWidth <= 0 || cssHeight <= 0) {
    return null;
  }

  const pixelRatio = Math.min(
    (window.devicePixelRatio || 1) * Math.max(1, renderScale),
    MAX_CANVAS_PIXEL_RATIO,
  );
  const pixelWidth = Math.max(1, Math.round(cssWidth * pixelRatio));
  const pixelHeight = Math.max(1, Math.round(cssHeight * pixelRatio));

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  const context = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!context) {
    return null;
  }

  context.resetTransform();
  context.clearRect(0, 0, pixelWidth, pixelHeight);
  context.setTransform(
    pixelWidth / BOARD_CANVAS.width,
    0,
    0,
    pixelHeight / BOARD_CANVAS.height,
    0,
    0,
  );
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  return context;
}

function drawIslandShelf(context: CanvasRenderingContext2D, image: HTMLImageElement | null) {
  if (!image) {
    return;
  }

  context.save();
  context.shadowBlur = 14;
  context.shadowColor = "rgba(0, 70, 108, 0.32)";
  context.shadowOffsetY = 12;
  context.globalAlpha = 0.95;
  drawImageContained(context, image, { height: 1_122, width: 1_128, x: 36, y: 106 });
  context.restore();
}

function drawTerrain(
  context: CanvasRenderingContext2D,
  scene: StaticScene,
  images: ReadonlyMap<string, HTMLImageElement | null>,
  terrainPaths: readonly string[],
) {
  const tiles = scene.tiles
    .map((tile, index) => ({
      image: images.get(terrainPaths[index] ?? "") ?? null,
      point: getTilePoint(scene.boardLayout, tile),
      tile,
    }))
    .sort((first, second) => first.point.y - second.point.y);

  for (const { image, point, tile } of tiles) {
    if (image) {
      const size = scene.boardLayout.tileSize;
      context.save();
      context.shadowBlur = 2;
      context.shadowColor = "rgba(91, 65, 31, 0.2)";
      context.shadowOffsetY = 1;
      context.drawImage(image, point.x - size / 2, point.y - size / 2, size, size);
      context.restore();
    }

    if (tile.numberToken !== null) {
      drawNumberToken(context, tile, point, scene.boardLayout.tileSize);
    }
  }
}

function drawNumberToken(
  context: CanvasRenderingContext2D,
  tile: BoardTile,
  tilePoint: PixelCoordinate,
  tileSize: number,
) {
  const number = tile.numberToken;
  if (number === null) {
    return;
  }

  const point = { x: tilePoint.x, y: tilePoint.y + tileSize * 0.11 };
  const radius = Math.min(43, tileSize * 0.12);
  const isHot = number === 6 || number === 8;

  context.save();
  context.shadowBlur = 7;
  context.shadowColor = "rgba(86, 68, 47, 0.28)";
  context.shadowOffsetY = 4;
  createHexagonPath(context, point, radius);
  const rim = context.createLinearGradient(
    point.x - radius,
    point.y - radius,
    point.x + radius,
    point.y + radius,
  );
  rim.addColorStop(0, isHot ? "#ef966d" : "#f5d486");
  rim.addColorStop(1, isHot ? "#a9322e" : "#c98a32");
  context.fillStyle = rim;
  context.fill();
  context.restore();

  createHexagonPath(context, point, radius - 4);
  const face = context.createLinearGradient(
    point.x - radius,
    point.y - radius,
    point.x + radius,
    point.y + radius,
  );
  face.addColorStop(0, isHot ? "#fff0d2" : "#fff6dd");
  face.addColorStop(1, isHot ? "#f7d7aa" : "#f5dfb7");
  context.fillStyle = face;
  context.fill();

  context.fillStyle = isHot ? "#b72f27" : "#514150";
  context.font = "850 35px ui-sans-serif, system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(String(number), point.x, point.y - 5);

  const pips = NUMBER_TOKEN_PIPS[number] ?? 0;
  const pipGap = 8;
  const firstPipX = point.x - ((pips - 1) * pipGap) / 2;
  context.fillStyle = isHot ? "#c05743" : "#9b7953";
  for (let index = 0; index < pips; index += 1) {
    context.beginPath();
    context.arc(firstPipX + index * pipGap, point.y + 16, 3.2, 0, Math.PI * 2);
    context.fill();
  }
}

function drawPorts(
  context: CanvasRenderingContext2D,
  scene: StaticScene,
  images: ReadonlyMap<string, HTMLImageElement | null>,
) {
  const ports = scene.ports.flatMap((port) => {
    const placement = getPortPlacement(scene.boardLayout, port.edgeKey);
    return placement ? [{ placement, port }] : [];
  });

  for (const { placement } of ports) {
    for (const dock of placement.docks) {
      drawDock(context, dock.start, dock.end);
    }
  }

  for (const { placement, port } of ports) {
    drawPort(
      context,
      placement,
      port.trade,
      images.get(PORT_SKIFF_ASSET_PATH) ?? null,
      port.trade === "any"
        ? null
        : (images.get(getResourceCardRuntimeAssetPath(port.trade)) ?? null),
    );
  }
}

function drawDock(context: CanvasRenderingContext2D, start: PixelCoordinate, end: PixelCoordinate) {
  context.save();
  context.lineCap = "round";

  strokeLine(context, start, end, 10, "rgba(91, 57, 28, 0.46)");
  strokeLine(context, start, end, 5, "rgba(216, 155, 61, 0.76)");
  context.restore();
}

function drawPort(
  context: CanvasRenderingContext2D,
  point: PixelCoordinate,
  trade: "any" | ResourceType,
  skiffImage: HTMLImageElement | null,
  resourceImage: HTMLImageElement | null,
) {
  const width = 70;
  const height = 94;

  if (skiffImage) {
    context.save();
    context.shadowBlur = 4;
    context.shadowColor = "rgba(39, 96, 122, 0.24)";
    context.shadowOffsetY = 3;
    context.drawImage(skiffImage, point.x - width / 2, point.y - height / 2, width, height);
    context.restore();
  }

  if (trade === "any") {
    drawAnyResourceMark(context, { x: point.x, y: point.y - 10 });
  } else if (resourceImage) {
    context.drawImage(resourceImage, point.x - 12, point.y - 23, 24, 24);
  }

  const label = trade === "any" ? "3:1" : "2:1";
  context.save();
  context.font = "850 14px ui-sans-serif, system-ui, sans-serif";
  const labelWidth = context.measureText(label).width + 11;
  createRoundedRectPath(context, point.x - labelWidth / 2, point.y + 5, labelWidth, 20, 10);
  context.fillStyle = "rgba(255, 250, 233, 0.96)";
  context.shadowBlur = 3;
  context.shadowColor = "rgba(55, 49, 42, 0.2)";
  context.fill();
  context.shadowColor = "transparent";
  context.fillStyle = "#233b55";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, point.x, point.y + 15);
  context.restore();
}

function drawRoads(
  context: CanvasRenderingContext2D,
  scene: DynamicScene,
  images: ReadonlyMap<string, HTMLImageElement | null>,
) {
  const path = getPieceAssetPath("road");
  const image = images.get(path) ?? null;
  if (!image) {
    return;
  }

  for (const road of scene.roads) {
    const placement = getEdgePlacement(scene.boardLayout, road.edgeKey);
    if (!placement) {
      continue;
    }

    drawPlayerPiece(
      context,
      image,
      path,
      placement,
      134,
      scene.playerThemes.get(road.playerId) ?? "red",
      placement.angle,
    );
  }
}

function drawBuildings(
  context: CanvasRenderingContext2D,
  scene: DynamicScene,
  images: ReadonlyMap<string, HTMLImageElement | null>,
) {
  for (const building of scene.buildings) {
    const point = getVertexPoint(scene.boardLayout, building.vertexKey);
    const path = getPieceAssetPath(building.kind);
    const image = images.get(path) ?? null;
    if (!point || !image) {
      continue;
    }

    drawPlayerPiece(
      context,
      image,
      path,
      point,
      building.kind === "city" ? 108 : 94,
      scene.playerThemes.get(building.playerId) ?? "red",
    );
  }
}

function drawRobber(
  context: CanvasRenderingContext2D,
  scene: DynamicScene,
  image: HTMLImageElement | null,
) {
  if (!image) {
    return;
  }

  const tile = scene.tiles.find((candidate) => candidate.id === scene.robberTileId);
  if (!tile) {
    return;
  }

  const point = getTilePoint(scene.boardLayout, tile);
  const size = 94;
  context.save();
  context.shadowBlur = 5;
  context.shadowColor = "rgba(34, 46, 56, 0.42)";
  context.shadowOffsetY = 4;
  context.drawImage(image, point.x - size / 2, point.y - size * 0.45, size, size);
  context.restore();
}

function drawTargets(
  context: CanvasRenderingContext2D,
  scene: DynamicScene,
  images: ReadonlyMap<string, HTMLImageElement | null>,
) {
  for (const target of scene.targets) {
    const placement = { ...target.point, angle: target.angle };

    if (!target.highlighted) {
      drawTargetHint(context, target, placement);
      continue;
    }

    drawHighlightedTarget(context, target, placement);

    const path = target.asset === "robber" ? ROBBER_ASSET_PATH : getPieceAssetPath(target.asset);
    const image = images.get(path) ?? null;
    if (image) {
      drawTargetGhost(context, target, placement, image, path);
    }
  }
}

function drawTargetHint(
  context: CanvasRenderingContext2D,
  target: BoardCanvasTarget,
  placement: PixelCoordinate & { angle: number },
) {
  context.save();
  context.translate(placement.x, placement.y);
  context.rotate((placement.angle * Math.PI) / 180);
  context.globalAlpha = target.disabled ? 0.16 : 0.62;
  context.fillStyle = "#ffe7a4";

  if (target.asset === "road") {
    createRoundedRectPath(context, -15, -4, 30, 8, 4);
  } else {
    const radius = target.asset === "robber" ? 8 : 6;
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
  }

  context.fill();
  context.strokeStyle = "rgba(9, 49, 70, 0.7)";
  context.lineWidth = 2;
  context.stroke();
  context.restore();
}

function drawHighlightedTarget(
  context: CanvasRenderingContext2D,
  target: BoardCanvasTarget,
  placement: PixelCoordinate & { angle: number },
) {
  context.save();
  context.translate(placement.x, placement.y);
  context.rotate((placement.angle * Math.PI) / 180);
  context.globalAlpha = target.disabled ? 0.34 : 1;
  context.shadowBlur = 16;
  context.shadowColor = "rgba(255, 194, 45, 0.82)";
  context.fillStyle = "rgba(255, 219, 108, 0.26)";

  if (target.asset === "road") {
    createRoundedRectPath(context, -50, -19, 100, 38, 19);
  } else {
    context.beginPath();
    context.arc(0, 0, target.asset === "robber" ? 60 : 32, 0, Math.PI * 2);
  }

  context.fill();
  context.strokeStyle = "rgba(9, 45, 67, 0.82)";
  context.lineWidth = 6;
  context.stroke();
  context.strokeStyle = "#fff1bb";
  context.lineWidth = 3;
  context.stroke();
  context.restore();
}

function drawTargetGhost(
  context: CanvasRenderingContext2D,
  target: BoardCanvasTarget,
  placement: PixelCoordinate & { angle: number },
  image: HTMLImageElement,
  path: string,
) {
  const size =
    target.asset === "robber"
      ? 92
      : target.asset === "road"
        ? 94
        : target.asset === "city"
          ? 58
          : 52;
  const preview =
    target.asset === "robber"
      ? image
      : getTintedPieceCanvas(image, path, target.theme, PLAYER_COLOR_VALUES[target.theme]);

  context.save();
  context.translate(placement.x, placement.y);
  context.rotate((placement.angle * Math.PI) / 180);
  context.globalAlpha = target.disabled ? 0.18 : 0.94;
  context.shadowBlur = 12;
  context.shadowColor = "rgba(255, 199, 69, 0.72)";
  context.drawImage(preview, -size / 2, -size / 2, size, size);
  context.restore();
}

function drawPlayerPiece(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  path: string,
  point: PixelCoordinate,
  size: number,
  theme: PlayerColor,
  angle = 0,
) {
  const tintedPiece = getTintedPieceCanvas(image, path, theme, PLAYER_COLOR_VALUES[theme]);

  context.save();
  context.translate(point.x, point.y);
  context.rotate((angle * Math.PI) / 180);
  context.shadowBlur = 4;
  context.shadowColor = "rgba(15, 38, 58, 0.34)";
  context.shadowOffsetY = 2;
  context.drawImage(tintedPiece, -size / 2, -size / 2, size, size);
  context.restore();
}

function getTintedPieceCanvas(
  image: HTMLImageElement,
  path: string,
  theme: PlayerColor,
  color: string,
): HTMLCanvasElement {
  const key = `${path}:${theme}`;
  const cached = tintedPieceCanvases.get(key);
  if (cached) {
    return cached;
  }

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    return canvas;
  }

  context.drawImage(image, 0, 0);
  context.globalCompositeOperation = "source-atop";
  context.globalAlpha = 0.68;
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 0.38;
  context.drawImage(image, 0, 0);
  tintedPieceCanvases.set(key, canvas);
  return canvas;
}

function drawAnyResourceMark(context: CanvasRenderingContext2D, point: PixelCoordinate) {
  const colors = ["#3c9b55", "#d9643a", "#f3e2a1", "#e7ad2c", "#75889a"];

  context.save();
  context.shadowBlur = 2;
  context.shadowColor = "rgba(47, 55, 62, 0.25)";
  colors.forEach((color, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / colors.length;
    context.beginPath();
    context.arc(point.x + Math.cos(angle) * 8, point.y + Math.sin(angle) * 8, 4.2, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
    context.strokeStyle = "rgba(255, 251, 235, 0.95)";
    context.lineWidth = 1.2;
    context.stroke();
  });
  context.restore();
}

function strokeLine(
  context: CanvasRenderingContext2D,
  start: PixelCoordinate,
  end: PixelCoordinate,
  width: number,
  color: string,
) {
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.lineWidth = width;
  context.strokeStyle = color;
  context.stroke();
}

function createHexagonPath(
  context: CanvasRenderingContext2D,
  center: PixelCoordinate,
  radius: number,
) {
  context.beginPath();
  for (let index = 0; index < 6; index += 1) {
    const angle = -Math.PI / 2 + (index * Math.PI) / 3;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  }
  context.closePath();
}

function createRoundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function drawImageContained(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  bounds: { height: number; width: number; x: number; y: number },
) {
  const scale = Math.min(bounds.width / image.naturalWidth, bounds.height / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.drawImage(
    image,
    bounds.x + (bounds.width - width) / 2,
    bounds.y + (bounds.height - height) / 2,
    width,
    height,
  );
}

async function loadImages(paths: readonly string[]) {
  const uniquePaths = [...new Set(paths)];
  const entries = await Promise.all(
    uniquePaths.map(async (path) => [path, await loadImage(path)] as const),
  );
  return new Map(entries);
}

function loadImage(path: string): Promise<HTMLImageElement | null> {
  const cached = imagePromises.get(path);
  if (cached) {
    return cached;
  }

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => {
      imagePromises.delete(path);
      resolve(null);
    };
    image.src = path;
  });
  imagePromises.set(path, promise);
  return promise;
}

function createStaticSceneKey(scene: StaticScene): string {
  return JSON.stringify({
    layout: getLayoutKey(scene.boardLayout),
    ports: scene.ports.map(({ edgeKey, id, trade }) => [edgeKey, id, trade]),
    renderScale: scene.renderScale,
    tiles: scene.tiles.map(({ id, numberToken, q, r, terrain }) => [
      id,
      numberToken,
      q,
      r,
      terrain,
    ]),
  });
}

function createDynamicSceneKey(scene: DynamicScene): string {
  return JSON.stringify({
    buildings: scene.buildings.map(({ kind, playerId, vertexKey }) => [kind, playerId, vertexKey]),
    layout: getLayoutKey(scene.boardLayout),
    playerThemes: [...scene.playerThemes.entries()].sort(([first], [second]) =>
      first.localeCompare(second),
    ),
    renderScale: scene.renderScale,
    roads: scene.roads.map(({ edgeKey, playerId }) => [edgeKey, playerId]),
    robberTileId: scene.robberTileId,
    targets: scene.targets.map(({ angle, asset, disabled, highlighted, point, theme }) => ({
      angle,
      asset,
      disabled,
      highlighted,
      point,
      theme,
    })),
    tiles: scene.tiles.map(({ id, q, r }) => [id, q, r]),
  });
}

function getLayoutKey(boardLayout: BoardLayout) {
  return [boardLayout.origin.x, boardLayout.origin.y, boardLayout.tileRadius, boardLayout.tileSize];
}
