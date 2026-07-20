import {
  getTileId,
  type GameCommand,
  type PixelCoordinate,
  type PlayerColor,
  type PlayerGameView,
} from "@colonistsaga/game";

import { getEdgePlacement, getTilePoint, getVertexPoint, type BoardLayout } from "./board-layout";

export type BoardBuildMode = "city" | "road" | "settlement" | null;
export type BoardTargetMode = Exclude<BoardBuildMode, null> | "robber";
export type BoardTargetPlacement = "edge" | "tile" | "vertex";

type BuildCityCommand = Extract<GameCommand, { kind: "build_city" }>;
type MoveRobberCommand = Extract<GameCommand, { kind: "move_robber" }>;
type PlaceRoadCommand = Extract<GameCommand, { kind: "place_road" }>;
type PlaceSettlementCommand = Extract<GameCommand, { kind: "place_settlement" }>;
type BoardTile = PlayerGameView["board"]["tiles"][number];

const TERRAIN_LABELS: Readonly<Record<BoardTile["terrain"], string>> = {
  desert: "Desert",
  fields: "Fields",
  forest: "Forest",
  hills: "Hills",
  mountains: "Mountains",
  pasture: "Pasture",
};

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
  const tilesByTopologyId = indexTilesByTopologyId(game.board.tiles);
  const targets = game.legalActions.settlementVertexKeys.flatMap((vertexKey) => {
    const point = getVertexPoint(layout, vertexKey);

    return point
      ? [
          {
            point,
            terrainContext: getAdjacentTerrainContext(
              layout.topology.vertexTileIds[vertexKey],
              tilesByTopologyId,
            ),
            vertexKey,
          },
        ]
      : [];
  });

  return targets.map(({ point, terrainContext, vertexKey }, index) => ({
    angle: 0,
    asset: "settlement",
    command: { kind: "place_settlement", vertexKey },
    id: `settlement:${vertexKey}`,
    locationKey: vertexKey,
    point,
    successMessage: "Settlement placed.",
    theme,
    type: "vertex",
    ...createTargetPresentation(
      "settlement",
      index,
      targets.length,
      terrainContext,
      compactPlacement,
    ),
  }));
}

function createCityTargets(
  game: PlayerGameView,
  layout: BoardLayout,
  theme: PlayerColor,
  compactPlacement: boolean,
): readonly BoardCanvasCityTargetModel[] {
  const tilesByTopologyId = indexTilesByTopologyId(game.board.tiles);
  const targets = game.legalActions.cityVertexKeys.flatMap((vertexKey) => {
    const point = getVertexPoint(layout, vertexKey);

    return point
      ? [
          {
            point,
            terrainContext: getAdjacentTerrainContext(
              layout.topology.vertexTileIds[vertexKey],
              tilesByTopologyId,
            ),
            vertexKey,
          },
        ]
      : [];
  });

  return targets.map(({ point, terrainContext, vertexKey }, index) => ({
    angle: 0,
    asset: "city",
    command: { kind: "build_city", vertexKey },
    id: `city:${vertexKey}`,
    locationKey: vertexKey,
    point,
    successMessage: "City completed.",
    theme,
    type: "vertex",
    ...createTargetPresentation("city", index, targets.length, terrainContext, compactPlacement),
  }));
}

function createRoadTargets(
  game: PlayerGameView,
  layout: BoardLayout,
  theme: PlayerColor,
  compactPlacement: boolean,
): readonly BoardCanvasRoadTargetModel[] {
  const tilesByTopologyId = indexTilesByTopologyId(game.board.tiles);
  const targets = game.legalActions.roadEdgeKeys.flatMap((edgeKey) => {
    const point = getEdgePlacement(layout, edgeKey);

    return point
      ? [
          {
            edgeKey,
            point,
            terrainContext: getAdjacentTerrainContext(
              layout.topology.edgeTileIds[edgeKey],
              tilesByTopologyId,
            ),
          },
        ]
      : [];
  });

  return targets.map(({ edgeKey, point, terrainContext }, index) => ({
    angle: point.angle,
    asset: "road",
    command: { edgeKey, kind: "place_road" },
    id: `road:${edgeKey}`,
    locationKey: edgeKey,
    point: { x: point.x, y: point.y },
    successMessage: "Road placed.",
    theme,
    type: "edge",
    ...createTargetPresentation("road", index, targets.length, terrainContext, compactPlacement),
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

    return tile
      ? [{ point: getTilePoint(layout, tile), terrainContext: getTerrainContext(tile), tileId }]
      : [];
  });

  return targets.map(({ point, terrainContext, tileId }, index) => ({
    angle: 0,
    asset: "robber",
    command: { kind: "move_robber", tileId },
    id: `robber:${tileId}`,
    locationKey: tileId,
    point,
    successMessage: "Robber moved.",
    theme,
    type: "tile",
    ...createTargetPresentation("robber", index, targets.length, terrainContext, compactPlacement),
  }));
}

function createTargetPresentation(
  mode: BoardTargetMode,
  index: number,
  optionCount: number,
  terrainContext: string,
  compactPlacement: boolean,
): BoardCanvasTargetPresentation {
  const marker = index + 1;

  return {
    ariaHidden: compactPlacement,
    compactLabel: `${getCompactTargetNoun(mode)} ${marker}`,
    compactPlacement,
    interactive: !compactPlacement,
    label: `${getTargetActionLabel(mode, terrainContext)}; option ${marker} of ${optionCount}`,
    marker,
    showMarker: compactPlacement,
  };
}

function indexTilesByTopologyId(tiles: readonly BoardTile[]): ReadonlyMap<string, BoardTile> {
  return new Map(tiles.map((tile) => [getTileId(tile), tile] as const));
}

function getAdjacentTerrainContext(
  tileIds: readonly string[] | undefined,
  tilesByTopologyId: ReadonlyMap<string, BoardTile>,
): string {
  const labels = (tileIds ?? []).flatMap((tileId) => {
    const tile = tilesByTopologyId.get(tileId);
    return tile ? [getTerrainContext(tile)] : [];
  });

  return formatList(labels);
}

function getTerrainContext(tile: BoardTile): string {
  const terrain = TERRAIN_LABELS[tile.terrain];
  return tile.numberToken === null ? terrain : `${terrain} ${tile.numberToken}`;
}

function formatList(values: readonly string[]): string {
  if (values.length < 2) {
    return values[0] ?? "";
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function getCompactTargetNoun(mode: BoardTargetMode): string {
  return mode === "robber" ? "Tile" : capitalize(mode);
}

function getTargetActionLabel(mode: BoardTargetMode, terrainContext: string): string {
  const adjacentContext = terrainContext ? ` beside ${terrainContext}` : "";

  switch (mode) {
    case "city":
      return `Upgrade city at legal vertex${adjacentContext}`;
    case "road":
      return `Place road at legal edge${adjacentContext}`;
    case "robber":
      return terrainContext ? `Move robber to ${terrainContext} tile` : "Move robber to legal tile";
    case "settlement":
      return `Place settlement at legal vertex${adjacentContext}`;
  }
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
