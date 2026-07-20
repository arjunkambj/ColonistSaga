import type { GameCommand, PixelCoordinate, PlayerColor, PlayerGameView } from "@colonistsaga/game";

import { getEdgePlacement, getTilePoint, getVertexPoint, type BoardLayout } from "./board-layout";

export type BoardBuildMode = "city" | "road" | "settlement" | null;
export type BoardTargetMode = Exclude<BoardBuildMode, null> | "robber";
export type BoardTargetPlacement = "edge" | "tile" | "vertex";

type BuildCityCommand = Extract<GameCommand, { kind: "build_city" }>;
type MoveRobberCommand = Extract<GameCommand, { kind: "move_robber" }>;
type PlaceRoadCommand = Extract<GameCommand, { kind: "place_road" }>;
type PlaceSettlementCommand = Extract<GameCommand, { kind: "place_settlement" }>;

interface BoardCanvasTargetPresentation {
  readonly ariaHidden: boolean;
  readonly compactLabel: string;
  readonly compactPlacement: boolean;
  readonly interactive: boolean;
  readonly label: string;
  readonly marker: number;
  readonly showMarker: boolean;
}

interface BoardCanvasTargetBase<
  TAsset extends BoardTargetMode,
  TPlacement extends BoardTargetPlacement,
  TCommand extends GameCommand,
> extends BoardCanvasTargetPresentation {
  readonly angle: number;
  readonly asset: TAsset;
  readonly command: TCommand;
  readonly id: string;
  readonly locationKey: string;
  readonly point: Readonly<PixelCoordinate>;
  readonly successMessage: string;
  readonly theme: PlayerColor;
  readonly type: TPlacement;
}

export type BoardCanvasSettlementTargetModel = BoardCanvasTargetBase<
  "settlement",
  "vertex",
  PlaceSettlementCommand
>;

export type BoardCanvasCityTargetModel = BoardCanvasTargetBase<"city", "vertex", BuildCityCommand>;

export type BoardCanvasRoadTargetModel = BoardCanvasTargetBase<"road", "edge", PlaceRoadCommand>;

export type BoardCanvasRobberTargetModel = BoardCanvasTargetBase<
  "robber",
  "tile",
  MoveRobberCommand
>;

export type BoardCanvasTargetModel =
  | BoardCanvasCityTargetModel
  | BoardCanvasRoadTargetModel
  | BoardCanvasRobberTargetModel
  | BoardCanvasSettlementTargetModel;

export interface CreateBoardCanvasTargetModelsInput {
  readonly buildMode: BoardBuildMode;
  readonly compactPlacement: boolean;
  readonly game: PlayerGameView;
  readonly layout: BoardLayout;
  readonly viewerTheme: PlayerColor;
}

export function createBoardCanvasTargetModels({
  buildMode,
  compactPlacement,
  game,
  layout,
  viewerTheme,
}: CreateBoardCanvasTargetModelsInput): readonly BoardCanvasTargetModel[] {
  const mode = resolveBoardTargetMode(game, buildMode);

  switch (mode) {
    case "city":
      return createCityTargets(game, layout, viewerTheme, compactPlacement);
    case "road":
      return createRoadTargets(game, layout, viewerTheme, compactPlacement);
    case "robber":
      return createRobberTargets(game, layout, viewerTheme, compactPlacement);
    case "settlement":
      return createSettlementTargets(game, layout, viewerTheme, compactPlacement);
    case null:
      return [];
  }
}

export function resolveBoardTargetMode(
  game: PlayerGameView,
  buildMode: BoardBuildMode,
): BoardTargetMode | null {
  if (!game.legalActions.isRequiredActor) {
    return null;
  }

  switch (game.phase.kind) {
    case "setup_settlement":
      return "settlement";
    case "setup_road":
      return "road";
    case "move_robber":
      return "robber";
    default:
      return buildMode;
  }
}

