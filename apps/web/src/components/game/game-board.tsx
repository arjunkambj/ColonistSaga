import {
  NUMBER_TOKEN_PIPS,
  PLAYER_COLORS,
  TERRAIN_RESOURCE,
  getLongestRoadLength,
  type GameCommand,
  type PlayerGameView,
  type PlayerViewState,
  type ResourceType,
  type TerrainType,
} from "@colonistsaga/game";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";

import {
  BOARD_CANVAS,
  createBoardLayout,
  getEdgePlacement,
  getPointStyle,
  getPortPlacement,
  getTilePoint,
} from "@/lib/game/board-layout";
import { BOARD_VIEWPORT_SCALE } from "@/lib/game/board-viewport";
import {
  createBoardCanvasTargetModels,
  findNearestBoardTarget,
  mapClientPointToBoard,
  resolveBoardTargetMode,
  type BoardBuildMode,
  type BoardCanvasTargetModel,
} from "@/lib/game/board-canvas-model";
import { liquidGlassClassName } from "@/components/ui/liquid-glass";
import { BoardCanvas, type BoardCanvasTarget } from "./board-canvas";
import { HandDockPortal } from "./hand-dock";
import { RESOURCE_LABELS, ResourceIcon } from "./resource-icon";
import { useBoardCamera } from "./use-board-camera";

export type BuildMode = BoardBuildMode;

const TERRAIN_LABELS: Readonly<Record<TerrainType, string>> = {
  desert: "Desert",
  fields: "Fields",
  forest: "Forest",
  hills: "Hills",
  mountains: "Mountains",
  pasture: "Pasture",
};
const KEYBOARD_PAN_STEP = 48;

type BoardTile = PlayerGameView["board"]["tiles"][number];

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
  layout?: "compact";
  resource?: ResourceType;
  title: string;
}

interface InspectableBoardItemProps {
  inspection: BoardInspection;
  isInspected: boolean;
  isKeyboardTarget: boolean;
  onInspect(id: string | null): void;
  onKeyboardFocus(id: string): void;
  onKeyboardNavigate(event: ReactKeyboardEvent<HTMLElement>, id: string): void;
}

