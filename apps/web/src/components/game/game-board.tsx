import {
  NUMBER_TOKEN_PIPS,
  TERRAIN_RESOURCE,
  type GameCommand,
  type PlayerGameView,
  type PlayerViewState,
  type ResourceType,
  type TerrainType,
} from "@catansaga/game";
import { Button } from "@heroui/react";
import moveIcon from "@iconify-icons/game-icons/move";
import minusIcon from "@iconify-icons/solar/minus-circle-outline";
import plusIcon from "@iconify-icons/solar/add-circle-outline";
import scanIcon from "@iconify-icons/solar/scanner-outline";
import { Icon } from "@iconify/react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";

import {
  BOARD_CANVAS,
  getEdgePlacement,
  getPointStyle,
  getPortPlacement,
  getTilePoint,
  getVertexPoint,
} from "@/lib/game/board-layout";
import {
  BOARD_VIEWPORT_SCALE,
  DEFAULT_BOARD_VIEWPORT,
  panBoardViewport,
  zoomBoardViewport,
  type BoardViewportState,
} from "@/lib/game/board-viewport";
import { ROAD_ASSET_ROTATION_OFFSET, TERRAIN_ASSET } from "@/constants/game/board-assets";
import { getPieceAssetPath } from "./piece-icon";
import { RESOURCE_LABELS, ResourceIcon } from "./resource-icon";

export type BuildMode = "city" | "road" | "settlement" | null;

const PLAYER_THEMES = ["red", "blue", "orange", "green"] as const;
const TERRAIN_LABELS: Readonly<Record<TerrainType, string>> = {
  desert: "Desert",
  fields: "Fields",
  forest: "Forest",
  hills: "Hills",
  mountains: "Mountains",
  pasture: "Pasture",
};
const PIECE_LABELS = {
  city: "City",
  road: "Road",
  settlement: "Settlement",
} as const;
const KEYBOARD_PAN_STEP = 48;

type BoardPieceAsset = keyof typeof PIECE_LABELS;
type BuildPreviewAsset = BoardPieceAsset | "robber";
type BoardTile = PlayerGameView["board"]["tiles"][number];
type PlayerTheme = (typeof PLAYER_THEMES)[number];

interface BoardInspectionDetail {
  label: string;
  tone?: "alert";
  value: string;
}

interface BoardInspection {
  accessibleLabel: string;
  details: readonly BoardInspectionDetail[];
  id: string;
  kicker: string;
  resource?: ResourceType;
  title: string;
}

interface InspectableBoardItemProps {
  inspection: BoardInspection;
  isInspected: boolean;
  isKeyboardTarget: boolean;
  onInspect(id: string): void;
  onKeyboardFocus(id: string): void;
  onKeyboardNavigate(event: ReactKeyboardEvent<HTMLElement>, id: string): void;
}

interface BoardDragState {
  origin: BoardViewportState;
  pointerId: number;
  startX: number;
  startY: number;
}

