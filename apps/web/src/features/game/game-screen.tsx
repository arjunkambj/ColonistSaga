"use client";

import { api } from "@catansaga/backend/convex/_generated/api";
import {
  BUILD_COSTS,
  RESOURCE_ORDER,
  emptyInventory,
  getBankTradeRatio,
  type GameCommand,
  type PlayerGameView,
  type PrivatePlayerState,
  type ResourceInventory,
  type ResourceType,
} from "@catansaga/game";
import { useMutation } from "convex/react";
import {
  ArrowRightLeft,
  Bot,
  BrickWall,
  Castle,
  ChevronRight,
  Crown,
  Dices,
  Flag,
  Hammer,
  Home,
  LogOut,
  Route,
  ScrollText,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { GameBoard, getPlayerTheme, type BuildMode } from "./game-board";
import { RESOURCE_LABELS, ResourceIcon } from "./resource-icon";
import type { RoomEventView } from "./types";
import { getPhaseCopy } from "./view";

export function GameScreen({
  code,
  events,
  game,
  isHost,
  onLeave,
  sessionId,
}: {
  code: string;
  events: RoomEventView[];
  game: PlayerGameView;
  isHost: boolean;
  onLeave(): Promise<void>;
  sessionId: string;
}) {
  const applyCommand = useMutation(api.mvp.command);
  const replacePlayerWithBot = useMutation(api.mvp.replacePlayerWithBot);
  const [buildMode, setBuildMode] = useState<BuildMode>(null);
  const [pendingCommand, setPendingCommand] = useState<GameCommand["kind"] | null>(null);
  const [pendingReplacementId, setPendingReplacementId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [error, setError] = useState("");

  const me = game.players.find((player): player is PrivatePlayerState => player.isViewer);
  const activePlayer = game.players.find((player) => player.id === game.activePlayerId);
  const winner = game.players.find((player) => player.id === game.winnerPlayerId);

  useEffect(() => {
    setBuildMode(null);
  }, [game.actionNumber, game.phase.kind]);

  if (!me || !activePlayer) {
    return (
      <main className="centered-page notice-card" id="main-content">
        <h1>Player View Unavailable</h1>
        <p>Your private seat could not be matched to this game. Refresh to reconnect.</p>
        <button className="button button-secondary" onClick={onLeave} type="button">
          Leave Game
        </button>
      </main>
    );
  }

  const sendCommand = async (command: GameCommand, successMessage: string) => {
    if (pendingCommand) {
      return;
    }
    setPendingCommand(command.kind);
    setError("");
    setAnnouncement("");
    try {
      await applyCommand({
        clientActionId: globalThis.crypto.randomUUID(),
        code,
        command,
        expectedActionNumber: game.actionNumber,
        sessionId,
      });
      setAnnouncement(successMessage);
      setBuildMode(null);
    } catch (cause) {
      setError(toGameError(cause));
    } finally {
      setPendingCommand(null);
    }
  };

  const replaceWithBot = async (playerId: string) => {
    if (pendingReplacementId) {
      return;
    }
    setPendingReplacementId(playerId);
    setError("");
    try {
      await replacePlayerWithBot({ code, sessionId, targetSeatId: playerId });
      setAnnouncement("Player control transferred to a bot.");
    } catch {
      setError("That player could not be replaced. Refresh the room and try again.");
    } finally {
      setPendingReplacementId(null);
    }
  };

  const phaseCopy = getPhaseCopy(game.phase, activePlayer.id === me.id, activePlayer.displayName);

  return (
    <main className="game-page" id="main-content">
      <header className="game-header">
        <div className="brand compact-brand" translate="no">
          <span className="brand-mark" aria-hidden="true">
            C
          </span>
          <span>
            <strong>CATAN</strong>
            <small>SAGA</small>
          </span>
        </div>
        <div className="game-room-meta">
          <span>Room {code}</span>
          <span>Turn {game.turnNumber + 1}</span>
          <span>First to {game.victoryPoints} VP</span>
        </div>
        <button className="icon-button" onClick={onLeave} type="button" aria-label="Leave game">
          <LogOut aria-hidden="true" />
        </button>
      </header>

      <PlayerStrip
        activePlayerId={game.activePlayerId}
        isHost={isHost}
        onReplacePlayer={(playerId) => void replaceWithBot(playerId)}
        pendingReplacementId={pendingReplacementId}
        players={game.players}
      />

      <section className="phase-banner" aria-labelledby="phase-title">
        <div className="phase-icon" aria-hidden="true">
          {game.phase.kind === "roll" ? <Dices /> : <Flag />}
        </div>
        <div>
          <p className="eyebrow">Turn Status</p>
          <h1 id="phase-title">{phaseCopy.title}</h1>
          <p>{phaseCopy.detail}</p>
        </div>
        <DiceResult game={game} />
      </section>

      <div className="game-workspace">
        <GameBoard
          buildMode={buildMode}
          game={game}
          onCommand={(command, message) => void sendCommand(command, message)}
          pending={pendingCommand !== null}
        />

        <aside className="game-sidebar" aria-label="Game information">
          <BankPanel />
          <EventLog events={events} />
        </aside>
      </div>

      <ResourceHand me={me} />

      <ActionDock
        buildMode={buildMode}
        game={game}
        me={me}
        onBuildMode={setBuildMode}
        onCommand={(command, message) => void sendCommand(command, message)}
        pending={pendingCommand !== null}
      />

      <div aria-atomic="true" aria-live="polite" className="game-live-region">
        {error || announcement}
      </div>
      {error ? <div className="toast toast-error">{error}</div> : null}

      {game.status === "completed" ? (
        <WinOverlay
          isDraw={game.winnerPlayerId === null}
          isViewer={winner?.id === me.id}
          onLeave={onLeave}
          winnerName={winner?.displayName}
        />
      ) : null}
    </main>
  );
}

function PlayerStrip({
  activePlayerId,
  isHost,
  onReplacePlayer,
  pendingReplacementId,
  players,
}: {
  activePlayerId: string;
  isHost: boolean;
  onReplacePlayer(playerId: string): void;
  pendingReplacementId: string | null;
  players: PlayerGameView["players"];
}) {
  return (
    <ol className="player-strip" aria-label="Players">
      {players.map((player) => {
        const theme = getPlayerTheme(player);
        return (
          <li
            className={`player-summary player-${theme} ${player.id === activePlayerId ? "is-active" : ""}`}
            key={player.id}
          >
            <span className="player-avatar" aria-hidden="true">
              {player.isBot ? <Bot /> : <UserRound />}
            </span>
            <div className="player-name">
              <strong>{player.displayName}</strong>
              <span>{player.isViewer ? "You" : player.isBot ? "Bot" : "Player"}</span>
            </div>
            <span className="player-stat" title="Victory points">
              <Crown aria-hidden="true" /> {player.victoryPoints}
            </span>
            <span className="player-stat" title="Resource cards">
              <BrickWall aria-hidden="true" /> {player.resourceCount}
            </span>
            {isHost && !player.isViewer && !player.isBot ? (
              <button
                aria-label={`Replace ${player.displayName} with a bot`}
                className="player-replace"
                disabled={pendingReplacementId !== null}
                onClick={() => onReplacePlayer(player.id)}
                type="button"
              >
                <Bot aria-hidden="true" />
                <span>{pendingReplacementId === player.id ? "Replacing…" : "Use Bot"}</span>
              </button>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function DiceResult({ game }: { game: PlayerGameView }) {
  if (!game.lastDiceRoll) {
    return (
      <div className="dice-result is-empty">
        <Dices aria-hidden="true" />
        <span>Not rolled</span>
      </div>
    );
  }
  return (
    <div className="dice-result" aria-label={`Last roll ${game.lastDiceRoll.sum}`}>
      <span>{game.lastDiceRoll.first}</span>
      <span>{game.lastDiceRoll.second}</span>
      <strong>{game.lastDiceRoll.sum}</strong>
    </div>
  );
}

function BankPanel() {
  return (
    <section className="side-card" aria-labelledby="bank-title">
      <div className="side-card-title">
        <h2 id="bank-title">Island Supply</h2>
        <ShieldCheck aria-hidden="true" />
      </div>
      <ul className="bank-grid">
        {RESOURCE_ORDER.map((resource) => (
          <li key={resource}>
            <ResourceIcon decorative resource={resource} size={30} />
            <span>{RESOURCE_LABELS[resource]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EventLog({ events }: { events: RoomEventView[] }) {
  const visibleEvents = events.slice(-30).reverse();

  return (
    <section className="side-card event-card" aria-labelledby="events-title">
      <div className="side-card-title">
        <h2 id="events-title">Game Log</h2>
        <ScrollText aria-hidden="true" />
      </div>
      <ol className="event-list" aria-live="polite">
        {visibleEvents.map((event) => (
          <li key={event.sequence}>
            <span aria-hidden="true" />
            <p>{event.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ResourceHand({ me }: { me: PrivatePlayerState }) {
  return (
    <section className="resource-hand" aria-labelledby="hand-title">
      <div className="hand-heading">
        <p className="eyebrow">Private Hand</p>
        <h2 id="hand-title">Your Resources</h2>
      </div>
      <ul>
        {RESOURCE_ORDER.map((resource) => (
          <li key={resource}>
            <ResourceIcon decorative resource={resource} size={48} />
            <span>{RESOURCE_LABELS[resource]}</span>
            <strong>{me.resources[resource]}</strong>
          </li>
        ))}
      </ul>
      <div className="piece-counts">
        <span>
          <Route aria-hidden="true" /> {me.piecesRemaining.roads}
        </span>
        <span>
          <Home aria-hidden="true" /> {me.piecesRemaining.settlements}
        </span>
        <span>
          <Castle aria-hidden="true" /> {me.piecesRemaining.cities}
        </span>
      </div>
    </section>
  );
}

function ActionDock({
  buildMode,
  game,
  me,
  onBuildMode,
  onCommand,
  pending,
}: {
  buildMode: BuildMode;
  game: PlayerGameView;
  me: PrivatePlayerState;
  onBuildMode(mode: BuildMode): void;
  onCommand(command: GameCommand, message: string): void;
  pending: boolean;
}) {
  const legal = game.legalActions;
  if (!legal.isRequiredActor) {
    return (
      <section className="action-dock is-waiting" aria-label="Turn actions">
        <span className="loading-mark small" aria-hidden="true" />
        <div>
          <strong>Watching the other players</strong>
          <span>Your controls will appear when action is required.</span>
        </div>
      </section>
    );
  }

  if (legal.discardCount !== null) {
    return (
      <DiscardPanel count={legal.discardCount} me={me} onCommand={onCommand} pending={pending} />
    );
  }

  if (game.phase.kind === "steal") {
    return (
      <section className="action-dock" aria-label="Choose a player to steal from">
        <div className="action-heading">
          <strong>Choose a Neighbor</strong>
          <span>The stolen resource is selected at random.</span>
        </div>
        <div className="action-group">
          {legal.victimPlayerIds.map((playerId) => {
            const player = game.players.find((candidate) => candidate.id === playerId);
            return (
              <button
                className="action-button"
                disabled={pending}
                key={playerId}
                onClick={() =>
                  onCommand({ kind: "steal", victimPlayerId: playerId }, "Resource stolen.")
                }
                type="button"
              >
                <UserRound aria-hidden="true" /> {player?.displayName ?? "Neighbor"}
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  if (legal.canRoll) {
    return (
      <section className="action-dock action-dock-center" aria-label="Turn actions">
        <button
          className="button button-primary dice-button"
          disabled={pending}
          onClick={() => onCommand({ kind: "roll" }, "Dice rolled.")}
          type="button"
        >
          <Dices aria-hidden="true" /> {pending ? "Rolling…" : "Roll Dice"}
        </button>
      </section>
    );
  }

  if (game.phase.kind !== "build_and_trade") {
    return (
      <section className="action-dock is-waiting" aria-label="Required action">
        <Hammer aria-hidden="true" />
        <div>
          <strong>Choose a highlighted board target</strong>
          <span>The board shows every legal option.</span>
        </div>
      </section>
    );
  }

  return (
    <section className="action-dock" aria-label="Build and trade actions">
      <div className="action-heading">
        <strong>Build & Trade</strong>
        <span>Select a piece, then choose a glowing target.</span>
      </div>
      <div className="action-group build-actions">
        <BuildAction
          active={buildMode === "road"}
          cost={BUILD_COSTS.road}
          disabled={pending || legal.roadEdgeKeys.length === 0}
          icon={<Route aria-hidden="true" />}
          label="Road"
          onClick={() => onBuildMode(buildMode === "road" ? null : "road")}
        />
        <BuildAction
          active={buildMode === "settlement"}
          cost={BUILD_COSTS.settlement}
          disabled={pending || legal.settlementVertexKeys.length === 0}
          icon={<Home aria-hidden="true" />}
          label="Settlement"
          onClick={() => onBuildMode(buildMode === "settlement" ? null : "settlement")}
        />
        <BuildAction
          active={buildMode === "city"}
          cost={BUILD_COSTS.city}
          disabled={pending || legal.cityVertexKeys.length === 0}
          icon={<Castle aria-hidden="true" />}
          label="City"
          onClick={() => onBuildMode(buildMode === "city" ? null : "city")}
        />
      </div>
      <TradePanel disabled={pending} game={game} onCommand={onCommand} options={legal.bankTrades} />
      <button
        className="button button-end-turn"
        disabled={pending || !legal.canEndTurn}
        onClick={() => onCommand({ kind: "end_turn" }, "Turn ended.")}
        type="button"
      >
        End Turn <ChevronRight aria-hidden="true" />
      </button>
    </section>
  );
}

function BuildAction({
  active,
  cost,
  disabled,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  cost: Readonly<ResourceInventory>;
  disabled: boolean;
  icon: ReactNode;
  label: string;
  onClick(): void;
}) {
  return (
    <button
      aria-pressed={active}
      className={active ? "action-button is-selected" : "action-button"}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {icon}
      <strong>{label}</strong>
      <span className="mini-cost">
        {RESOURCE_ORDER.flatMap((resource) =>
          cost[resource] > 0 ? (
            <span key={resource} title={`${cost[resource]} ${RESOURCE_LABELS[resource]}`}>
              <ResourceIcon decorative resource={resource} size={20} /> {cost[resource]}
            </span>
          ) : (
            []
          ),
        )}
      </span>
    </button>
  );
}

function TradePanel({
  disabled,
  game,
  onCommand,
  options,
}: {
  disabled: boolean;
  game: PlayerGameView;
  onCommand(command: GameCommand, message: string): void;
  options: PlayerGameView["legalActions"]["bankTrades"];
}) {
  const [give, setGive] = useState<ResourceType>("tree");
  const [receive, setReceive] = useState<ResourceType>("brick");
  const selectedTrade = options.find(
    (option) => option.give === give && option.receive === receive,
  );
  const ratio = getBankTradeRatio(game, game.viewerPlayerId, give);

  return (
    <div className="trade-control">
      <ArrowRightLeft aria-hidden="true" />
      <label>
        <span>Give {ratio}</span>
        <select
          aria-label="Resource to give"
          disabled={disabled}
          onChange={(event) => setGive(event.target.value as ResourceType)}
          value={give}
        >
          {RESOURCE_ORDER.map((resource) => (
            <option key={resource} value={resource}>
              {RESOURCE_LABELS[resource]}
            </option>
          ))}
        </select>
      </label>
      <ChevronRight aria-hidden="true" />
      <label>
        <span>Receive 1</span>
        <select
          aria-label="Resource to receive"
          disabled={disabled}
          onChange={(event) => setReceive(event.target.value as ResourceType)}
          value={receive}
        >
          {RESOURCE_ORDER.map((resource) => (
            <option key={resource} value={resource}>
              {RESOURCE_LABELS[resource]}
            </option>
          ))}
        </select>
      </label>
      <button
        className="button button-trade"
        disabled={disabled || !selectedTrade}
        onClick={() => onCommand({ give, kind: "trade_bank", receive }, "Bank trade completed.")}
        type="button"
      >
        Trade
      </button>
    </div>
  );
}

function DiscardPanel({
  count,
  me,
  onCommand,
  pending,
}: {
  count: number;
  me: PrivatePlayerState;
  onCommand(command: GameCommand, message: string): void;
  pending: boolean;
}) {
  const [selection, setSelection] = useState<ResourceInventory>(() => emptyInventory());
  const selectedCount = RESOURCE_ORDER.reduce((total, resource) => total + selection[resource], 0);

  const update = (resource: ResourceType, change: number) => {
    setSelection((current) => ({
      ...current,
      [resource]: Math.max(0, Math.min(me.resources[resource], current[resource] + change)),
    }));
  };

  return (
    <section className="action-dock discard-dock" aria-label="Discard resources">
      <div className="action-heading">
        <strong>Return {count} Resources</strong>
        <span>{selectedCount} selected</span>
      </div>
      <div className="discard-resources">
        {RESOURCE_ORDER.map((resource) => (
          <div key={resource}>
            <ResourceIcon decorative resource={resource} size={32} />
            <span>{RESOURCE_LABELS[resource]}</span>
            <button
              aria-label={`Remove one ${resource}`}
              disabled={pending || selection[resource] === 0}
              onClick={() => update(resource, -1)}
              type="button"
            >
              −
            </button>
            <strong>{selection[resource]}</strong>
            <button
              aria-label={`Add one ${resource}`}
              disabled={
                pending || selectedCount >= count || selection[resource] >= me.resources[resource]
              }
              onClick={() => update(resource, 1)}
              type="button"
            >
              +
            </button>
          </div>
        ))}
      </div>
      <button
        className="button button-primary"
        disabled={pending || selectedCount !== count}
        onClick={() => onCommand({ kind: "discard", resources: selection }, "Resources returned.")}
        type="button"
      >
        Confirm Discard
      </button>
    </section>
  );
}

function WinOverlay({
  isDraw,
  isViewer,
  onLeave,
  winnerName,
}: {
  isDraw: boolean;
  isViewer: boolean;
  onLeave(): Promise<void>;
  winnerName?: string;
}) {
  return (
    <div className="win-overlay" role="dialog" aria-modal="true" aria-labelledby="win-title">
      <div className="win-card">
        <span className="win-crown" aria-hidden="true">
          <Crown />
        </span>
        <p className="eyebrow">Game Complete</p>
        <h2 id="win-title">
          {isDraw
            ? "The Island Rests in a Draw"
            : isViewer
              ? "You Rule the Island!"
              : `${winnerName ?? "A Player"} Wins!`}
        </h2>
        <p>
          {isDraw
            ? "No player reached the victory target before the final turn."
            : isViewer
              ? "Your settlements became a thriving island realm."
              : "A new saga begins with the next game."}
        </p>
        <button className="button button-primary" onClick={onLeave} type="button">
          Return Home
        </button>
      </div>
    </div>
  );
}

function toGameError(cause: unknown): string {
  const rawMessage = cause instanceof Error ? cause.message : "The action could not be completed.";
  const normalizedMessage = rawMessage.toLowerCase();
  if (normalizedMessage.includes("action number") || normalizedMessage.includes("stale")) {
    return "The game moved ahead before this action arrived. Review the refreshed board and try again.";
  }
  if (normalizedMessage.includes("resources")) {
    return "You do not have the resources required for that action. Review your hand and try again.";
  }
  if (normalizedMessage.includes("phase") || normalizedMessage.includes("required actor")) {
    return "That action is no longer available. Review the current turn instruction and try again.";
  }
  return "The game rejected that action. Review the highlighted legal choices and try again.";
}