export function GameBoard({
  buildMode,
  game,
  onCancelBuildMode,
  onCommand,
  onPlacementExit,
  pending,
}: {
  buildMode: BuildMode;
  game: PlayerGameView;
  onCancelBuildMode?(): void;
  onCommand(command: GameCommand, successMessage: string): void;
  onPlacementExit?(mode: Exclude<ReturnType<typeof resolveBoardTargetMode>, null>): void;
  pending: boolean;
}) {
  const playerDetailsById = useMemo(
    () =>
      new Map(
        game.players.map((player) => [
          player.id,
          { displayName: player.displayName, theme: getPlayerTheme(player) },
        ]),
      ),
    [game.players],
  );
  const playerThemes = useMemo(
    () => new Map(game.players.map((player) => [player.id, getPlayerTheme(player)])),
    [game.players],
  );
  const longestRoadLengthByPlayerId = useMemo(() => {
    const roadOwnerIds = new Set(game.board.roads.map((road) => road.playerId));
    return new Map(
      [...roadOwnerIds].map((playerId) => [playerId, getLongestRoadLength(game.board, playerId)]),
    );
  }, [game.board]);
  const boardLayout = useMemo(() => createBoardLayout(game.board.tiles), [game.board.tiles]);
  const viewerTheme = playerDetailsById.get(game.viewerPlayerId)?.theme ?? "red";
  const ports = useMemo(
    () =>
      game.board.ports.flatMap((port) => {
        const placement = getPortPlacement(boardLayout, port.edgeKey);
        return placement ? [{ ...port, placement }] : [];
      }),
    [boardLayout, game.board.ports],
  );
  const tileInspections = useMemo(
    () =>
      game.board.tiles.map((tile) =>
        createTileInspection(tile, tile.id === game.board.robberTileId),
      ),
    [game.board.robberTileId, game.board.tiles],
  );
  const portInspections = useMemo(
    () =>
      ports.map((port) =>
        createPortInspection(port.id, port.trade, port.edgeKey, game, boardLayout),
      ),
    [boardLayout, game, ports],
  );
  const roadInspections = useMemo(
    () =>
      game.board.roads.map((road) => {
        const owner = playerDetailsById.get(road.playerId);
        return createRoadInspection(
          `road:${road.edgeKey}`,
          owner?.displayName ?? "Unknown player",
          longestRoadLengthByPlayerId.get(road.playerId) ?? 0,
        );
      }),
    [game.board.roads, longestRoadLengthByPlayerId, playerDetailsById],
  );
  const tilesById = useMemo(
    () => new Map(game.board.tiles.map((tile) => [tile.id, tile])),
    [game.board.tiles],
  );
  const robberTile = tilesById.get(game.board.robberTileId) ?? null;
  const robberInspection = useMemo(
    () => (robberTile ? createRobberInspection(robberTile) : null),
    [robberTile],
  );
  const inspectionById = useMemo(
    () =>
      new Map(
        [
          ...tileInspections,
          ...portInspections,
          ...roadInspections,
          ...(robberInspection ? [robberInspection] : []),
        ].map((inspection) => [inspection.id, inspection]),
      ),
    [portInspections, roadInspections, robberInspection, tileInspections],
  );
  const inspectionOrder = useMemo(() => [...inspectionById.keys()], [inspectionById]);
  const firstInspectionId = inspectionOrder[0] ?? null;
  const targetMode = resolveBoardTargetMode(game, buildMode);
  const boardTargets = useMemo(
    () =>
      createBoardCanvasTargetModels({
        buildMode,
        game,
        layout: boardLayout,
        viewerTheme,
      }),
    [boardLayout, buildMode, game, viewerTheme],
  );
  const firstBoardTargetId = boardTargets[0]?.id ?? null;
  const [focusedTargetId, setFocusedTargetId] = useState<string | null>(null);
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);
  const [keyboardTargetId, setKeyboardTargetId] = useState<string | null>(null);
  const activeTargetId = hoveredTargetId ?? focusedTargetId;
  const effectiveKeyboardTargetId = boardTargets.some((target) => target.id === keyboardTargetId)
    ? keyboardTargetId
    : firstBoardTargetId;
  const canvasTargets = useMemo<readonly BoardCanvasTarget[]>(
    () =>
      boardTargets.map((target) => ({
        ...target,
        disabled: pending,
        highlighted: target.id === activeTargetId,
      })),
    [activeTargetId, boardTargets, pending],
  );
  const {
    boardSceneRef,
    boardShellRef,
    boardStageRef,
    boardViewport,
    cancelPointerGesture,
    changeZoomBy,
    handleClickCapture,
    handleLostPointerCapture,
    isInteracting,
    movePointerGesture,
    panBoardBy,
    resetBoardViewport,
    startPointerGesture,
    stopPointerGesture,
  } = useBoardCamera();
  const findPointerTarget = (clientX: number, clientY: number) => {
    const bounds = boardSceneRef.current?.getBoundingClientRect();
    if (!bounds) {
      return null;
    }

    const boardPoint = mapClientPointToBoard({ x: clientX, y: clientY }, bounds, BOARD_CANVAS);
    return boardPoint ? findNearestBoardTarget(boardTargets, boardPoint) : null;
  };
  const previousTargetModeRef = useRef<typeof targetMode>(null);
  const [inspectedItemId, setInspectedItemId] = useState<string | null>(null);
  const [keyboardInspectionId, setKeyboardInspectionId] = useState<string | null>(
    firstInspectionId,
  );
  const inspectedItem = inspectedItemId ? (inspectionById.get(inspectedItemId) ?? null) : null;
  const keyboardInspectionExists = keyboardInspectionId
    ? inspectionById.has(keyboardInspectionId)
    : false;

  useEffect(() => {
    if (!keyboardInspectionExists) {
      setKeyboardInspectionId(firstInspectionId);
    }
  }, [firstInspectionId, keyboardInspectionExists]);

  useEffect(() => {
    const previousTargetMode = previousTargetModeRef.current;
    previousTargetModeRef.current = targetMode;

    if (previousTargetMode !== null && targetMode === null) {
      onPlacementExit?.(previousTargetMode);
      return;
    }

    if (targetMode === null || previousTargetMode === targetMode || firstBoardTargetId === null) {
      return;
    }

    setKeyboardTargetId(firstBoardTargetId);
    const firstTarget = [
      ...(boardShellRef.current?.querySelectorAll<HTMLElement>("[data-board-target-id]") ?? []),
    ].find((element) => element.dataset.boardTargetId === firstBoardTargetId);
    firstTarget?.focus();
  }, [boardShellRef, firstBoardTargetId, onPlacementExit, targetMode]);

  const inspectBoardItem = (id: string | null) => {
    if (id !== null && isInteracting()) {
      return;
    }
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

  const navigateBuildTargets = (event: ReactKeyboardEvent<HTMLButtonElement>, id: string) => {
    const direction = getInspectionNavigationDirection(event.key);
    if (direction === null || boardTargets.length === 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const currentIndex = Math.max(
      0,
      boardTargets.findIndex((target) => target.id === id),
    );
    const nextIndex =
      direction === "first"
        ? 0
        : direction === "last"
          ? boardTargets.length - 1
          : (currentIndex + direction + boardTargets.length) % boardTargets.length;
    const nextTarget = boardTargets[nextIndex];
    if (!nextTarget) {
      return;
    }

    setKeyboardTargetId(nextTarget.id);
    const nextElement = [
      ...(boardShellRef.current?.querySelectorAll<HTMLElement>("[data-board-target-id]") ?? []),
    ].find((element) => element.dataset.boardTargetId === nextTarget.id);
    nextElement?.focus();
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
      resetBoardViewport();
      return;
    }

    if (event.key === "Escape" && buildMode !== null && onCancelBuildMode) {
      event.preventDefault();
      onCancelBuildMode();
    }
  };

  return (
    <section
      aria-label="Game board. Hover a board item for visual details, or Tab into the board items and use arrow keys to inspect them. When the board itself is focused, drag or use arrow keys to pan, use the mouse wheel or plus and minus keys to zoom, and press zero to reset."
      className={`board-shell${targetMode ? " is-placing" : ""}`}
      onClickCapture={handleClickCapture}
      onKeyDown={handleKeyDown}
      onLostPointerCapture={handleLostPointerCapture}
      onPointerCancel={cancelPointerGesture}
      onPointerDown={startPointerGesture}
      onPointerMove={movePointerGesture}
      onPointerUp={stopPointerGesture}
      ref={boardShellRef}
      tabIndex={0}
    >
      {targetMode && boardTargets.length > 0 ? (
        <p aria-live="polite" className="sr-only" role="status">
          {getTargetModeLabel(targetMode)}. {boardTargets.length} legal
          {boardTargets.length === 1 ? " location" : " locations"}.
          {buildMode !== null && onCancelBuildMode ? " Press Escape to cancel." : null}
        </p>
      ) : null}
      <div
        className="board-stage"
        ref={boardStageRef}
        style={{ aspectRatio: `${BOARD_CANVAS.width} / ${BOARD_CANVAS.height}` }}
      >
        <div
          className="game-board"
          ref={boardSceneRef}
          style={
            {
              "--tile-size": `${(boardLayout.tileSize / BOARD_CANVAS.width) * 100}%`,
            } as CSSProperties
          }
        >
          <BoardCanvas
            board={game.board}
            boardLayout={boardLayout}
            playerThemes={playerThemes}
            renderScale={boardViewport.scale}
            targets={canvasTargets}
          />

          {game.board.tiles.map((tile, index) => {
            const inspection = tileInspections[index];
            if (!inspection) {
              return null;
            }
            return (
              <BoardHitTarget
                className="tile-hit-target"
                inspection={inspection}
                isInspected={inspection.id === inspectedItemId}
                isKeyboardTarget={inspection.id === keyboardInspectionId}
                key={tile.id}
                kind="tile"
                onInspect={inspectBoardItem}
                onKeyboardFocus={focusBoardItem}
                onKeyboardNavigate={navigateBoardItems}
                point={getTilePoint(boardLayout, tile)}
              />
            );
          })}

          {ports.map((port, index) => {
            const inspection = portInspections[index];
            return inspection ? (
              <BoardHitTarget
                className="port-hit-target"
                inspection={inspection}
                isInspected={inspection.id === inspectedItemId}
                isKeyboardTarget={inspection.id === keyboardInspectionId}
                key={port.id}
                kind="port"
                onInspect={inspectBoardItem}
                onKeyboardFocus={focusBoardItem}
                onKeyboardNavigate={navigateBoardItems}
                point={port.placement}
              />
            ) : null;
          })}

          {game.board.roads.map((road, index) => {
            const point = getEdgePlacement(boardLayout, road.edgeKey);
            const inspection = roadInspections[index];
            return point && inspection ? (
              <BoardHitTarget
                angle={point.angle}
                className="piece-hit-target-road"
                inspection={inspection}
                isInspected={inspection.id === inspectedItemId}
                isKeyboardTarget={inspection.id === keyboardInspectionId}
                key={road.edgeKey}
                kind="piece"
                onInspect={inspectBoardItem}
                onKeyboardFocus={focusBoardItem}
                onKeyboardNavigate={navigateBoardItems}
                point={point}
              />
            ) : null;
          })}

          {robberInspection && robberTile ? (
            <BoardHitTarget
              className="robber-hit-target"
              inspection={robberInspection}
              isInspected={robberInspection.id === inspectedItemId}
              isKeyboardTarget={robberInspection.id === keyboardInspectionId}
              kind="robber"
              onInspect={inspectBoardItem}
              onKeyboardFocus={focusBoardItem}
              onKeyboardNavigate={navigateBoardItems}
              point={getTilePoint(boardLayout, robberTile)}
            />
          ) : null}

          {boardTargets.map((target) => (
            <BuildTarget
              disabled={pending}
              isKeyboardTarget={target.id === effectiveKeyboardTargetId}
              key={target.id}
              onClick={(event) => {
                const selectedTarget =
                  event.detail === 0
                    ? target
                    : (findPointerTarget(event.clientX, event.clientY) ?? target);
                onCommand(selectedTarget.command, selectedTarget.successMessage);
              }}
              onFocus={(id) => {
                setFocusedTargetId(id);
                if (id) {
                  setKeyboardTargetId(id);
                }
              }}
              onHover={setHoveredTargetId}
              onKeyboardNavigate={navigateBuildTargets}
              onPointerMove={(clientX, clientY) => {
                setHoveredTargetId(findPointerTarget(clientX, clientY)?.id ?? null);
              }}
              target={target}
            />
          ))}
        </div>
      </div>
      <HandDockPortal>
        <BoardInspector inspection={inspectedItem} />
      </HandDockPortal>
    </section>
  );
}