export function GameBoard({
  buildMode,
  game,
  onCancelBuildMode,
  onCommand,
  pending,
}: {
  buildMode: BuildMode;
  game: PlayerGameView;
  onCancelBuildMode?(): void;
  onCommand(command: GameCommand, successMessage: string): void;
  pending: boolean;
}) {
  const playerDetailsById = new Map(
    game.players.map((player) => [
      player.id,
      { displayName: player.displayName, theme: getPlayerTheme(player) },
    ]),
  );
  const viewerTheme = playerDetailsById.get(game.viewerPlayerId)?.theme ?? "red";
  const ports = game.board.ports.flatMap((port) => {
    const placement = getPortPlacement(port.edgeKey);
    return placement ? [{ ...port, placement }] : [];
  });
  const tileInspections = game.board.tiles.map((tile) =>
    createTileInspection(tile, tile.id === game.board.robberTileId),
  );
  const portInspections = ports.map((port) => createPortInspection(port.id, port.trade));
  const roadInspections = game.board.roads.map((road) => {
    const owner = playerDetailsById.get(road.playerId);
    return createPieceInspection(
      `road:${road.edgeKey}`,
      "road",
      owner?.displayName ?? "Unknown player",
      owner?.theme ?? "red",
    );
  });
  const buildingInspections = game.board.buildings.map((building) => {
    const owner = playerDetailsById.get(building.playerId);
    return createPieceInspection(
      `building:${building.vertexKey}`,
      building.kind,
      owner?.displayName ?? "Unknown player",
      owner?.theme ?? "red",
    );
  });
  const robberTile = game.board.tiles.find((tile) => tile.id === game.board.robberTileId) ?? null;
  const robberInspection = robberTile ? createRobberInspection(robberTile) : null;
  const inspectionById = new Map(
    [
      ...tileInspections,
      ...portInspections,
      ...roadInspections,
      ...buildingInspections,
      ...(robberInspection ? [robberInspection] : []),
    ].map((inspection) => [inspection.id, inspection]),
  );
  const inspectionOrder = [...inspectionById.keys()];
  const firstInspectionId = inspectionOrder[0] ?? null;
  const targetMode = getTargetMode(game, buildMode);
  const compactPlacement = useCompactPlacementLayout();
  const boardShellRef = useRef<HTMLElement>(null);
  const boardDragRef = useRef<BoardDragState | null>(null);
  const [boardViewport, setBoardViewport] = useState(DEFAULT_BOARD_VIEWPORT);
  const [inspectedItemId, setInspectedItemId] = useState<string | null>(null);
  const [keyboardInspectionId, setKeyboardInspectionId] = useState<string | null>(
    firstInspectionId,
  );
  const [isDraggingBoard, setIsDraggingBoard] = useState(false);
  const inspectedItem = inspectedItemId ? (inspectionById.get(inspectedItemId) ?? null) : null;
  const keyboardInspectionExists = keyboardInspectionId
    ? inspectionById.has(keyboardInspectionId)
    : false;

  useEffect(() => {
    if (!keyboardInspectionExists) {
      setKeyboardInspectionId(firstInspectionId);
    }
  }, [firstInspectionId, keyboardInspectionExists]);

  const getBounds = () => ({
    height: boardShellRef.current?.clientHeight ?? 1,
    width: boardShellRef.current?.clientWidth ?? 1,
  });

  const changeZoomBy = (amount: number) => {
    setBoardViewport((current) =>
      zoomBoardViewport(current, current.scale + amount, { x: 0, y: 0 }, getBounds()),
    );
  };

  const panBoardBy = (x: number, y: number) => {
    setBoardViewport((current) => panBoardViewport(current, { x, y }, getBounds()));
  };

  const inspectBoardItem = (id: string) => {
    setInspectedItemId(id);
  };

  const focusBoardItem = (id: string) => {
    setKeyboardInspectionId(id);
    inspectBoardItem(id);
  };

  const navigateBoardItems = (event: ReactKeyboardEvent<HTMLElement>, id: string) => {
    const direction = getInspectionNavigationDirection(event.key);
    if (direction === null || inspectionOrder.length === 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const currentIndex = Math.max(0, inspectionOrder.indexOf(id));
    const nextIndex =
      direction === "first"
        ? 0
        : direction === "last"
          ? inspectionOrder.length - 1
          : (currentIndex + direction + inspectionOrder.length) % inspectionOrder.length;
    const nextId = inspectionOrder[nextIndex];
    if (!nextId) {
      return;
    }

    focusBoardItem(nextId);
    const nextItem = [
      ...(boardShellRef.current?.querySelectorAll<HTMLElement>("[data-board-inspection-id]") ?? []),
    ].find((element) => element.dataset.boardInspectionId === nextId);
    nextItem?.focus();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const panDelta = getKeyboardPanDelta(event.key);
    if (panDelta) {
      event.preventDefault();
      panBoardBy(panDelta.x, panDelta.y);
      return;
    }

    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      changeZoomBy(BOARD_VIEWPORT_SCALE.step);
      return;
    }

    if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      changeZoomBy(-BOARD_VIEWPORT_SCALE.step);
      return;
    }

    if (event.key === "0") {
      event.preventDefault();
      setBoardViewport(DEFAULT_BOARD_VIEWPORT);
      return;
    }

    if (event.key === "Escape" && buildMode !== null && onCancelBuildMode) {
      event.preventDefault();
      onCancelBuildMode();
    }
  };

  const handleWheel = (event: ReactWheelEvent<HTMLElement>) => {
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const focus = {
      x: event.clientX - bounds.left - bounds.width / 2,
      y: event.clientY - bounds.top - bounds.height / 2,
    };
    setBoardViewport((current) =>
      zoomBoardViewport(current, current.scale * Math.exp(-event.deltaY * 0.0012), focus, bounds),
    );
  };

  const startDraggingBoard = (event: ReactPointerEvent<HTMLElement>) => {
    if (
      event.button !== 0 ||
      (event.target instanceof Element && event.target.closest("button, .board-navigation"))
    ) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    boardDragRef.current = {
      origin: boardViewport,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
    setIsDraggingBoard(true);
  };

  const dragBoard = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = boardDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    setBoardViewport(
      panBoardViewport(
        drag.origin,
        { x: event.clientX - drag.startX, y: event.clientY - drag.startY },
        getBounds(),
      ),
    );
  };

  const stopDraggingBoard = (event: ReactPointerEvent<HTMLElement>) => {
    if (boardDragRef.current?.pointerId !== event.pointerId) {
      return;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    boardDragRef.current = null;
    setIsDraggingBoard(false);
  };

  return (
    <section
      aria-label="Game board. Hover a board item for visual details, or Tab into the board items and use arrow keys to inspect them. When the board itself is focused, drag or use arrow keys to pan, use the mouse wheel or plus and minus keys to zoom, and press zero to reset."
      className={isDraggingBoard ? "board-shell is-dragging" : "board-shell"}
      onKeyDown={handleKeyDown}
      onPointerCancel={stopDraggingBoard}
      onPointerDown={startDraggingBoard}
      onPointerMove={dragBoard}
      onPointerUp={stopDraggingBoard}
      onWheel={handleWheel}
      ref={boardShellRef}
      tabIndex={0}
    >
      <div className="board-navigation">
        <span className="board-gesture-hint">
          <Icon aria-hidden="true" icon={moveIcon} />
          <span>Drag or use arrows</span>
          <small>Scroll or +/− to zoom</small>
        </span>
        <div aria-label="Board zoom controls" role="group">
          <Button
            aria-label="Zoom out"
            className="board-navigation-button"
            isDisabled={boardViewport.scale <= BOARD_VIEWPORT_SCALE.min}
            isIconOnly
            onPress={() => changeZoomBy(-BOARD_VIEWPORT_SCALE.step)}
            size="sm"
            variant="secondary"
          >
            <Icon aria-hidden="true" icon={minusIcon} />
          </Button>
          <output aria-label="Current board zoom" className="board-zoom-level">
            {Math.round(boardViewport.scale * 100)}%
          </output>
          <Button
            aria-label="Zoom in"
            className="board-navigation-button"
            isDisabled={boardViewport.scale >= BOARD_VIEWPORT_SCALE.max}
            isIconOnly
            onPress={() => changeZoomBy(BOARD_VIEWPORT_SCALE.step)}
            size="sm"
            variant="secondary"
          >
            <Icon aria-hidden="true" icon={plusIcon} />
          </Button>
          <Button
            aria-label="Reset board view"
            className="board-navigation-button"
            isDisabled={
              boardViewport.scale === DEFAULT_BOARD_VIEWPORT.scale &&
              boardViewport.x === DEFAULT_BOARD_VIEWPORT.x &&
              boardViewport.y === DEFAULT_BOARD_VIEWPORT.y
            }
            isIconOnly
            onPress={() => setBoardViewport(DEFAULT_BOARD_VIEWPORT)}
            size="sm"
            variant="secondary"
          >
            <Icon aria-hidden="true" icon={scanIcon} />
          </Button>
        </div>
      </div>
      <div
        className="game-board"
        style={
          {
            "--board-scale": boardViewport.scale,
            "--board-x": `${boardViewport.x}px`,
            "--board-y": `${boardViewport.y}px`,
            "--tile-size": `${(BOARD_CANVAS.tileSize / BOARD_CANVAS.width) * 100}%`,
            aspectRatio: `${BOARD_CANVAS.width} / ${BOARD_CANVAS.height}`,
          } as CSSProperties
        }
      >
        <div className="ocean-glow" aria-hidden="true" />

        {game.board.tiles.map((tile, index) => {
          const point = getTilePoint(tile);
          const layer = Math.round(point.y);
          const tileInspection = tileInspections[index];
          if (!tileInspection) {
            return null;
          }
          return (
            <div
              aria-label={tileInspection.accessibleLabel}
              className={getInspectableClassName(
                "tile-position",
                tileInspection.id === inspectedItemId,
              )}
              data-board-inspection-id={tileInspection.id}
              data-board-inspectable="tile"
              key={tile.id}
              onFocus={() => focusBoardItem(tileInspection.id)}
              onKeyDown={(event) => navigateBoardItems(event, tileInspection.id)}
              onPointerDown={() => inspectBoardItem(tileInspection.id)}
              onPointerEnter={() => inspectBoardItem(tileInspection.id)}
              role="img"
              style={
                {
                  ...getPointStyle(point),
                  "--tile-layer": layer,
                  pointerEvents: "auto",
                } as CSSProperties
              }
              tabIndex={tileInspection.id === keyboardInspectionId ? 0 : -1}
            >
              <img
                alt=""
                className="terrain-tile"
                draggable={false}
                height={TERRAIN_ASSET.size}
                src={`/game-assets/terrain/${tile.terrain}.png`}
                width={TERRAIN_ASSET.size}
              />
              {tile.numberToken === null ? null : (
                <NumberToken number={tile.numberToken} terrain={tile.terrain} />
              )}
            </div>
          );
        })}

        <svg
          aria-hidden="true"
          className="port-docks"
          viewBox={`0 0 ${BOARD_CANVAS.width} ${BOARD_CANVAS.height}`}
        >
          {ports.flatMap((port) =>
            port.placement.docks.map((dock, index) => (
              <g key={`${port.id}:dock:${index}`}>
                <line
                  className="port-dock-outline"
                  x1={dock.start.x}
                  x2={dock.end.x}
                  y1={dock.start.y}
                  y2={dock.end.y}
                />
                <line
                  className="port-dock-planks"
                  x1={dock.start.x}
                  x2={dock.end.x}
                  y1={dock.start.y}
                  y2={dock.end.y}
                />
                <line
                  className="port-dock-seams"
                  x1={dock.start.x}
                  x2={dock.end.x}
                  y1={dock.start.y}
                  y2={dock.end.y}
                />
              </g>
            )),
          )}
        </svg>

        {ports.map((port, index) => {
          const inspection = portInspections[index];
          return inspection ? (
            <Port
              inspection={inspection}
              isInspected={inspection.id === inspectedItemId}
              isKeyboardTarget={inspection.id === keyboardInspectionId}
              key={port.id}
              onInspect={inspectBoardItem}
              onKeyboardFocus={focusBoardItem}
              onKeyboardNavigate={navigateBoardItems}
              point={port.placement}
              trade={port.trade}
            />
          ) : null;
        })}

        {game.board.roads.map((road, index) => {
          const point = getEdgePlacement(road.edgeKey);
          const inspection = roadInspections[index];
          if (!point || !inspection) {
            return null;
          }
          return (
            <Piece
              angle={point.angle}
              asset="road"
              inspection={inspection}
              isInspected={inspection.id === inspectedItemId}
              isKeyboardTarget={inspection.id === keyboardInspectionId}
              key={road.edgeKey}
              onInspect={inspectBoardItem}
              onKeyboardFocus={focusBoardItem}
              onKeyboardNavigate={navigateBoardItems}
              point={point}
              theme={playerDetailsById.get(road.playerId)?.theme ?? "red"}
            />
          );
        })}

        {game.board.buildings.map((building, index) => {
          const point = getVertexPoint(building.vertexKey);
          const inspection = buildingInspections[index];
          if (!point || !inspection) {
            return null;
          }
          return (
            <Piece
              asset={building.kind}
              inspection={inspection}
              isInspected={inspection.id === inspectedItemId}
              isKeyboardTarget={inspection.id === keyboardInspectionId}
              key={building.vertexKey}
              onInspect={inspectBoardItem}
              onKeyboardFocus={focusBoardItem}
              onKeyboardNavigate={navigateBoardItems}
              point={point}
              theme={playerDetailsById.get(building.playerId)?.theme ?? "red"}
            />
          );
        })}

        {robberInspection && robberTile ? (
          <Robber
            inspection={robberInspection}
            isInspected={robberInspection.id === inspectedItemId}
            isKeyboardTarget={robberInspection.id === keyboardInspectionId}
            onInspect={inspectBoardItem}
            onKeyboardFocus={focusBoardItem}
            onKeyboardNavigate={navigateBoardItems}
            tile={robberTile}
          />
        ) : null}

        {targetMode === "settlement"
          ? game.legalActions.settlementVertexKeys.map((vertexKey, index) => {
              const point = getVertexPoint(vertexKey);
              return point ? (
                <BuildTarget
                  asset="settlement"
                  compactPlacement={compactPlacement}
                  disabled={pending}
                  key={vertexKey}
                  label={`Place settlement at legal location ${index + 1}`}
                  marker={index + 1}
                  onClick={() =>
                    onCommand({ kind: "place_settlement", vertexKey }, "Settlement placed.")
                  }
                  point={point}
                  theme={viewerTheme}
                  type="vertex"
                />
              ) : null;
            })
          : null}

        {targetMode === "city"
          ? game.legalActions.cityVertexKeys.map((vertexKey, index) => {
              const point = getVertexPoint(vertexKey);
              return point ? (
                <BuildTarget
                  asset="city"
                  compactPlacement={compactPlacement}
                  disabled={pending}
                  key={vertexKey}
                  label={`Upgrade city at legal location ${index + 1}`}
                  marker={index + 1}
                  onClick={() => onCommand({ kind: "build_city", vertexKey }, "City completed.")}
                  point={point}
                  theme={viewerTheme}
                  type="vertex"
                />
              ) : null;
            })
          : null}

        {targetMode === "road"
          ? game.legalActions.roadEdgeKeys.map((edgeKey, index) => {
              const point = getEdgePlacement(edgeKey);
              return point ? (
                <BuildTarget
                  angle={point.angle}
                  asset="road"
                  compactPlacement={compactPlacement}
                  disabled={pending}
                  key={edgeKey}
                  label={`Place road at legal edge ${index + 1}`}
                  marker={index + 1}
                  onClick={() => onCommand({ edgeKey, kind: "place_road" }, "Road placed.")}
                  point={point}
                  theme={viewerTheme}
                  type="edge"
                />
              ) : null;
            })
          : null}

        {targetMode === "robber"
          ? game.legalActions.robberTileIds.map((tileId, index) => {
              const tile = game.board.tiles.find((candidate) => candidate.id === tileId);
              if (!tile) {
                return null;
              }
              return (
                <BuildTarget
                  asset="robber"
                  compactPlacement={compactPlacement}
                  disabled={pending}
                  key={tileId}
                  label={`Move robber to legal tile ${index + 1}`}
                  marker={index + 1}
                  onClick={() => onCommand({ kind: "move_robber", tileId }, "Robber moved.")}
                  point={getTilePoint(tile)}
                  theme={viewerTheme}
                  type="tile"
                />
              );
            })
          : null}
      </div>
      <BoardInspector inspection={inspectedItem} />
    </section>
  );
}