function createSettlementTargets(
  game: PlayerGameView,
  layout: BoardLayout,
  theme: PlayerColor,
  compactPlacement: boolean,
): readonly BoardCanvasSettlementTargetModel[] {
  const targets = game.legalActions.settlementVertexKeys.flatMap((vertexKey) => {
    const point = getVertexPoint(layout, vertexKey);

    return point ? [{ point, vertexKey }] : [];
  });

  return targets.map(({ point, vertexKey }, index) => ({
    angle: 0,
    asset: "settlement",
    command: { kind: "place_settlement", vertexKey },
    id: `settlement:${vertexKey}`,
    locationKey: vertexKey,
    point,
    successMessage: "Settlement placed.",
    theme,
    type: "vertex",
    ...createTargetPresentation("settlement", index, compactPlacement),
  }));
}

function createCityTargets(
  game: PlayerGameView,
  layout: BoardLayout,
  theme: PlayerColor,
  compactPlacement: boolean,
): readonly BoardCanvasCityTargetModel[] {
  const targets = game.legalActions.cityVertexKeys.flatMap((vertexKey) => {
    const point = getVertexPoint(layout, vertexKey);

    return point ? [{ point, vertexKey }] : [];
  });

  return targets.map(({ point, vertexKey }, index) => ({
    angle: 0,
    asset: "city",
    command: { kind: "build_city", vertexKey },
    id: `city:${vertexKey}`,
    locationKey: vertexKey,
    point,
    successMessage: "City completed.",
    theme,
    type: "vertex",
    ...createTargetPresentation("city", index, compactPlacement),
  }));
}

function createRoadTargets(
  game: PlayerGameView,
  layout: BoardLayout,
  theme: PlayerColor,
  compactPlacement: boolean,
): readonly BoardCanvasRoadTargetModel[] {
  const targets = game.legalActions.roadEdgeKeys.flatMap((edgeKey) => {
    const point = getEdgePlacement(layout, edgeKey);

    return point ? [{ edgeKey, point }] : [];
  });

  return targets.map(({ edgeKey, point }, index) => ({
    angle: point.angle,
    asset: "road",
    command: { edgeKey, kind: "place_road" },
    id: `road:${edgeKey}`,
    locationKey: edgeKey,
    point: { x: point.x, y: point.y },
    successMessage: "Road placed.",
    theme,
    type: "edge",
    ...createTargetPresentation("road", index, compactPlacement),
  }));
}

function createRobberTargets(
  game: PlayerGameView,
  layout: BoardLayout,
  theme: PlayerColor,
  compactPlacement: boolean,
): readonly BoardCanvasRobberTargetModel[] {
  const tilesById = new Map(game.board.tiles.map((tile) => [tile.id, tile] as const));
  const targets = game.legalActions.robberTileIds.flatMap((tileId) => {
    const tile = tilesById.get(tileId);

    return tile ? [{ point: getTilePoint(layout, tile), tileId }] : [];
  });

  return targets.map(({ point, tileId }, index) => ({
    angle: 0,
    asset: "robber",
    command: { kind: "move_robber", tileId },
    id: `robber:${tileId}`,
    locationKey: tileId,
    point,
    successMessage: "Robber moved.",
    theme,
    type: "tile",
    ...createTargetPresentation("robber", index, compactPlacement),
  }));
}

function createTargetPresentation(
  mode: BoardTargetMode,
  index: number,
  compactPlacement: boolean,
): BoardCanvasTargetPresentation {
  const marker = index + 1;

  return {
    ariaHidden: compactPlacement,
    compactLabel: `${getCompactTargetNoun(mode)} ${marker}`,
    compactPlacement,
    interactive: !compactPlacement,
    label: `${getTargetActionLabel(mode)} ${marker}`,
    marker,
    showMarker: compactPlacement,
  };
}

function getCompactTargetNoun(mode: BoardTargetMode): string {
  return mode === "robber" ? "Tile" : capitalize(mode);
}

function getTargetActionLabel(mode: BoardTargetMode): string {
  switch (mode) {
    case "city":
      return "Upgrade city at legal location";
    case "road":
      return "Place road at legal edge";
    case "robber":
      return "Move robber to legal tile";
    case "settlement":
      return "Place settlement at legal location";
  }
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