function BoardHitTarget({
  angle = 0,
  className,
  inspection,
  isInspected,
  isKeyboardTarget,
  kind,
  onInspect,
  onKeyboardFocus,
  onKeyboardNavigate,
  point,
}: InspectableBoardItemProps & {
  angle?: number;
  className: string;
  kind: "piece" | "port" | "robber" | "tile";
  point: { x: number; y: number };
}) {
  return (
    <span
      aria-label={inspection.accessibleLabel}
      className={getInspectableClassName(`board-hit-target ${className}`, isInspected)}
      data-board-inspection-id={inspection.id}
      data-board-inspectable={kind}
      onBlur={() => onInspect(null)}
      onFocus={() => onKeyboardFocus(inspection.id)}
      onKeyDown={(event) => onKeyboardNavigate(event, inspection.id)}
      onPointerDown={() => onInspect(inspection.id)}
      onPointerEnter={() => onInspect(inspection.id)}
      onPointerLeave={(event) => {
        if (document.activeElement !== event.currentTarget) {
          onInspect(null);
        }
      }}
      role="img"
      style={{ ...getPointStyle(point), "--hit-rotation": `${angle}deg` } as CSSProperties}
      tabIndex={isKeyboardTarget ? 0 : -1}
    />
  );
}

function BuildTarget({
  disabled,
  isKeyboardTarget,
  onClick,
  onFocus,
  onHover,
  onKeyboardNavigate,
  onPointerMove,
  target,
}: {
  disabled: boolean;
  isKeyboardTarget: boolean;
  onClick(event: ReactMouseEvent<HTMLButtonElement>): void;
  onFocus(id: string | null): void;
  onHover(id: string | null): void;
  onKeyboardNavigate(event: ReactKeyboardEvent<HTMLButtonElement>, id: string): void;
  onPointerMove(clientX: number, clientY: number): void;
  target: BoardCanvasTargetModel;
}) {
  return (
    <button
      aria-label={target.label}
      className={`build-target target-${target.type} target-${target.asset} player-${target.theme}`}
      data-board-target-id={target.id}
      disabled={disabled}
      onBlur={() => onFocus(null)}
      onClick={onClick}
      onFocus={() => onFocus(target.id)}
      onKeyDown={(event) => onKeyboardNavigate(event, target.id)}
      onPointerEnter={(event) => onPointerMove(event.clientX, event.clientY)}
      onPointerLeave={() => onHover(null)}
      onPointerMove={(event) => onPointerMove(event.clientX, event.clientY)}
      style={
        {
          ...getPointStyle(target.point),
          "--target-rotation": `${target.angle}deg`,
        } as CSSProperties
      }
      tabIndex={isKeyboardTarget ? 0 : -1}
      type="button"
    />
  );
}