function NumberToken({ number, terrain }: { number: number; terrain: string }) {
  const pips = NUMBER_TOKEN_PIPS[number] ?? 0;
  const isHot = number === 6 || number === 8;
  return (
    <span
      aria-label={`${terrain} produces on ${number}; ${pips} probability pips`}
      className={isHot ? "number-token is-hot" : "number-token"}
      role="img"
    >
      <strong>{number}</strong>
      <span aria-hidden="true">{"•".repeat(pips)}</span>
    </span>
  );
}

function Port({
  inspection,
  isInspected,
  isKeyboardTarget,
  onInspect,
  onKeyboardFocus,
  onKeyboardNavigate,
  point,
  trade,
}: InspectableBoardItemProps & {
  point: { x: number; y: number };
  trade: "any" | ResourceType;
}) {
  return (
    <span
      aria-label={inspection.accessibleLabel}
      className={getInspectableClassName("port-token", isInspected)}
      data-board-inspection-id={inspection.id}
      data-board-inspectable="port"
      onFocus={() => onKeyboardFocus(inspection.id)}
      onKeyDown={(event) => onKeyboardNavigate(event, inspection.id)}
      onPointerDown={() => onInspect(inspection.id)}
      onPointerEnter={() => onInspect(inspection.id)}
      role="img"
      style={getPointStyle(point)}
      tabIndex={isKeyboardTarget ? 0 : -1}
    >
      <img
        alt=""
        className="port-skiff"
        draggable={false}
        height={512}
        src="/game-assets/ui/port-skiff-v1.png"
        width={384}
      />
      <span aria-hidden="true" className="port-emblem">
        {trade === "any" ? "⚓" : <ResourceIcon decorative resource={trade} size={22} />}
      </span>
      <strong>{trade === "any" ? "3:1" : "2:1"}</strong>
    </span>
  );
}

