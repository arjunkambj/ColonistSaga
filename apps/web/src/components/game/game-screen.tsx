"use client";

import { api } from "@catansaga/backend/convex/_generated/api";
import {
  BUILD_COSTS,
  RESOURCE_ORDER,
  emptyInventory,
  type GameCommand,
  type PlayerGameView,
  type PrivatePlayerState,
  type ResourceInventory,
  type ResourceType,
} from "@catansaga/game";
import { Button, Modal } from "@heroui/react";
import { useMutation } from "convex/react";
import {
  Bot,
  BrickWall,
  Castle,
  ChevronRight,
  Crown,
  Dices,
  Flag,
  Hammer,
  Home,
  Info,
  LogOut,
  Route,
  ScrollText,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type { RoomEventView } from "@/lib/game/types";
import { getPhaseCopy } from "@/lib/game/view";

import { GameBoard, getPlayerTheme, getTargetMode, type BuildMode } from "./game-board";
import { RESOURCE_LABELS, ResourceIcon } from "./resource-icon";
import { TradeCenter } from "./trade-center";

type GameConfirmation =
  | { kind: "leave" }
  | { displayName: string; kind: "replace"; playerId: string };

export function GameScreen({
  code,
  events,
  game,
  isHost,
  botThinking,
  nextActionAt,
  onLeave,
}: {
  code: string;
  events: RoomEventView[];
  game: PlayerGameView;
  isHost: boolean;
  botThinking: boolean;
  nextActionAt?: number;
  onLeave(): Promise<void>;
}) {
  const applyCommand = useMutation(api.games.applyCommand);
  const replacePlayerWithBot = useMutation(api.rooms.replacePlayerWithBot);
  const [buildMode, setBuildMode] = useState<BuildMode>(null);
  const [pendingCommand, setPendingCommand] = useState<GameCommand["kind"] | null>(null);
  const [pendingReplacementId, setPendingReplacementId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<GameConfirmation | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [showGameInfo, setShowGameInfo] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [error, setError] = useState("");

  const me = game.players.find((player): player is PrivatePlayerState => player.isViewer);
  const activePlayer = game.players.find((player) => player.id === game.activePlayerId);
  const winner = game.players.find((player) => player.id === game.winnerPlayerId);

  useEffect(() => {
    setBuildMode(null);
  }, [game.actionNumber, game.phase.kind]);

  if (!me || !activePlayer) {
    return <UnavailablePlayerView onLeave={onLeave} />;
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
      await replacePlayerWithBot({ code, targetSeatId: playerId });
      setAnnouncement("Player control transferred to a bot.");
    } catch {
      setError("That player could not be replaced. Refresh the room and try again.");
    } finally {
      setPendingReplacementId(null);
    }
  };

  const phaseCopy = getPhaseCopy(game.phase, activePlayer.id === me.id, activePlayer.displayName);

  const runConfirmedAction = async () => {
    if (!confirmation || confirming) {
      return;
    }
    setConfirming(true);
    try {
      if (confirmation.kind === "leave") {
        await onLeave();
      } else {
        await replaceWithBot(confirmation.playerId);
      }
      setConfirmation(null);
    } finally {
      setConfirming(false);
    }
  };

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
          <span translate="no">Room {code}</span>
          <span>Turn {game.turnNumber}</span>
          <span>First to {game.victoryPoints} VP</span>
        </div>
        <div className="game-header-actions">
          <Button
            aria-label="Open island supply and game log"
            className="icon-button mobile-game-info-button"
            isIconOnly
            onPress={() => setShowGameInfo(true)}
            variant="ghost"
          >
            <Info aria-hidden="true" />
          </Button>
          <Button
            aria-label="Leave game"
            className="icon-button"
            isIconOnly
            onPress={() => setConfirmation({ kind: "leave" })}
            variant="ghost"
          >
            <LogOut aria-hidden="true" />
          </Button>
        </div>
      </header>

      <PlayerStrip
        activePlayerId={game.activePlayerId}
        isHost={isHost}
        onReplacePlayer={(playerId) => {
          const player = game.players.find((candidate) => candidate.id === playerId);
          if (player) {
            setConfirmation({
              displayName: player.displayName,
              kind: "replace",
              playerId,
            });
          }
        }}
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
        <div className="phase-status-tools">
          <TurnClock botThinking={botThinking} nextActionAt={nextActionAt} />
          <DiceResult game={game} />
        </div>
      </section>

      <div className="game-workspace">
        <GameBoard
          buildMode={buildMode}
          game={game}
          onCommand={(command, message) => void sendCommand(command, message)}
          pending={pendingCommand !== null}
        />

        <aside className="game-sidebar" aria-label="Game information">
          <BankPanel bank={game.bank} />
          <EventLog events={events} />
        </aside>
      </div>

      <footer className="game-footer">
        <ResourceHand me={me} />

        <ActionDock
          buildMode={buildMode}
          game={game}
          me={me}
          onBuildMode={setBuildMode}
          onCommand={(command, message) => void sendCommand(command, message)}
          pending={pendingCommand !== null}
        />
        <CompactBoardTargets
          buildMode={buildMode}
          game={game}
          onCommand={(command, message) => void sendCommand(command, message)}
          pending={pendingCommand !== null}
        />
      </footer>

      {showGameInfo ? (
        <MobileGameInfo bank={game.bank} events={events} onClose={() => setShowGameInfo(false)} />
      ) : null}

      {confirmation ? (
        <ConfirmationDialog
          busy={confirming || pendingReplacementId !== null}
          confirmLabel={confirmation.kind === "leave" ? "Leave Game" : "Use Bot"}
          description={
            confirmation.kind === "leave"
              ? "You cannot reclaim this seat after leaving. A bot will take over, or the game will close if no human players remain."
              : `${confirmation.displayName} will immediately lose control of this seat, and a bot will finish the game for them.`
          }
          onCancel={() => setConfirmation(null)}
          onConfirm={() => void runConfirmedAction()}
          title={confirmation.kind === "leave" ? "Leave this game?" : "Replace this player?"}
        />
      ) : null}

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
            <span aria-label={`${player.victoryPoints} victory points`} className="player-stat">
              <Crown aria-hidden="true" /> {player.victoryPoints}
            </span>
            <span aria-label={`${player.resourceCount} resource cards`} className="player-stat">
              <BrickWall aria-hidden="true" /> {player.resourceCount}
            </span>
            {isHost && !player.isViewer && !player.isBot ? (
              <Button
                aria-label={`Replace ${player.displayName} with a bot`}
                className="player-replace"
                isDisabled={pendingReplacementId !== null}
                onPress={() => onReplacePlayer(player.id)}
                variant="secondary"
              >
                <Bot aria-hidden="true" />
                <span>{pendingReplacementId === player.id ? "Replacing…" : "Use Bot"}</span>
              </Button>
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

function BankPanel({ bank, idPrefix = "" }: { bank: ResourceInventory | null; idPrefix?: string }) {
  const titleId = `${idPrefix}bank-title`;
  return (
    <section className="side-card" aria-labelledby={titleId}>
      <div className="side-card-title">
        <h2 id={titleId}>Island Supply</h2>
        <ShieldCheck aria-hidden="true" />
      </div>
      <ul className="bank-grid">
        {RESOURCE_ORDER.map((resource) => (
          <li key={resource}>
            <ResourceIcon decorative resource={resource} size={30} />
            <span>{RESOURCE_LABELS[resource]}</span>
            <strong>{bank ? bank[resource] : "?"}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EventLog({ events, idPrefix = "" }: { events: RoomEventView[]; idPrefix?: string }) {
  const visibleEvents = events.slice(-30).reverse();
  const titleId = `${idPrefix}events-title`;

  return (
    <section className="side-card event-card" aria-labelledby={titleId}>
      <div className="side-card-title">
        <h2 id={titleId}>Game Log</h2>
        <ScrollText aria-hidden="true" />
      </div>
      <ol className="event-list" aria-live="polite">
        {visibleEvents.length > 0 ? (
          visibleEvents.map((event) => (
            <li key={event.sequence}>
              <span aria-hidden="true" />
              <p>{event.text}</p>
            </li>
          ))
        ) : (
          <li>
            <span aria-hidden="true" />
            <p>No moves yet.</p>
          </li>
        )}
      </ol>
    </section>
  );
}

function MobileGameInfo({
  bank,
  events,
  onClose,
}: {
  bank: ResourceInventory | null;
  events: RoomEventView[];
  onClose(): void;
}) {
  return (
    <Modal>
      <Modal.Backdrop isOpen onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}>
        <Modal.Container>
          <Modal.Dialog aria-label="Game information" className="mobile-game-info-dialog">
            <Modal.Header className="mobile-game-info-header">
              <div>
                <p className="eyebrow">Live Table</p>
                <Modal.Heading>Game Information</Modal.Heading>
              </div>
              <Button
                aria-label="Close game information"
                isIconOnly
                onPress={onClose}
                variant="ghost"
              >
                ×
              </Button>
            </Modal.Header>
            <Modal.Body className="mobile-game-info-body">
              <BankPanel bank={bank} idPrefix="mobile-" />
              <EventLog events={events} idPrefix="mobile-" />
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function ResourceHand({ me }: { me: PrivatePlayerState }) {
  return (
    <section aria-label="Your resources" className="resource-hand">
      <div className="hand-heading">
        <p className="eyebrow">Private Hand</p>
        <h2>Your Resources</h2>
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
        <span aria-label={`${me.piecesRemaining.roads} roads remaining`}>
          <Route aria-hidden="true" /> {me.piecesRemaining.roads}
        </span>
        <span aria-label={`${me.piecesRemaining.settlements} settlements remaining`}>
          <Home aria-hidden="true" /> {me.piecesRemaining.settlements}
        </span>
        <span aria-label={`${me.piecesRemaining.cities} cities remaining`}>
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
              <Button
                className="action-button"
                isDisabled={pending}
                key={playerId}
                onPress={() =>
                  onCommand({ kind: "steal", victimPlayerId: playerId }, "Resource stolen.")
                }
                variant="secondary"
              >
                <UserRound aria-hidden="true" /> {player?.displayName ?? "Neighbor"}
              </Button>
            );
          })}
        </div>
      </section>
    );
  }

  if (legal.canRoll) {
    return (
      <section className="action-dock action-dock-center" aria-label="Turn actions">
        <Button
          className="button button-primary dice-button"
          isDisabled={pending}
          isPending={pending}
          onPress={() => onCommand({ kind: "roll" }, "Dice rolled.")}
        >
          <Dices aria-hidden="true" /> {pending ? "Rolling…" : "Roll Dice"}
        </Button>
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
      <TradeCenter disabled={pending} game={game} me={me} onCommand={onCommand} />
      <Button
        className="button button-end-turn"
        isDisabled={pending || !legal.canEndTurn}
        onPress={() => onCommand({ kind: "end_turn" }, "Turn ended.")}
        variant="secondary"
      >
        End Turn <ChevronRight aria-hidden="true" />
      </Button>
    </section>
  );
}

function CompactBoardTargets({
  buildMode = null,
  game,
  onCommand,
  pending,
}: {
  buildMode?: BuildMode;
  game: PlayerGameView;
  onCommand(command: GameCommand, message: string): void;
  pending: boolean;
}) {
  const targetMode = getTargetMode(game, buildMode);
  const targets =
    targetMode === "settlement"
      ? game.legalActions.settlementVertexKeys.map((vertexKey, index) => ({
          command: { kind: "place_settlement", vertexKey } as const,
          label: `Settlement ${index + 1}`,
          message: "Settlement placed.",
        }))
      : targetMode === "city"
        ? game.legalActions.cityVertexKeys.map((vertexKey, index) => ({
            command: { kind: "build_city", vertexKey } as const,
            label: `City ${index + 1}`,
            message: "City completed.",
          }))
        : targetMode === "road"
          ? game.legalActions.roadEdgeKeys.map((edgeKey, index) => ({
              command: { edgeKey, kind: "place_road" } as const,
              label: `Road ${index + 1}`,
              message: "Road placed.",
            }))
          : targetMode === "robber"
            ? game.legalActions.robberTileIds.map((tileId, index) => ({
                command: { kind: "move_robber", tileId } as const,
                label: `Tile ${index + 1}`,
                message: "Robber moved.",
              }))
            : [];

  if (targets.length === 0) {
    return null;
  }

  return (
    <div className="compact-board-targets" role="group" aria-label="Safe board placement choices">
      <strong>Choose:</strong>
      <div>
        {targets.map((target) => (
          <Button
            className="compact-target-button"
            isDisabled={pending}
            key={target.label}
            onPress={() => onCommand(target.command, target.message)}
            variant="secondary"
          >
            {target.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function UnavailablePlayerView({ onLeave }: { onLeave(): Promise<void> }) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const leave = async () => {
    if (leaving) {
      return;
    }
    setLeaving(true);
    try {
      await onLeave();
      setShowConfirmation(false);
    } finally {
      setLeaving(false);
    }
  };

  return (
    <>
      <main className="centered-page notice-page" id="main-content">
        <section className="notice-card">
          <h1>Player View Unavailable</h1>
          <p>Your private seat could not be matched to this game. Refresh to reconnect.</p>
          <Button
            className="button button-secondary"
            onPress={() => setShowConfirmation(true)}
            variant="secondary"
          >
            Leave Game
          </Button>
        </section>
      </main>
      {showConfirmation ? (
        <ConfirmationDialog
          busy={leaving}
          confirmLabel="Leave Game"
          description="You cannot reclaim this seat after leaving. A bot will take over, or the game will close if no human players remain."
          onCancel={() => setShowConfirmation(false)}
          onConfirm={() => void leave()}
          title="Leave this game?"
        />
      ) : null}
    </>
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
    <Button
      aria-pressed={active}
      className={active ? "action-button is-selected" : "action-button"}
      isDisabled={disabled}
      onPress={onClick}
      variant="secondary"
    >
      {icon}
      <strong>{label}</strong>
      <span className="mini-cost">
        {RESOURCE_ORDER.filter((resource) => cost[resource] > 0).map((resource) => (
          <span
            aria-label={`${cost[resource]} ${RESOURCE_LABELS[resource]}`}
            key={resource}
            title={`${cost[resource]} ${RESOURCE_LABELS[resource]}`}
          >
            <ResourceIcon decorative resource={resource} size={20} /> {cost[resource]}
          </span>
        ))}
      </span>
    </Button>
  );
}

function TurnClock({ botThinking, nextActionAt }: { botThinking: boolean; nextActionAt?: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!nextActionAt) {
      return;
    }
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [nextActionAt]);

  if (!nextActionAt) {
    return null;
  }

  const seconds = Math.max(0, Math.ceil((nextActionAt - now) / 1_000));
  return (
    <div
      aria-label={`${botThinking ? "Bot thinking" : "Turn time"}, ${seconds} seconds remaining`}
      aria-live="off"
      className={botThinking ? "turn-clock is-bot" : "turn-clock"}
      role="timer"
    >
      {botThinking ? <Bot aria-hidden="true" /> : null}
      <span>{botThinking ? "Bot thinking" : "Turn time"}</span>
      <strong>{seconds}s</strong>
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
            <Button
              aria-label={`Remove one ${RESOURCE_LABELS[resource]}`}
              isDisabled={pending || selection[resource] === 0}
              isIconOnly
              onPress={() => update(resource, -1)}
              variant="ghost"
            >
              −
            </Button>
            <strong>{selection[resource]}</strong>
            <Button
              aria-label={`Add one ${RESOURCE_LABELS[resource]}`}
              isDisabled={
                pending || selectedCount >= count || selection[resource] >= me.resources[resource]
              }
              isIconOnly
              onPress={() => update(resource, 1)}
              variant="ghost"
            >
              +
            </Button>
          </div>
        ))}
      </div>
      <Button
        className="button button-primary"
        isDisabled={pending || selectedCount !== count}
        onPress={() => onCommand({ kind: "discard", resources: selection }, "Resources returned.")}
      >
        Confirm Discard
      </Button>
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
    <Modal>
      <Modal.Backdrop
        className="win-overlay"
        isDismissable={false}
        isKeyboardDismissDisabled
        isOpen
      >
        <Modal.Container>
          <Modal.Dialog className="win-card">
            <Modal.Header className="win-card-header">
              <span className="win-crown" aria-hidden="true">
                <Crown />
              </span>
              <div>
                <p className="eyebrow">Game Complete</p>
                <Modal.Heading id="win-title">
                  {isDraw
                    ? "The Island Rests in a Draw"
                    : isViewer
                      ? "You Rule the Island!"
                      : `${winnerName ?? "A Player"} Wins!`}
                </Modal.Heading>
              </div>
            </Modal.Header>
            <Modal.Body className="win-card-body" id="win-description">
              {isDraw
                ? "No player reached the victory target before the final turn."
                : isViewer
                  ? "Your settlements became a thriving island realm."
                  : "A new saga begins with the next game."}
            </Modal.Body>
            <Modal.Footer className="win-card-footer">
              <Button className="button button-primary" onPress={onLeave}>
                Return Home
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function toGameError(cause: unknown): string {
  const rawMessage = cause instanceof Error ? cause.message : "The action could not be completed.";
  const normalizedMessage = rawMessage.toLowerCase();
  if (normalizedMessage.includes("action number") || normalizedMessage.includes("stale")) {
    return "The game moved ahead before this action arrived. Review the refreshed board and try again.";
  }
  if (normalizedMessage.includes("deadline")) {
    return "That action arrived after the timer expired. The game is advancing automatically.";
  }
  if (normalizedMessage.includes("resources")) {
    return "You do not have the resources required for that action. Review your hand and try again.";
  }
  if (normalizedMessage.includes("phase") || normalizedMessage.includes("required actor")) {
    return "That action is no longer available. Review the current turn instruction and try again.";
  }
  return "The game rejected that action. Review the highlighted legal choices and try again.";
}