function BoardInspector({ inspection }: { inspection: BoardInspection | null }) {
  if (!inspection) {
    return null;
  }

  return (
    <aside
      aria-label="Board inspector"
      className={liquidGlassClassName({
        className: `game-purple-glass board-inspector${inspection.layout === "compact" ? " is-compact" : ""}`,
        kind: "panel",
        radius: "md",
      })}
    >
      <span className="board-inspector-kicker">{inspection.kicker}</span>
      <span className="board-inspector-title-row">
        {inspection.resource ? (
          <ResourceIcon decorative resource={inspection.resource} size={34} />
        ) : null}
        <strong className="board-inspector-title">{inspection.title}</strong>
      </span>
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

function createPortInspection(
  id: string,
  trade: "any" | ResourceType,
  edgeKey: string,
  game: PlayerGameView,
  layout: ReturnType<typeof createBoardLayout>,
): BoardInspection {
  const isAnyResource = trade === "any";
  const resourceLabel = isAnyResource ? "Any one resource" : RESOURCE_LABELS[trade];
  const rate = isAnyResource ? "3:1" : "2:1";
  const title = isAnyResource ? "Open harbor" : `${resourceLabel} harbor`;
  const endpointKeys = new Set(layout.topology.edgeVertices[edgeKey] ?? []);
  const ownerIds = [
    ...new Set(
      game.board.buildings
        .filter((building) => endpointKeys.has(building.vertexKey))
        .map((building) => building.playerId),
    ),
  ];
  const ownerNames = ownerIds.map(
    (ownerId) =>
      game.players.find((player) => player.id === ownerId)?.displayName ?? "Unknown player",
  );
  const access = ownerIds.includes(game.viewerPlayerId)
    ? "Available to you"
    : ownerNames.length > 0
      ? `Used by ${ownerNames.join(" and ")}`
      : "Build on either dock corner to unlock";

  return {
    accessibleLabel: `${title}; trade at ${rate}; accepts ${resourceLabel.toLowerCase()}; ${access.toLowerCase()}.`,
    details: [
      {
        label: "Trade rule",
        value: isAnyResource ? "Give any 3 cards, take 1" : `Give 2 ${resourceLabel}, take 1`,
      },
      { label: "Harbor access", value: access },
    ],
    id: `port:${id}`,
    kicker: "Harbor",
    resource: isAnyResource ? undefined : trade,
    title: `${rate} ${title}`,
  };
}

function createRoadInspection(
  id: string,
  ownerName: string,
  longestRoadLength: number,
): BoardInspection {
  return {
    accessibleLabel: `${ownerName}'s road; longest road is ${longestRoadLength} segments.`,
    details: [
      { label: "Owner", value: ownerName },
      { label: "Longest road", value: `Longest: ${longestRoadLength}` },
    ],
    id,
    kicker: ownerName,
    layout: "compact",
    title: "Road",
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

function getTargetModeLabel(
  mode: Exclude<ReturnType<typeof resolveBoardTargetMode>, null>,
): string {
  switch (mode) {
    case "city":
      return "Choose a settlement to upgrade";
    case "road":
      return "Choose an edge for your road";
    case "robber":
      return "Choose a tile for the robber";
    case "settlement":
      return "Choose a corner for your settlement";
  }
}

export function getPlayerTheme(player: PlayerViewState) {
  return PLAYER_COLORS[player.seatIndex % PLAYER_COLORS.length] ?? "red";
}