function Piece({
  angle = 0,
  asset,
  inspection,
  isInspected,
  isKeyboardTarget,
  onInspect,
  onKeyboardFocus,
  onKeyboardNavigate,
  point,
  theme,
}: InspectableBoardItemProps & {
  angle?: number;
  asset: BoardPieceAsset;
  point: { x: number; y: number };
  theme: PlayerTheme;
}) {
  const rotation = asset === "road" ? angle + ROAD_ASSET_ROTATION_OFFSET : 0;
  const assetPath = getPieceAssetPath(asset);
  return (
    <span
      aria-label={inspection.accessibleLabel}
      className={getInspectableClassName(`board-piece ${asset}-piece player-${theme}`, isInspected)}
      data-board-inspection-id={inspection.id}
      data-board-inspectable="piece"
      onFocus={() => onKeyboardFocus(inspection.id)}
      onKeyDown={(event) => onKeyboardNavigate(event, inspection.id)}
      onPointerDown={() => onInspect(inspection.id)}
      onPointerEnter={() => onInspect(inspection.id)}
      role="img"
      style={{ ...getPointStyle(point), "--piece-rotation": `${rotation}deg` } as CSSProperties}
      tabIndex={isKeyboardTarget ? 0 : -1}
    >
      <img alt="" draggable={false} height={512} src={assetPath} width={512} />
      <span
        aria-hidden="true"
        className="piece-color"
        style={{ "--piece-mask": `url(${assetPath})` } as CSSProperties}
      />
    </span>
  );
}

