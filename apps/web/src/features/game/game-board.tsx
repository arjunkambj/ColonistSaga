import {
  NUMBER_TOKEN_PIPS,
  type GameCommand,
  type PlayerGameView,
  type PlayerViewState,
  type ResourceType,
} from "@catansaga/game";
import { useEffect, useState, type CSSProperties } from "react";

import {
  BOARD_CANVAS,
  getEdgePlacement,
  getPointStyle,
  getPortPoint,
  getTilePoint,
  getVertexPoint,
} from "./board-layout";
import { ROAD_ASSET_ROTATION_OFFSET, TERRAIN_ASSET } from "./board-assets";
import { ResourceIcon } from "./resource-icon";

export type BuildMode = "city" | "road" | "settlement" | null;

const PLAYER_THEMES = ["red", "blue", "orange", "green"] as const;

export function GameBoard({
  buildMode,
  game,
  onCommand,
  pending,
}: {
  buildMode: BuildMode;
  game: PlayerGameView;
  onCommand(command: GameCommand, successMessage: string): void;
  pending: boolean;
}) {
  const playerThemeById = new Map(
    game.players.map((player) => [player.id, getPlayerTheme(player)]),
  );
  const targetMode = getTargetMode(game, buildMode);
  const compactPlacement = useCompactPlacementLayout();

  return (
    <section className="board-shell" aria-label="Game board">
      <div
        className="game-board"
        style={
          {
            "--tile-size": `${(BOARD_CANVAS.tileSize / BOARD_CANVAS.width) * 100}%`,
            aspectRatio: `${BOARD_CANVAS.width} / ${BOARD_CANVAS.height}`,
          } as CSSProperties
        }
      >
        <div className="ocean-glow" aria-hidden="true" />

        {game.board.tiles.map((tile) => {
          const point = getTilePoint(tile);
          const layer = Math.round(point.y);
          return (
            <div
              className="tile-position"
              key={tile.id}
              style={{ ...getPointStyle(point), "--tile-layer": layer } as CSSProperties}
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

        {game.board.ports.map((port) => {
          const point = getPortPoint(port.edgeKey);
          if (!point) {
            return null;
          }
          return <Port key={port.id} point={point} trade={port.trade} />;
        })}

        {game.board.roads.map((road) => {
          const point = getEdgePlacement(road.edgeKey);
          if (!point) {
            return null;
          }
          return (
            <Piece
              angle={point.angle}
              asset="road"
              key={road.edgeKey}
              point={point}
              theme={playerThemeById.get(road.playerId) ?? "red"}
            />
          );
        })}

        {game.board.buildings.map((building) => {
          const point = getVertexPoint(building.vertexKey);
          if (!point) {
            return null;
          }
          return (
            <Piece
              asset={building.kind}
              key={building.vertexKey}
              point={point}
              theme={playerThemeById.get(building.playerId) ?? "red"}
            />
          );
        })}

        <Robber game={game} />

        {targetMode === "settlement"
          ? game.legalActions.settlementVertexKeys.map((vertexKey, index) => {
              const point = getVertexPoint(vertexKey);
              return point ? (
                <BuildTarget
                  compactPlacement={compactPlacement}
                  disabled={pending}
                  key={vertexKey}
                  label={`Place settlement at legal location ${index + 1}`}
                  marker={index + 1}
                  onClick={() =>
                    onCommand({ kind: "place_settlement", vertexKey }, "Settlement placed.")
                  }
                  point={point}
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
                  compactPlacement={compactPlacement}
                  disabled={pending}
                  key={vertexKey}
                  label={`Upgrade city at legal location ${index + 1}`}
                  marker={index + 1}
                  onClick={() => onCommand({ kind: "build_city", vertexKey }, "City completed.")}
                  point={point}
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
                  compactPlacement={compactPlacement}
                  disabled={pending}
                  key={edgeKey}
                  label={`Place road at legal edge ${index + 1}`}
                  marker={index + 1}
                  onClick={() => onCommand({ edgeKey, kind: "place_road" }, "Road placed.")}
                  point={point}
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
                  compactPlacement={compactPlacement}
                  disabled={pending}
                  key={tileId}
                  label={`Move robber to legal tile ${index + 1}`}
                  marker={index + 1}
                  onClick={() => onCommand({ kind: "move_robber", tileId }, "Robber moved.")}
                  point={getTilePoint(tile)}
                  type="tile"
                />
              );
            })
          : null}
      </div>
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

function Port({ point, trade }: { point: { x: number; y: number }; trade: "any" | ResourceType }) {
  return (
    <span
      aria-label={trade === "any" ? "Three for one port" : `Two for one ${trade} port`}
      className="port-token"
      role="img"
      style={getPointStyle(point)}
    >
      {trade === "any" ? (
        <span aria-hidden="true">⚓</span>
      ) : (
        <ResourceIcon decorative resource={trade} size={24} />
      )}
      <strong>{trade === "any" ? "3:1" : "2:1"}</strong>
    </span>
  );
}

function Piece({
  angle = 0,
  asset,
  point,
  theme,
}: {
  angle?: number;
  asset: "city" | "road" | "settlement";
  point: { x: number; y: number };
  theme: (typeof PLAYER_THEMES)[number];
}) {
  const rotation = asset === "road" ? angle + ROAD_ASSET_ROTATION_OFFSET : 0;
  return (
    <span
      aria-label={`${theme} ${asset}`}
      className={`board-piece ${asset}-piece player-${theme}`}
      role="img"
      style={{ ...getPointStyle(point), "--piece-rotation": `${rotation}deg` } as CSSProperties}
    >
      <img
        alt=""
        draggable={false}
        height={256}
        src={`/game-assets/pieces/${asset}.png`}
        width={256}
      />
      <span
        aria-hidden="true"
        className="piece-color"
        style={{ "--piece-mask": `url(/game-assets/pieces/${asset}.png)` } as CSSProperties}
      />
    </span>
  );
}

function Robber({ game }: { game: PlayerGameView }) {
  const tile = game.board.tiles.find((candidate) => candidate.id === game.board.robberTileId);
  if (!tile) {
    return null;
  }

  return (
    <span className="board-piece robber-piece" style={getPointStyle(getTilePoint(tile))}>
      <img
        alt="Robber"
        draggable={false}
        height={256}
        src="/game-assets/pieces/robber.png"
        width={256}
      />
    </span>
  );
}

function BuildTarget({
  angle = 0,
  compactPlacement,
  disabled,
  label,
  marker,
  onClick,
  point,
  type,
}: {
  angle?: number;
  compactPlacement: boolean;
  disabled: boolean;
  label: string;
  marker: number;
  onClick(): void;
  point: { x: number; y: number };
  type: "edge" | "tile" | "vertex";
}) {
  return (
    <button
      aria-hidden={compactPlacement || undefined}
      aria-label={label}
      className={`build-target target-${type}`}
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
      <span aria-hidden="true" data-marker={marker} />
    </button>
  );
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
