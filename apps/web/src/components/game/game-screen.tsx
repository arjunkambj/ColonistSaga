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
  CircleHelp,
  Crown,
  Dices,
  Flag,
  Hammer,
  Info,
  Layers3,
  Maximize2,
  Minimize2,
  ScrollText,
  Settings,
  ShieldCheck,
  Trophy,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Brand } from "@/components/ui/brand";
import { liquidGlassClassName } from "@/components/ui/liquid-glass";
import type { RoomEventView } from "@/lib/game/types";
import { getPhaseCopy } from "@/lib/game/view";

import { ActionTile } from "./action-tile";
import { GameBoard, getPlayerTheme, getTargetMode, type BuildMode } from "./game-board";
import { RESOURCE_LABELS, ResourceIcon } from "./resource-icon";
import { PieceIcon, type PieceAsset, type PieceTheme } from "./piece-icon";
import { TradeCenter } from "./trade-center";

type GameConfirmation =
  | { kind: "leave" }
  | { displayName: string; kind: "replace"; playerId: string };

type GameInfoView = "help" | "overview";

const DIE_PIPS: Record<number, readonly number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const EVENT_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export function GameScreen({
  code,
  events,
  game,
  isHost,
  botThinking,
  nextActionAt,
  onLeave,
  viewerProfileImageUrl,
}: {
  code: string;
  events: RoomEventView[];
  game: PlayerGameView;
  isHost: boolean;
  botThinking: boolean;
  nextActionAt?: number;
  onLeave(): Promise<void>;
  viewerProfileImageUrl: string | null;
}) {
  const applyCommand = useMutation(api.games.applyCommand);
  const replacePlayerWithBot = useMutation(api.rooms.replacePlayerWithBot);
  const [buildMode, setBuildMode] = useState<BuildMode>(null);
  const [pendingCommand, setPendingCommand] = useState<GameCommand["kind"] | null>(null);
  const [pendingReplacementId, setPendingReplacementId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<GameConfirmation | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [gameInfoView, setGameInfoView] = useState<GameInfoView | null>(null);
  const [isBoardFocused, setIsBoardFocused] = useState(false);
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
    <main
      className={`game-page reference-game${isBoardFocused ? " is-board-focused" : ""}`}
      id="main-content"
    >
      <header className="game-header">
        <Brand className="compact-brand" />
        <div className="game-room-meta">
          <span translate="no">Room {code}</span>
          <span>Turn {game.turnNumber}</span>
          <span className="victory-target-pill">
            <Trophy aria-hidden="true" /> First to {game.victoryPoints} VP
          </span>
        </div>
        <div className="game-header-actions">
          <Button
            aria-controls="game-info-dialog"
            aria-expanded={gameInfoView === "overview"}
            aria-haspopup="dialog"
            aria-label="Open game information"
            className="icon-button game-settings-button"
            isIconOnly
            onPress={() => setGameInfoView("overview")}
            variant="ghost"
          >
            <Settings aria-hidden="true" />
          </Button>
          <Button
            aria-controls="game-info-dialog"
            aria-expanded={gameInfoView === "help"}
            aria-haspopup="dialog"
            aria-label="Open game help"
            className="icon-button game-help-button"
            isIconOnly
            onPress={() => setGameInfoView("help")}
            variant="ghost"
          >
            <CircleHelp aria-hidden="true" />
          </Button>
          <Button
            aria-controls="game-sidebar-panels"
            aria-label={isBoardFocused ? "Restore table panels" : "Focus on the game board"}
            aria-pressed={isBoardFocused}
            className="icon-button board-focus-button"
            isIconOnly
            onPress={() => {
              setIsBoardFocused((current) => !current);
              setGameInfoView(null);
            }}
            variant="ghost"
          >
            {isBoardFocused ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
          </Button>
          <Button
            aria-controls="game-info-dialog"
            aria-expanded={gameInfoView === "overview"}
            aria-haspopup="dialog"
            aria-label="Open island supply and game log"
            className="icon-button mobile-game-info-button"
            isIconOnly
            onPress={() => setGameInfoView("overview")}
            variant="ghost"
          >
            <Info aria-hidden="true" />
          </Button>
          <Button
            aria-label="Leave game"
            className="icon-button player-menu-button"
            isIconOnly
            onPress={() => setConfirmation({ kind: "leave" })}
            variant="ghost"
          >
            <span aria-hidden="true">{getPlayerInitials(me.displayName).slice(0, 1)}</span>
          </Button>
        </div>
      </header>

      <aside className="game-sidebar" aria-label="Table status and game information">
        <div
          aria-hidden={isBoardFocused || undefined}
          className="game-sidebar-panels"
          id="game-sidebar-panels"
          inert={isBoardFocused || undefined}
        >
          <EventLog events={events} />
          <BankPanel bank={game.bank} />
        </div>

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
          viewerProfileImageUrl={viewerProfileImageUrl}
          victoryTarget={game.victoryPoints}
        />
      </aside>

      <section className="phase-banner phase-banner-overlay" aria-labelledby="phase-title">
        <div className="phase-icon" aria-hidden="true">
          {game.phase.kind === "roll" ? <Dices /> : <Flag />}
        </div>
        <div className="phase-copy">
          <p className="eyebrow">Turn {game.turnNumber}</p>
          <h1 id="phase-title">{phaseCopy.title}</h1>
          <p>{phaseCopy.detail}</p>
        </div>
        <div className="phase-status-tools">
          <TurnClock botThinking={botThinking} nextActionAt={nextActionAt} />
          <DiceResult game={game} />
        </div>
      </section>

      <GameBoard
        buildMode={buildMode}
        game={game}
        onCancelBuildMode={() => setBuildMode(null)}
        onCommand={(command, message) => void sendCommand(command, message)}
        pending={pendingCommand !== null}
      />

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

      {gameInfoView ? (
        <MobileGameInfo
          code={code}
          events={events}
          game={game}
          onClose={() => setGameInfoView(null)}
          view={gameInfoView}
        />
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
  viewerProfileImageUrl,
  victoryTarget,
}: {
  activePlayerId: string;
  isHost: boolean;
  onReplacePlayer(playerId: string): void;
  pendingReplacementId: string | null;
  players: PlayerGameView["players"];
  viewerProfileImageUrl: string | null;
  victoryTarget: number;
}) {
  return (
    <ol className="player-strip" aria-label="Players">
      {players.map((player) => {
        const theme = getPlayerTheme(player);
        const isActive = player.id === activePlayerId;
        const avatarSrc = player.isViewer ? viewerProfileImageUrl : null;
        const identityLabel = player.isViewer ? "You" : player.isBot ? "Bot" : null;
        const turnLabel = player.isViewer ? "Your turn" : player.isBot ? "Thinking" : "Playing";
        return (
          <li
            aria-current={isActive ? "true" : undefined}
            className={`player-summary player-${theme}${isActive ? " is-active" : ""}${player.isViewer ? " is-viewer" : ""}`}
            key={player.id}
          >
            <span
              className={player.isBot ? "player-avatar is-bot" : "player-avatar is-human"}
              aria-hidden="true"
            >
              <span className="player-avatar-fallback">
                {player.isBot ? <Bot aria-hidden="true" /> : getPlayerInitials(player.displayName)}
              </span>
              {avatarSrc ? (
                <img
                  alt=""
                  className="player-avatar-image"
                  draggable={false}
                  height={512}
                  onError={(event) => {
                    event.currentTarget.hidden = true;
                  }}
                  src={avatarSrc}
                  width={512}
                />
              ) : null}
            </span>
            <div className="player-name">
              <div className="player-identity-line">
                <strong title={player.displayName}>{player.displayName}</strong>
                {identityLabel ? <em>{identityLabel}</em> : null}
              </div>
              {isActive ? (
                <span className="player-turn-status">
                  <i aria-hidden="true" /> {turnLabel}
                </span>
              ) : null}
            </div>
            <div className="player-victory-progress">
              <span
                aria-label={`${player.victoryPoints} of ${victoryTarget} victory points`}
                className="player-stat player-victory-stat"
              >
                <Crown aria-hidden="true" />
                <strong>{player.victoryPoints}</strong>
                <small>VP</small>
              </span>
            </div>
            <div className="player-table-supply">
              <span
                aria-label={`${player.resourceCount} resource cards`}
                className="player-stat player-resource-stat"
              >
                <Layers3 aria-hidden="true" />
                <strong>{player.resourceCount}</strong> <small>cards</small>
              </span>
              <div className="player-piece-stats" aria-label="Pieces remaining" role="group">
                <span aria-label={`${player.piecesRemaining.roads} roads remaining`} role="img">
                  <PieceIcon asset="road" theme={theme} />
                  <strong>{player.piecesRemaining.roads}</strong>
                </span>
                <span
                  aria-label={`${player.piecesRemaining.settlements} settlements remaining`}
                  role="img"
                >
                  <PieceIcon asset="settlement" theme={theme} />
                  <strong>{player.piecesRemaining.settlements}</strong>
                </span>
                <span aria-label={`${player.piecesRemaining.cities} cities remaining`} role="img">
                  <PieceIcon asset="city" theme={theme} />
                  <strong>{player.piecesRemaining.cities}</strong>
                </span>
              </div>
            </div>
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
      <div className="dice-result is-empty" aria-label="No dice have been rolled yet" role="group">
        <span className="dice-result-label">Last roll</span>
        <span className="dice-result-empty">Not rolled</span>
      </div>
    );
  }
  return (
    <div
      className="dice-result"
      aria-label={`Last roll: ${game.lastDiceRoll.first} and ${game.lastDiceRoll.second}, total ${game.lastDiceRoll.sum}`}
      role="group"
    >
      <span className="dice-result-label">Last roll</span>
      <span className="dice-result-faces" aria-hidden="true">
        <DieFace value={game.lastDiceRoll.first} />
        <DieFace value={game.lastDiceRoll.second} />
      </span>
      <span className="dice-result-total" aria-hidden="true">
        <small>Total</small>
        <strong>{game.lastDiceRoll.sum}</strong>
      </span>
    </div>
  );
}

function DieFace({ value }: { value: number }) {
  const visiblePips = DIE_PIPS[value] ?? [];
  return (
    <span aria-hidden="true" className="die-face">
      {Array.from({ length: 9 }, (_, index) => (
        <i className={visiblePips.includes(index) ? "is-visible" : ""} key={index} />
      ))}
    </span>
  );
}

function BankPanel({ bank, idPrefix = "" }: { bank: ResourceInventory | null; idPrefix?: string }) {
  const titleId = `${idPrefix}bank-title`;
  return (
    <section className="side-card" aria-labelledby={titleId}>
      <div className="side-card-title">
        <h2 id={titleId}>Resource Market</h2>
        <ShieldCheck aria-hidden="true" />
      </div>
      <ul className="bank-grid">
        {RESOURCE_ORDER.map((resource) => (
          <li
            aria-label={`${RESOURCE_LABELS[resource]}: ${bank ? bank[resource] : "unknown"}`}
            key={resource}
          >
            <ResourceIcon decorative resource={resource} size={30} />
            <span>{RESOURCE_LABELS[resource]}</span>
            <strong>{bank ? bank[resource] : "?"}</strong>
          </li>
        ))}
        <li
          aria-disabled="true"
          aria-label="Development card supply is not part of this ruleset"
          className="bank-mystery"
        >
          <span aria-hidden="true" className="bank-mystery-icon">
            ?
          </span>
        </li>
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
      <p aria-atomic="true" aria-live="polite" className="sr-only">
        {visibleEvents[0]?.text ?? "No moves yet."}
      </p>
      <ol className="event-list">
        {visibleEvents.length > 0 ? (
          visibleEvents.map((event) => (
            <li key={event.sequence}>
              <span aria-hidden="true" />
              <div className="event-copy">
                <p>{event.text}</p>
                <time dateTime={new Date(event.createdAt).toISOString()}>
                  {EVENT_TIME_FORMATTER.format(event.createdAt)}
                </time>
              </div>
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
  code,
  events,
  game,
  onClose,
  view,
}: {
  code: string;
  events: RoomEventView[];
  game: PlayerGameView;
  onClose(): void;
  view: GameInfoView;
}) {
  const activePlayer = game.players.find((player) => player.id === game.activePlayerId);
  const isHelp = view === "help";

  return (
    <Modal>
      <Modal.Backdrop isOpen onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}>
        <Modal.Container>
          <Modal.Dialog
            aria-label={isHelp ? "Game help" : "Game information"}
            className={liquidGlassClassName({
              className: "mobile-game-info-dialog game-info-reference-dialog",
              kind: "panel",
              radius: "md",
              tone: "ocean",
            })}
            id="game-info-dialog"
          >
            <Modal.Header className="mobile-game-info-header">
              <div>
                <p className="eyebrow">{isHelp ? "Player Guide" : "Live Table"}</p>
                <Modal.Heading>{isHelp ? "How to Play" : "Game Information"}</Modal.Heading>
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
              {isHelp ? (
                <ol className="game-help-steps">
                  <li>
                    <strong>Roll</strong>
                    <span>Start your turn by rolling both dice.</span>
                  </li>
                  <li>
                    <strong>Trade and build</strong>
                    <span>Exchange cards, then choose a piece and a glowing board target.</span>
                  </li>
                  <li>
                    <strong>Resolve the robber</strong>
                    <span>
                      On a seven, discard if required, move the robber, and choose a neighbor.
                    </span>
                  </li>
                  <li>
                    <strong>End your turn</strong>
                    <span>Pass play clockwise when you have finished every action.</span>
                  </li>
                </ol>
              ) : (
                <>
                  <dl className="game-info-settings">
                    <div>
                      <dt>Room</dt>
                      <dd translate="no">{code}</dd>
                    </div>
                    <div>
                      <dt>Current turn</dt>
                      <dd>{activePlayer?.displayName ?? "Unknown player"}</dd>
                    </div>
                    <div>
                      <dt>Victory target</dt>
                      <dd>{game.victoryPoints} VP</dd>
                    </div>
                    <div>
                      <dt>Turn timer</dt>
                      <dd>
                        {game.settings.turnTimerSeconds === 0
                          ? "Off"
                          : `${game.settings.turnTimerSeconds} seconds`}
                      </dd>
                    </div>
                    <div>
                      <dt>Friendly robber</dt>
                      <dd>{game.settings.friendlyRobber ? "On" : "Off"}</dd>
                    </div>
                    <div>
                      <dt>Balanced dice</dt>
                      <dd>{game.settings.balancedDice ? "On" : "Off"}</dd>
                    </div>
                  </dl>
                  <BankPanel bank={game.bank} idPrefix="mobile-" />
                  <EventLog events={events} idPrefix="mobile-" />
                </>
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function ResourceHand({ me }: { me: PrivatePlayerState }) {
  const theme = getPlayerTheme(me);

  return (
    <section aria-labelledby="resource-hand-title" className="resource-hand">
      <div className="hand-heading">
        <p className="eyebrow">Private Hand</p>
        <h2 id="resource-hand-title">Your Resources</h2>
        <span>{me.resourceCount} cards total</span>
      </div>
      <ul className="resource-card-list">
        {RESOURCE_ORDER.map((resource) => (
          <li
            aria-label={`${RESOURCE_LABELS[resource]}: ${me.resources[resource]}`}
            className={`resource-card resource-card-face resource-${resource}`}
            key={resource}
            tabIndex={0}
          >
            <span className="resource-card-art" aria-hidden="true">
              <ResourceIcon decorative resource={resource} size={72} />
            </span>
            <span className="resource-card-copy">
              <span className="resource-card-label">{RESOURCE_LABELS[resource]}</span>
              <span className="resource-card-quantity">
                <strong>{me.resources[resource]}</strong>
                <small>{me.resources[resource] === 1 ? "card" : "cards"}</small>
              </span>
            </span>
          </li>
        ))}
        <li
          aria-label="Development cards are not available in this ruleset"
          className="resource-card resource-card-face resource-mystery is-unavailable"
          tabIndex={0}
        >
          <span className="resource-card-art resource-card-mystery-icon" aria-hidden="true">
            ?
          </span>
          <span className="resource-card-copy">
            <span className="resource-card-label">Dev cards</span>
            <span className="resource-card-quantity">
              <strong>—</strong>
              <small>not in ruleset</small>
            </span>
          </span>
        </li>
      </ul>
      <div className="piece-supply" aria-labelledby="piece-supply-title" role="group">
        <span className="piece-supply-title" id="piece-supply-title">
          Piece Supply
        </span>
        <div className="piece-counts" role="list">
          <span aria-label={`${me.piecesRemaining.roads} roads remaining`} role="listitem">
            <PieceIcon asset="road" theme={theme} />
            <span>
              <strong>{me.piecesRemaining.roads}</strong>
              <small>Roads</small>
            </span>
          </span>
          <span
            aria-label={`${me.piecesRemaining.settlements} settlements remaining`}
            role="listitem"
          >
            <PieceIcon asset="settlement" theme={theme} />
            <span>
              <strong>{me.piecesRemaining.settlements}</strong>
              <small>Settlements</small>
            </span>
          </span>
          <span aria-label={`${me.piecesRemaining.cities} cities remaining`} role="listitem">
            <PieceIcon asset="city" theme={theme} />
            <span>
              <strong>{me.piecesRemaining.cities}</strong>
              <small>Cities</small>
            </span>
          </span>
        </div>
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
  const viewerTheme = getPlayerTheme(me);
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
      <section className="action-dock action-dock-roll-layout" aria-label="Turn actions">
        <div aria-label="Dice ready to roll" className="roll-preview-card" role="img">
          <DieFace value={1} />
          <DieFace value={5} />
        </div>
        <Button
          className="button button-primary dice-button"
          isDisabled={pending}
          isPending={pending}
          onPress={() => onCommand({ kind: "roll" }, "Dice rolled.")}
        >
          <Dices aria-hidden="true" />
          <span>{pending ? "Rolling…" : "Roll Dice"}</span>
        </Button>
        <ActionTile
          ariaLabel="End turn unavailable until the dice are rolled"
          art={
            <img
              alt=""
              className="action-art"
              draggable={false}
              height={256}
              src="/game-assets/ui/end-turn-hourglass-v1.png"
              width={256}
            />
          }
          caption={`Turn ${game.turnNumber}`}
          className="button button-end-turn"
          kind="end-turn"
          onPress={() => undefined}
          title="End Turn"
          unavailable
        />
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

  const roadDisabledReason = getBuildDisabledReason({
    cost: BUILD_COSTS.road,
    legalTargetCount: legal.roadEdgeKeys.length,
    pending,
    pieceLabel: "road",
    piecePlural: "roads",
    piecesRemaining: me.piecesRemaining.roads,
    resources: me.resources,
  });
  const settlementDisabledReason = getBuildDisabledReason({
    cost: BUILD_COSTS.settlement,
    legalTargetCount: legal.settlementVertexKeys.length,
    pending,
    pieceLabel: "settlement",
    piecePlural: "settlements",
    piecesRemaining: me.piecesRemaining.settlements,
    resources: me.resources,
  });
  const cityDisabledReason = getBuildDisabledReason({
    cost: BUILD_COSTS.city,
    legalTargetCount: legal.cityVertexKeys.length,
    pending,
    pieceLabel: "city",
    piecePlural: "cities",
    piecesRemaining: me.piecesRemaining.cities,
    resources: me.resources,
  });

  return (
    <section
      aria-label="Build and trade actions"
      className="action-dock action-dock-tile-layout"
      data-action-layout="six-tile-reference"
    >
      <div className="action-heading">
        <strong>Build & Trade</strong>
        <span>Select a piece, then choose a glowing target.</span>
      </div>
      <TradeCenter disabled={pending} game={game} me={me} onCommand={onCommand} />
      <ActionTile
        ariaLabel="Development cards are not available in this ruleset"
        art={
          <img
            alt=""
            className="action-art"
            draggable={false}
            height={1254}
            src="/game-assets/ui/development-deck-v1.avif"
            width={1254}
          />
        }
        caption="Not in ruleset"
        count="—"
        disabled
        kind="development-deck"
        onPress={() => undefined}
        title="Dev Deck"
        unavailable
      />
      <div className="action-group build-actions">
        <BuildAction
          active={buildMode === "road"}
          asset="road"
          count={me.piecesRemaining.roads}
          cost={BUILD_COSTS.road}
          disabledReason={roadDisabledReason}
          label="Road"
          onPress={() => onBuildMode(buildMode === "road" ? null : "road")}
          resources={me.resources}
          theme={viewerTheme}
        />
        <BuildAction
          active={buildMode === "settlement"}
          asset="settlement"
          count={me.piecesRemaining.settlements}
          cost={BUILD_COSTS.settlement}
          disabledReason={settlementDisabledReason}
          label="Settlement"
          onPress={() => onBuildMode(buildMode === "settlement" ? null : "settlement")}
          resources={me.resources}
          theme={viewerTheme}
        />
        <BuildAction
          active={buildMode === "city"}
          asset="city"
          count={me.piecesRemaining.cities}
          cost={BUILD_COSTS.city}
          disabledReason={cityDisabledReason}
          label="City"
          onPress={() => onBuildMode(buildMode === "city" ? null : "city")}
          resources={me.resources}
          theme={viewerTheme}
        />
      </div>
      <ActionTile
        ariaLabel="End Turn"
        art={
          <img
            alt=""
            className="action-art"
            draggable={false}
            height={256}
            src="/game-assets/ui/end-turn-hourglass-v1.png"
            width={256}
          />
        }
        className="button button-end-turn"
        disabled={pending || !legal.canEndTurn}
        kind="end-turn"
        onPress={() => onCommand({ kind: "end_turn" }, "Turn ended.")}
        title="End Turn"
      />
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
  asset,
  count,
  cost,
  disabledReason,
  label,
  onPress,
  resources,
  theme,
}: {
  active: boolean;
  asset: PieceAsset;
  count: number;
  cost: Readonly<ResourceInventory>;
  disabledReason: string | null;
  label: string;
  onPress(): void;
  resources: Readonly<ResourceInventory>;
  theme: PieceTheme;
}) {
  const disabledReasonId = `build-${asset}-disabled-reason`;
  const status =
    disabledReason === "Action in progress…"
      ? "Working…"
      : active
        ? "Pick a glowing spot"
        : getBuildStatusLabel(disabledReason);
  const costResources = RESOURCE_ORDER.filter((resource) => cost[resource] > 0);

  return (
    <>
      <ActionTile
        ariaDescribedBy={disabledReason ? disabledReasonId : undefined}
        ariaLabel={
          disabledReason
            ? `Build ${label} unavailable`
            : active
              ? `Cancel ${label.toLowerCase()} placement`
              : `Build ${label}`
        }
        art={<PieceIcon asset={asset} className="action-piece" theme={theme} />}
        caption={
          <span
            className={`build-action-status${disabledReason ? " is-blocked" : active ? " is-active" : ""}`}
          >
            {status}
          </span>
        }
        count={count}
        kind={asset}
        meta={
          <span
            aria-label={`Cost: ${costResources.map((resource) => `${cost[resource]} ${RESOURCE_LABELS[resource]}`).join(", ")}`}
            className="mini-cost"
          >
            {costResources.map((resource) => (
              <span
                aria-hidden="true"
                className={resources[resource] < cost[resource] ? "is-missing" : undefined}
                key={resource}
                title={`${cost[resource]} ${RESOURCE_LABELS[resource]}`}
              >
                <ResourceIcon decorative resource={resource} size={20} />
                <b>{cost[resource]}</b>
                <span>{RESOURCE_LABELS[resource]}</span>
              </span>
            ))}
          </span>
        }
        onPress={disabledReason ? () => undefined : onPress}
        pressed={active}
        title={label}
        unavailable={disabledReason !== null}
      />
      {disabledReason ? (
        <span className="sr-only" id={disabledReasonId}>
          {disabledReason}
        </span>
      ) : null}
    </>
  );
}

function getBuildStatusLabel(disabledReason: string | null): string {
  if (!disabledReason) {
    return "Ready";
  }
  if (disabledReason.startsWith("Need ")) {
    return "Missing cards";
  }
  if (disabledReason.startsWith("No legal ")) {
    return "No space";
  }
  if (disabledReason.startsWith("No ") && disabledReason.endsWith(" remaining")) {
    return "None left";
  }
  return "Working…";
}

function getPlayerInitials(displayName: string): string {
  const words = displayName.trim().split(/\s+/).filter(Boolean);
  return (
    words
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function getBuildDisabledReason({
  cost,
  legalTargetCount,
  pending,
  pieceLabel,
  piecePlural,
  piecesRemaining,
  resources,
}: {
  cost: Readonly<ResourceInventory>;
  legalTargetCount: number;
  pending: boolean;
  pieceLabel: string;
  piecePlural: string;
  piecesRemaining: number;
  resources: Readonly<ResourceInventory>;
}): string | null {
  if (pending) {
    return "Action in progress…";
  }
  if (piecesRemaining <= 0) {
    return `No ${piecePlural} remaining`;
  }

  const missingResources = RESOURCE_ORDER.flatMap((resource) => {
    const missingCount = Math.max(0, cost[resource] - resources[resource]);
    return missingCount > 0 ? [`${missingCount} ${RESOURCE_LABELS[resource]}`] : [];
  });
  if (missingResources.length > 0) {
    return `Need ${missingResources.join(", ")}`;
  }
  if (legalTargetCount === 0) {
    return `No legal ${pieceLabel} location`;
  }
  return null;
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