function Robber({
  inspection,
  isInspected,
  isKeyboardTarget,
  onInspect,
  onKeyboardFocus,
  onKeyboardNavigate,
  tile,
}: InspectableBoardItemProps & { tile: PlayerGameView["board"]["tiles"][number] }) {
  return (
    <span
      aria-label={inspection.accessibleLabel}
      className={getInspectableClassName("board-piece robber-piece", isInspected)}
      data-board-inspection-id={inspection.id}
      data-board-inspectable="robber"
      onFocus={() => onKeyboardFocus(inspection.id)}
      onKeyDown={(event) => onKeyboardNavigate(event, inspection.id)}
      onPointerDown={() => onInspect(inspection.id)}
      onPointerEnter={() => onInspect(inspection.id)}
      role="img"
      style={getPointStyle(getTilePoint(tile))}
      tabIndex={isKeyboardTarget ? 0 : -1}
    >
      <img alt="" draggable={false} height={256} src="/game-assets/pieces/robber.png" width={256} />
    </span>
  );
}

function BuildTarget({
  angle = 0,
  asset,
  compactPlacement,
  disabled,
  label,
  marker,
  onClick,
  point,
  theme,
  type,
}: {
  angle?: number;
  asset: BuildPreviewAsset;
  compactPlacement: boolean;
  disabled: boolean;
  label: string;
  marker: number;
  onClick(): void;
  point: { x: number; y: number };
  theme: PlayerTheme;
  type: "edge" | "tile" | "vertex";
}) {
  const assetPath =
    asset === "robber" ? "/game-assets/pieces/robber.png" : getPieceAssetPath(asset);

  return (
    <button
      aria-hidden={compactPlacement || undefined}
      aria-label={label}
      className={`build-target target-${type} target-${asset} player-${theme}`}
      data-marker={marker}
      disabled={disabled}
      onClick={compactPlacement ? undefined : onClick}
      style={
        {
          ...getPointStyle(point),
          "--target-label-rotation": `${-angle}deg`,
          "--target-rotation": `${angle}deg`,
        } as CSSProperties
      }
      tabIndex={compactPlacement ? -1 : undefined}
      type="button"
    >
      <img
        alt=""
        aria-hidden="true"
        className="build-target-preview"
        draggable={false}
        height={asset === "robber" ? 256 : 512}
        src={assetPath}
        width={asset === "robber" ? 256 : 512}
      />
      {asset === "robber" ? null : (
        <i
          aria-hidden="true"
          className="build-target-preview-color piece-color"
          style={{ "--piece-mask": `url(${assetPath})` } as CSSProperties}
        />
      )}
      <span
        aria-hidden="true"
        className="build-target-marker"
        data-marker={marker}
        style={{ display: compactPlacement ? undefined : "none" }}
      />
    </button>
  );
}

function BoardInspector({ inspection }: { inspection: BoardInspection | null }) {
  return (
    <aside
      aria-label="Board inspector"
      className={inspection ? "board-inspector is-active" : "board-inspector is-idle"}
    >
      <span className="board-inspector-kicker">{inspection?.kicker ?? "Island guide"}</span>
      <span className="board-inspector-title-row">
        {inspection?.resource ? (
          <ResourceIcon decorative resource={inspection.resource} size={34} />
        ) : null}
        <strong className="board-inspector-title">
          {inspection?.title ?? "Inspect the board"}
        </strong>
      </span>
      {inspection ? (
        <dl className="board-inspector-details">
          {inspection.details.map((detail) => (
            <div
              className={`board-inspector-detail${detail.tone === "alert" ? " is-alert" : ""}`}
              key={detail.label}
            >
              <dt className="sr-only">{detail.label}</dt>
              <dd className="board-inspector-value">{detail.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="board-inspector-hint">
          Hover an item, or Tab into the board and use arrows to inspect.
        </p>
      )}
    </aside>
  );
}

function createTileInspection(tile: BoardTile, isBlockedByRobber: boolean): BoardInspection {
  const terrainLabel = TERRAIN_LABELS[tile.terrain];
  const resource = TERRAIN_RESOURCE[tile.terrain];
  const resourceLabel = resource ? RESOURCE_LABELS[resource] : "No resource";
  const numberLabel = tile.numberToken === null ? "No number token" : String(tile.numberToken);
  const probabilityLabel = getRollProbabilityLabel(tile.numberToken);
  const robberLabel = isBlockedByRobber
    ? resource
      ? "Production blocked"
      : "Robber is here"
    : "Not blocked";
  const productionLabel = resource
    ? `produces ${resourceLabel}${tile.numberToken === null ? "" : ` on ${tile.numberToken}`}`
    : "does not produce resources";

  return {
    accessibleLabel: `${terrainLabel} terrain tile; ${productionLabel}; ${probabilityLabel}; ${robberLabel.toLowerCase()}.`,
    details: [
      { label: "Roll chance", value: probabilityLabel },
      ...(isBlockedByRobber
        ? [{ label: "Robber", tone: "alert" as const, value: robberLabel }]
        : []),
    ],
    id: `tile:${tile.id}`,
    kicker: terrainLabel,
    resource: resource ?? undefined,
    title: resource ? `${resourceLabel} on ${numberLabel}` : "No resource production",
  };
}

function createPortInspection(id: string, trade: "any" | ResourceType): BoardInspection {
  const isAnyResource = trade === "any";
  const resourceLabel = isAnyResource ? "Any one resource" : RESOURCE_LABELS[trade];
  const rate = isAnyResource ? "3:1" : "2:1";
  const title = isAnyResource ? "Open harbor" : `${resourceLabel} harbor`;

  return {
    accessibleLabel: `${title}; trade at ${rate}; accepts ${resourceLabel.toLowerCase()}.`,
    details: [
      {
        label: "Trade rule",
        value: isAnyResource ? "Give any 3 cards, take 1" : `Give 2 ${resourceLabel}, take 1`,
      },
    ],
    id: `port:${id}`,
    kicker: "Harbor",
    resource: isAnyResource ? undefined : trade,
    title: `${rate} ${title}`,
  };
}

function createPieceInspection(
  id: string,
  asset: BoardPieceAsset,
  ownerName: string,
  theme: PlayerTheme,
): BoardInspection {
  const pieceLabel = PIECE_LABELS[asset];
  return {
    accessibleLabel: `${ownerName}'s ${theme} ${asset}.`,
    details: [{ label: "Owner", value: `Owned by ${ownerName}` }],
    id,
    kicker: ownerName,
    title: pieceLabel,
  };
}

function createRobberInspection(tile: BoardTile): BoardInspection {
  const terrainLabel = TERRAIN_LABELS[tile.terrain];
  const resource = TERRAIN_RESOURCE[tile.terrain];
  const blockedResource = resource ? RESOURCE_LABELS[resource] : "No resource";
  const effectLabel = resource ? `Blocks ${blockedResource}` : "No production here";
  const accessibleEffect = resource
    ? `blocks ${blockedResource.toLowerCase()} production`
    : "occupies a non-producing tile";

  return {
    accessibleLabel: `Robber on the ${terrainLabel.toLowerCase()} tile; ${accessibleEffect}.`,
    details: [{ label: "Effect", tone: "alert", value: effectLabel }],
    id: "robber",
    kicker: `${terrainLabel} tile`,
    title: "Robber",
  };
}

function getRollProbabilityLabel(numberToken: number | null): string {
  if (numberToken === null) {
    return "No production roll";
  }

  const combinations = NUMBER_TOKEN_PIPS[numberToken] ?? 0;
  const percentage = ((combinations / 36) * 100).toFixed(1);
  return `${percentage}% roll chance`;
}

function getInspectableClassName(baseClassName: string, isInspected: boolean): string {
  return `${baseClassName} board-inspectable${isInspected ? " is-inspected" : ""}`;
}

function getInspectionNavigationDirection(key: string): "first" | "last" | -1 | 1 | null {
  if (key === "Home") {
    return "first";
  }
  if (key === "End") {
    return "last";
  }
  if (key === "ArrowLeft" || key === "ArrowUp") {
    return -1;
  }
  if (key === "ArrowRight" || key === "ArrowDown") {
    return 1;
  }
  return null;
}

function getKeyboardPanDelta(key: string): { x: number; y: number } | null {
  switch (key) {
    case "ArrowDown":
      return { x: 0, y: KEYBOARD_PAN_STEP };
    case "ArrowLeft":
      return { x: -KEYBOARD_PAN_STEP, y: 0 };
    case "ArrowRight":
      return { x: KEYBOARD_PAN_STEP, y: 0 };
    case "ArrowUp":
      return { x: 0, y: -KEYBOARD_PAN_STEP };
    default:
      return null;
  }
}

function useCompactPlacementLayout(): boolean {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-height: 560px) and (orientation: landscape)");
    const update = () => setIsCompact(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return isCompact;
}

export function getTargetMode(game: PlayerGameView, buildMode: BuildMode) {
  if (!game.legalActions.isRequiredActor) {
    return null;
  }
  if (game.phase.kind === "setup_settlement") {
    return "settlement";
  }
  if (game.phase.kind === "setup_road") {
    return "road";
  }
  if (game.phase.kind === "move_robber") {
    return "robber";
  }
  return buildMode;
}

export function getPlayerTheme(player: PlayerViewState) {
  return PLAYER_THEMES[player.seatIndex % PLAYER_THEMES.length] ?? "red";
}
