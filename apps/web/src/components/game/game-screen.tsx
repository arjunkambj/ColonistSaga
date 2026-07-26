"use client";

import { api } from "@colonistsaga/backend/convex/_generated/api";
import {
  BUILD_COSTS,
  DEVELOPMENT_CARD_COST,
  RESOURCE_ORDER,
  type GameCommand,
  type PlayerGameView,
  type PrivatePlayerState,
  type ResourceInventory,
} from "@colonistsaga/game";
import { Button, Modal } from "@heroui/react";
import botIcon from "@iconify-icons/game-icons/robot-golem";
import crownIcon from "@iconify-icons/game-icons/crown";
import diceIcon from "@iconify-icons/game-icons/rolling-dice-cup";
import flagIcon from "@iconify-icons/game-icons/flag-objective";
import hammerIcon from "@iconify-icons/game-icons/hammer-nails";
import moveIcon from "@iconify-icons/game-icons/move";
import playerIcon from "@iconify-icons/game-icons/player-base";
import scrollIcon from "@iconify-icons/game-icons/scroll-unfurled";
import shieldIcon from "@iconify-icons/game-icons/shield";
import trophyIcon from "@iconify-icons/game-icons/trophy-cup";
import helpIcon from "@iconify-icons/solar/question-circle-outline";
import infoIcon from "@iconify-icons/solar/info-circle-outline";
import layersIcon from "@iconify-icons/solar/layers-outline";
import maximizeIcon from "@iconify-icons/solar/maximize-square-outline";
import minimizeIcon from "@iconify-icons/solar/minimize-square-outline";
import settingsIcon from "@iconify-icons/solar/settings-minimalistic-outline";
import { Icon } from "@iconify/react";
import { useMutation } from "convex/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { AudioSettingsControls } from "@/components/audio/audio-settings-controls";
import { GameAudio } from "@/components/audio/game-audio";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Brand } from "@/components/ui/brand";
import { liquidGlassClassName } from "@/components/ui/liquid-glass";
import { ACTION_CARD_ASSET_PATHS, DEVELOPMENT_DECK_ASSET_PATH } from "@/constants/game/card-assets";
import { getPlayerPortraitPath } from "@/constants/game/player-assets";
import type { BoardTargetMode } from "@/lib/game/board-canvas-model";
import { getTurnControlKind } from "@/lib/game/game-footer-model";
import type { RoomEventView } from "@/lib/game/types";
import { getPhaseCopy } from "@/lib/game/view";
import type { AudioSettings } from "@/lib/audio-settings";

import { ActionTile } from "./action-tile";
import { DiscardPanel } from "./discard-panel";
import { GameBoard, getPlayerTheme, type BuildMode } from "./game-board";
import { HandDockProvider } from "./hand-dock";
import { RESOURCE_LABELS, ResourceIcon } from "./resource-icon";
import { PieceIcon } from "./piece-icon";
import { ResourceHand } from "./resource-hand";
import { ActiveTradeOffer, TradeCenter } from "./trade-center";

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

const UTC_EVENT_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});
const LOCAL_EVENT_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export function GameScreen({
  audioSettings,
  code,
  events,
  game,
  isHost,
  botThinking,
  nextActionAt,
  onAudioSettingsChange,
  onLeave,
  viewerProfileImageUrl,
}: {
  audioSettings: AudioSettings;
  code: string;
  events: RoomEventView[];
  game: PlayerGameView;
  isHost: boolean;
  botThinking: boolean;
  nextActionAt?: number;
  onAudioSettingsChange(settings: AudioSettings): void;
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
  const commandInFlightRef = useRef(false);
  const confirmationInFlightRef = useRef(false);
  const phaseHeadingRef = useRef<HTMLHeadingElement>(null);
  const replacementInFlightRef = useRef(false);

  const restorePlacementFocus = useCallback((mode: BoardTargetMode) => {
    const buildAction = document.querySelector<HTMLButtonElement>(
      `.game-footer [data-action-kind="${mode}"]`,
    );

    if (buildAction && !buildAction.disabled) {
      buildAction.focus();
      return;
    }

    phaseHeadingRef.current?.focus();
  }, []);

  const me = game.players.find((player): player is PrivatePlayerState => player.isViewer);
  const activePlayer = game.players.find((player) => player.id === game.activePlayerId);
  const winner = game.players.find((player) => player.id === game.winnerPlayerId);
  const tradeOfferActionNumber = game.tradeOffer?.offerActionNumber;

  useEffect(() => {
    setBuildMode(null);
  }, [game.actionNumber, game.phase.kind]);

  useEffect(() => {
    if (tradeOfferActionNumber !== undefined) {
      setIsBoardFocused(false);
    }
  }, [tradeOfferActionNumber]);

  if (!me || !activePlayer) {
    return <UnavailablePlayerView onLeave={onLeave} />;
  }

  const sendCommand = async (command: GameCommand, successMessage: string) => {
    if (!acquireSingleFlight(commandInFlightRef)) {
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
      commandInFlightRef.current = false;
      setPendingCommand(null);
    }
  };

  const replaceWithBot = async (playerId: string) => {
    if (!acquireSingleFlight(replacementInFlightRef)) {
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
      replacementInFlightRef.current = false;
      setPendingReplacementId(null);
    }
  };

  const requestBotReplacement = (playerId: string) => {
    const player = game.players.find((candidate) => candidate.id === playerId);
    if (!player) {
      return;
    }

    setConfirmation({
      displayName: player.displayName,
      kind: "replace",
      playerId,
    });
  };

  const phaseCopy = getPhaseCopy(game.phase, activePlayer.id === me.id, activePlayer.displayName);
  const latestEvent = events.at(-1)?.text;
  const phaseLiveMessage = `${phaseCopy.title}. ${phaseCopy.detail}${latestEvent ? ` Latest table event: ${latestEvent}.` : ""}`;

  const runConfirmedAction = async () => {
    if (!confirmation || !acquireSingleFlight(confirmationInFlightRef)) {
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
      confirmationInFlightRef.current = false;
      setConfirming(false);
    }
  };

  return (
    <main
      className={`game-page reference-game${isBoardFocused ? " is-board-focused" : ""}`}
      id="main-content"
    >
      <GameAudio
        activePlayerId={game.activePlayerId}
        events={events}
        phaseKind={game.phase.kind}
        soundEffectsVolume={audioSettings.soundEffectsVolume}
        viewerPlayerId={me.id}
        winnerPlayerId={game.winnerPlayerId}
      />
      <header className="game-header">
        <Brand className="compact-brand" />
        <div className="game-room-meta">
          <span translate="no">Room {code}</span>
          <span>Turn {game.turnNumber}</span>
          <span className="victory-target-pill">
            <Icon aria-hidden="true" icon={trophyIcon} /> First to {game.settings.victoryPoints} VP
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
            <Icon aria-hidden="true" icon={settingsIcon} />
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
            <Icon aria-hidden="true" icon={helpIcon} />
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
            <Icon aria-hidden="true" icon={isBoardFocused ? minimizeIcon : maximizeIcon} />
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
            <Icon aria-hidden="true" icon={infoIcon} />
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

      <HandDockProvider>
        <aside
          aria-hidden={isBoardFocused || undefined}
          aria-label="Table status and game information"
          className="game-sidebar"
          inert={isBoardFocused || undefined}
        >
          <div
            aria-hidden={isBoardFocused || undefined}
            className="game-sidebar-panels"
            id="game-sidebar-panels"
            inert={isBoardFocused || undefined}
          >
            <EventLog events={events} />
            <BankPanel bank={game.bank} />
          </div>

          {game.tradeOffer ? (
            <ActiveTradeOffer
              disabled={pendingCommand !== null}
              game={game}
              me={me}
              onCommand={(command, message) => void sendCommand(command, message)}
            />
          ) : null}

          <PlayerStrip
            activePlayerId={game.activePlayerId}
            activePhaseLabel={getPhaseStatusLabel(game.phase)}
            isHost={isHost}
            onReplacePlayer={requestBotReplacement}
            pendingReplacementId={pendingReplacementId}
            players={game.players}
            viewerProfileImageUrl={viewerProfileImageUrl}
            victoryTarget={game.settings.victoryPoints}
          />
        </aside>

        <section className="phase-banner phase-banner-overlay" aria-labelledby="phase-title">
          <div className="phase-icon" aria-hidden="true">
            <Icon icon={game.phase.kind === "roll" ? diceIcon : flagIcon} />
          </div>
          <div className="phase-copy">
            <p className="eyebrow">Turn {game.turnNumber}</p>
            <h1 id="phase-title" ref={phaseHeadingRef} tabIndex={-1}>
              {phaseCopy.title}
            </h1>
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
          onPlacementExit={restorePlacementFocus}
          pending={pendingCommand !== null}
        />

        <footer
          aria-hidden={isBoardFocused || undefined}
          className="game-footer game-footer--three-sections"
          inert={isBoardFocused || undefined}
        >
          <ResourceHand actionNumber={game.actionNumber} me={me} />

          <ActionDock
            buildMode={buildMode}
            game={game}
            me={me}
            onBuildMode={setBuildMode}
            onCommand={(command, message) => void sendCommand(command, message)}
            pending={pendingCommand !== null}
          />

          <TurnControl
            game={game}
            onCommand={(command, message) => void sendCommand(command, message)}
            pending={pendingCommand !== null}
          />
        </footer>
        {game.legalActions.discardCount === null ? null : (
          <DiscardPanel
            count={game.legalActions.discardCount}
            me={me}
            onCommand={(command, message) => void sendCommand(command, message)}
            pending={pendingCommand !== null}
          />
        )}
      </HandDockProvider>

      {gameInfoView ? (
        <MobileGameInfo
          audioSettings={audioSettings}
          code={code}
          events={events}
          game={game}
          isHost={isHost}
          onClose={() => setGameInfoView(null)}
          onAudioSettingsChange={onAudioSettingsChange}
          onReplacePlayer={requestBotReplacement}
          pendingReplacementId={pendingReplacementId}
          viewerProfileImageUrl={viewerProfileImageUrl}
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
        {phaseLiveMessage}
      </div>
      <div aria-atomic="true" aria-live="polite" className="game-command-live-region">
        {announcement}
      </div>
      {error ? (
        <div aria-atomic="true" className="toast toast-error" role="alert">
          {error}
        </div>
      ) : null}

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
  activePhaseLabel,
  isHost,
  onReplacePlayer,
  pendingReplacementId,
  players,
  viewerProfileImageUrl,
  victoryTarget,
}: {
  activePlayerId: string;
  activePhaseLabel: string;
  isHost: boolean;
  onReplacePlayer(playerId: string): void;
  pendingReplacementId: string | null;
  players: PlayerGameView["players"];
  viewerProfileImageUrl: string | null;
  victoryTarget: number;
}) {
  const stripRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      const activePlayer = [
        ...(stripRef.current?.querySelectorAll<HTMLElement>("[data-player-id]") ?? []),
      ].find((element) => element.dataset.playerId === activePlayerId);
      const stripBounds = stripRef.current?.getBoundingClientRect();
      const playerBounds = activePlayer?.getBoundingClientRect();
      const isVisible =
        stripBounds &&
        playerBounds &&
        playerBounds.left >= stripBounds.left &&
        playerBounds.right <= stripBounds.right &&
        playerBounds.top >= stripBounds.top &&
        playerBounds.bottom <= stripBounds.bottom;
      if (isVisible) {
        return;
      }

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      activePlayer?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "nearest",
        inline: "nearest",
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, [activePlayerId]);

  return (
    <ol className="player-strip" aria-label="Players" ref={stripRef}>
      {players.map((player) => {
        const theme = getPlayerTheme(player);
        const isActive = player.id === activePlayerId;
        const avatarSrc =
          player.isViewer && viewerProfileImageUrl
            ? viewerProfileImageUrl
            : getPlayerPortraitPath(theme);
        const identityLabel = player.isViewer ? "You" : player.isBot ? "Bot" : null;
        const turnLabel = player.isViewer ? "Your turn" : player.isBot ? "Thinking" : "Playing";
        return (
          <li
            aria-current={isActive ? "true" : undefined}
            className={`player-summary player-${theme}${isActive ? " is-active" : ""}${player.isViewer ? " is-viewer" : ""}`}
            data-player-id={player.id}
            key={player.id}
          >
            <span
              className={player.isBot ? "player-avatar is-bot" : "player-avatar is-human"}
              aria-hidden="true"
            >
              <span className="player-avatar-fallback">
                {player.isBot ? (
                  <Icon aria-hidden="true" icon={botIcon} />
                ) : (
                  getPlayerInitials(player.displayName)
                )}
              </span>
              <img
                alt=""
                className="player-avatar-image"
                draggable={false}
                height={256}
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
                src={avatarSrc}
                width={256}
              />
            </span>
            <div className="player-name">
              <div className="player-identity-line">
                <strong title={player.displayName}>{player.displayName}</strong>
                {identityLabel ? <em>{identityLabel}</em> : null}
              </div>
              {isActive ? (
                <span className="player-turn-status">
                  <i aria-hidden="true" />
                  <b>{turnLabel}</b>
                  <small>{activePhaseLabel}</small>
                </span>
              ) : null}
            </div>
            <div className="player-victory-progress">
              <span
                aria-label={`${player.victoryPoints} of ${victoryTarget} victory points`}
                className="player-stat player-victory-stat"
              >
                <Icon aria-hidden="true" icon={crownIcon} />
                <strong>{player.victoryPoints}</strong>
                <small>VP</small>
              </span>
            </div>
            <div className="player-table-supply">
              <span
                aria-label={`${player.resourceCount} resource cards`}
                className="player-stat player-resource-stat"
              >
                <Icon aria-hidden="true" icon={layersIcon} />
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
                <Icon aria-hidden="true" icon={botIcon} />
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
        <Icon aria-hidden="true" icon={shieldIcon} />
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
      </ul>
    </section>
  );
}

function EventLog({ events, idPrefix = "" }: { events: RoomEventView[]; idPrefix?: string }) {
  const [showLocalTime, setShowLocalTime] = useState(false);
  const visibleEvents = events.slice(-30).reverse();
  const titleId = `${idPrefix}events-title`;

  useEffect(() => {
    setShowLocalTime(true);
  }, []);

  const timeFormatter = showLocalTime ? LOCAL_EVENT_TIME_FORMATTER : UTC_EVENT_TIME_FORMATTER;

  return (
    <section className="side-card event-card" aria-labelledby={titleId}>
      <div className="side-card-title">
        <h2 id={titleId}>Game Log</h2>
        <Icon aria-hidden="true" icon={scrollIcon} />
      </div>
      <ol className="event-list">
        {visibleEvents.length > 0 ? (
          visibleEvents.map((event) => (
            <li key={event.sequence}>
              <span aria-hidden="true" />
              <div className="event-copy">
                <p>{event.text}</p>
                <time dateTime={new Date(event.createdAt).toISOString()}>
                  {timeFormatter.format(event.createdAt)}
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
  audioSettings,
  code,
  events,
  game,
  isHost,
  onAudioSettingsChange,
  onClose,
  onReplacePlayer,
  pendingReplacementId,
  viewerProfileImageUrl,
  view,
}: {
  audioSettings: AudioSettings;
  code: string;
  events: RoomEventView[];
  game: PlayerGameView;
  isHost: boolean;
  onAudioSettingsChange(settings: AudioSettings): void;
  onClose(): void;
  onReplacePlayer(playerId: string): void;
  pendingReplacementId: string | null;
  viewerProfileImageUrl: string | null;
  view: GameInfoView;
}) {
  const activePlayer = game.players.find((player) => player.id === game.activePlayerId);
  const isHelp = view === "help";

  return (
    <Modal>
      <Modal.Backdrop
        className="mobile-game-info-backdrop"
        isOpen
        onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}
      >
        <Modal.Container>
          <Modal.Dialog
            aria-label={isHelp ? "Game help" : "Game information"}
            className={liquidGlassClassName({
              className: "mobile-game-info-dialog game-info-reference-dialog",
              kind: "panel",
              radius: "md",
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
                    <strong>Reach the victory target</strong>
                    <span>Build settlements and cities until you reach the table’s VP goal.</span>
                  </li>
                  <li>
                    <strong>Roll</strong>
                    <span>Start your turn by rolling both dice.</span>
                  </li>
                  <li>
                    <strong>Read the number pips</strong>
                    <span>More dots mean a more frequent roll. Red 6 and 8 are the strongest.</span>
                  </li>
                  <li>
                    <strong>Trade and build</strong>
                    <span>
                      Trade, buy development cards, or choose a piece and a glowing board target.
                    </span>
                  </li>
                  <li>
                    <strong>Keep settlements apart</strong>
                    <span>Every new settlement needs at least two clear roads between homes.</span>
                  </li>
                  <li>
                    <strong>Unlock harbors</strong>
                    <span>Build on a harbor corner to trade at its printed 3:1 or 2:1 rate.</span>
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
                  <AudioSettingsControls
                    onChange={onAudioSettingsChange}
                    settings={audioSettings}
                  />
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
                      <dd>{game.settings.victoryPoints} VP</dd>
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
                  <section
                    aria-labelledby="mobile-game-info-players-title"
                    className="mobile-game-info-players"
                  >
                    <h3 id="mobile-game-info-players-title">Players</h3>
                    <PlayerStrip
                      activePlayerId={game.activePlayerId}
                      activePhaseLabel={getPhaseStatusLabel(game.phase)}
                      isHost={isHost}
                      onReplacePlayer={onReplacePlayer}
                      pendingReplacementId={pendingReplacementId}
                      players={game.players}
                      viewerProfileImageUrl={viewerProfileImageUrl}
                      victoryTarget={game.settings.victoryPoints}
                    />
                  </section>
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
      <BuildingActionsDock
        buildMode={buildMode}
        disabledReasonOverride={`Return ${legal.discardCount} resource ${
          legal.discardCount === 1 ? "card" : "cards"
        } from your hand`}
        game={game}
        me={me}
        onBuildMode={onBuildMode}
        onCommand={onCommand}
        pending={pending}
      />
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
                <Icon aria-hidden="true" icon={playerIcon} /> {player?.displayName ?? "Neighbor"}
              </Button>
            );
          })}
        </div>
      </section>
    );
  }

  if (game.phase.kind === "move_robber") {
    return (
      <section className="action-dock is-waiting" aria-label="Move the robber">
        <Icon aria-hidden="true" icon={moveIcon} />
        <div>
          <strong>Move the Robber</strong>
          <span>Choose a glowing hex, not a house.</span>
          <span>
            {game.settings.friendlyRobber
              ? "Friendly Robber protects players with 2 or fewer visible victory points."
              : "That hex will not produce resources while the robber remains."}
          </span>
        </div>
      </section>
    );
  }

  if (legal.canRoll) {
    return (
      <BuildingActionsDock
        buildMode={buildMode}
        disabledReasonOverride="Roll the dice first"
        game={game}
        me={me}
        onBuildMode={onBuildMode}
        onCommand={onCommand}
        pending={pending}
      />
    );
  }

  if (game.phase.kind !== "build_and_trade") {
    return (
      <section className="action-dock is-waiting" aria-label="Required action">
        <Icon aria-hidden="true" icon={hammerIcon} />
        <div>
          <strong>Choose a highlighted board target</strong>
          <span>The board shows every legal option.</span>
        </div>
      </section>
    );
  }

  return (
    <BuildingActionsDock
      buildMode={buildMode}
      game={game}
      me={me}
      onBuildMode={onBuildMode}
      onCommand={onCommand}
      pending={pending}
    />
  );
}

function BuildingActionsDock({
  buildMode,
  disabledReasonOverride,
  game,
  me,
  onBuildMode,
  onCommand,
  pending,
}: {
  buildMode: BuildMode;
  disabledReasonOverride?: string;
  game: PlayerGameView;
  me: PrivatePlayerState;
  onBuildMode(mode: BuildMode): void;
  onCommand(command: GameCommand, message: string): void;
  pending: boolean;
}) {
  const legal = game.legalActions;
  const roadDisabledReason =
    disabledReasonOverride ??
    getBuildDisabledReason({
      cost: BUILD_COSTS.road,
      legalTargetCount: legal.roadEdgeKeys.length,
      pending,
      pieceLabel: "road",
      piecePlural: "roads",
      piecesRemaining: me.piecesRemaining.roads,
      resources: me.resources,
    });
  const settlementDisabledReason =
    disabledReasonOverride ??
    getBuildDisabledReason({
      cost: BUILD_COSTS.settlement,
      legalTargetCount: legal.settlementVertexKeys.length,
      pending,
      pieceLabel: "settlement",
      piecePlural: "settlements",
      piecesRemaining: me.piecesRemaining.settlements,
      resources: me.resources,
    });
  const cityDisabledReason =
    disabledReasonOverride ??
    getBuildDisabledReason({
      cost: BUILD_COSTS.city,
      legalTargetCount: legal.cityVertexKeys.length,
      pending,
      pieceLabel: "city",
      piecePlural: "cities",
      piecesRemaining: me.piecesRemaining.cities,
      resources: me.resources,
    });
  const developmentCardDisabledReason =
    disabledReasonOverride ??
    getDevelopmentCardDisabledReason({
      canBuy: legal.canBuyDevelopmentCard,
      pending,
      resources: me.resources,
      supply: game.developmentCardSupply,
    });
  return (
    <section
      aria-labelledby="building-actions-title"
      className="action-dock action-dock-tile-layout building-actions-dock"
    >
      <div className="action-heading">
        <strong id="building-actions-title">Build & Trade</strong>
        <span>
          {disabledReasonOverride ??
            "Buy a card, trade, or select a piece and choose a glowing target."}
        </span>
      </div>
      <TradeCenter
        disabled={pending || disabledReasonOverride !== undefined}
        game={game}
        me={me}
        onCommand={onCommand}
      />
      <div className="action-group build-actions">
        <DevelopmentCardAction
          disabledReason={developmentCardDisabledReason}
          onPress={() => onCommand({ kind: "buy_development_card" }, "Development card purchased.")}
          resources={me.resources}
          supply={game.developmentCardSupply}
        />
        <BuildAction
          active={buildMode === "road"}
          asset="road"
          count={me.piecesRemaining.roads}
          cost={BUILD_COSTS.road}
          disabledReason={roadDisabledReason}
          label="Road"
          onPress={() => onBuildMode(buildMode === "road" ? null : "road")}
          resources={me.resources}
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
        />
      </div>
    </section>
  );
}

function TurnControl({
  game,
  onCommand,
  pending,
}: {
  game: PlayerGameView;
  onCommand(command: GameCommand, message: string): void;
  pending: boolean;
}) {
  const legal = game.legalActions;
  const controlKind = getTurnControlKind({
    canRoll: legal.canRoll,
    isRequiredActor: legal.isRequiredActor,
    phaseKind: game.phase.kind,
  });

  if (controlKind === "roll") {
    return (
      <section className="turn-control" aria-label="Turn control">
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
          <Icon aria-hidden="true" icon={diceIcon} />
          <span>{pending ? "Rolling…" : "Roll Dice"}</span>
        </Button>
      </section>
    );
  }

  if (controlKind === "end_turn") {
    return (
      <section className="turn-control" aria-label="Turn control">
        <ActionTile
          ariaLabel="End Turn"
          art={
            <Image
              alt=""
              className="action-art action-card-art"
              draggable={false}
              height={256}
              loading="eager"
              sizes="4rem"
              src="/game-assets/ui/end-turn-hourglass.png"
              width={256}
            />
          }
          caption={`Turn ${game.turnNumber}`}
          className="button button-end-turn"
          disabled={pending || !legal.canEndTurn}
          kind="end-turn"
          onPress={() => onCommand({ kind: "end_turn" }, "Turn ended.")}
          title="End Turn"
        />
      </section>
    );
  }

  return (
    <section aria-label="Turn control" className="turn-control is-unavailable">
      <Icon aria-hidden="true" icon={controlKind === "waiting" ? playerIcon : flagIcon} />
      <span>{controlKind === "waiting" ? "Waiting" : "Finish action"}</span>
    </section>
  );
}

function UnavailablePlayerView({ onLeave }: { onLeave(): Promise<void> }) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const leaveInFlightRef = useRef(false);

  const leave = async () => {
    if (!acquireSingleFlight(leaveInFlightRef)) {
      return;
    }
    setLeaving(true);
    try {
      await onLeave();
      setShowConfirmation(false);
    } finally {
      leaveInFlightRef.current = false;
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

function DevelopmentCardAction({
  disabledReason,
  onPress,
  resources,
  supply,
}: {
  disabledReason: string | null;
  onPress(): void;
  resources: Readonly<ResourceInventory>;
  supply: number;
}) {
  const descriptionId = "buy-development-card-description";
  const costResources = getCostResources(DEVELOPMENT_CARD_COST);

  return (
    <>
      <ActionTile
        ariaDescribedBy={descriptionId}
        ariaLabel={disabledReason ? "Buy development card unavailable" : "Buy development card"}
        art={
          <Image
            alt=""
            className="action-art"
            draggable={false}
            height={512}
            loading="eager"
            sizes="4rem"
            src={DEVELOPMENT_DECK_ASSET_PATH}
            width={512}
          />
        }
        caption={
          <span className={`build-action-status${disabledReason ? " is-blocked" : ""}`}>
            {getBuildStatusLabel(disabledReason)}
          </span>
        }
        count={supply}
        kind="development-card"
        meta={<CostSummary cost={DEVELOPMENT_CARD_COST} resources={resources} />}
        onPress={disabledReason ? () => undefined : onPress}
        title="Dev Card"
        unavailable={disabledReason !== null}
      />
      <span className="sr-only" id={descriptionId}>
        {supply} development {supply === 1 ? "card" : "cards"} remaining. Cost:{" "}
        {costResources
          .map((resource) => `${DEVELOPMENT_CARD_COST[resource]} ${RESOURCE_LABELS[resource]}`)
          .join(", ")}
        .{disabledReason ? ` ${disabledReason}.` : ""}
      </span>
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
}: {
  active: boolean;
  asset: "city" | "road" | "settlement";
  count: number;
  cost: Readonly<ResourceInventory>;
  disabledReason: string | null;
  label: string;
  onPress(): void;
  resources: Readonly<ResourceInventory>;
}) {
  const descriptionId = `build-${asset}-description`;
  const status =
    disabledReason === "Action in progress…"
      ? "Working…"
      : active
        ? "Pick a glowing spot"
        : getBuildStatusLabel(disabledReason);
  const costResources = getCostResources(cost);

  return (
    <>
      <ActionTile
        ariaDescribedBy={descriptionId}
        ariaLabel={
          disabledReason
            ? `Build ${label} unavailable`
            : active
              ? `Cancel ${label.toLowerCase()} placement`
              : `Build ${label}`
        }
        art={
          <Image
            alt=""
            className="action-art action-card-art"
            draggable={false}
            height={768}
            loading="eager"
            sizes="4rem"
            src={ACTION_CARD_ASSET_PATHS[asset]}
            width={512}
          />
        }
        caption={
          <span
            className={`build-action-status${disabledReason ? " is-blocked" : active ? " is-active" : ""}`}
          >
            {status}
          </span>
        }
        count={count}
        kind={asset}
        meta={<CostSummary cost={cost} resources={resources} />}
        onPress={disabledReason ? () => undefined : onPress}
        pressed={active}
        title={label}
        unavailable={disabledReason !== null}
      />
      <span className="sr-only" id={descriptionId}>
        {count} {count === 1 ? `${label.toLowerCase()} piece` : `${label.toLowerCase()} pieces`}{" "}
        remaining. Cost:{" "}
        {costResources
          .map((resource) => `${cost[resource]} ${RESOURCE_LABELS[resource]}`)
          .join(", ")}
        .{disabledReason ? ` ${disabledReason}.` : ""}
      </span>
    </>
  );
}

function CostSummary({
  cost,
  resources,
}: {
  cost: Readonly<ResourceInventory>;
  resources: Readonly<ResourceInventory>;
}) {
  const costResources = getCostResources(cost);
  return (
    <span aria-label={`Cost: ${formatCost(cost)}`} className="mini-cost">
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
  );
}

function getCostResources(cost: Readonly<ResourceInventory>) {
  return RESOURCE_ORDER.filter((resource) => cost[resource] > 0);
}

function formatCost(cost: Readonly<ResourceInventory>) {
  return getCostResources(cost)
    .map((resource) => `${cost[resource]} ${RESOURCE_LABELS[resource]}`)
    .join(", ");
}

function getBuildStatusLabel(disabledReason: string | null): string {
  if (!disabledReason) {
    return "Ready";
  }
  if (disabledReason === "Roll the dice first") {
    return "Roll first";
  }
  if (disabledReason === "Wait for your turn") {
    return "Waiting";
  }
  if (disabledReason === "Finish the required action first") {
    return "Finish action";
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

  const missingResourcesReason = getMissingResourcesReason(cost, resources);
  if (missingResourcesReason) {
    return missingResourcesReason;
  }
  if (legalTargetCount === 0) {
    return `No legal ${pieceLabel} location`;
  }
  return null;
}

function getDevelopmentCardDisabledReason({
  canBuy,
  pending,
  resources,
  supply,
}: {
  canBuy: boolean;
  pending: boolean;
  resources: Readonly<ResourceInventory>;
  supply: number;
}): string | null {
  if (pending) {
    return "Action in progress…";
  }
  if (supply <= 0) {
    return "No development cards remaining";
  }
  return (
    getMissingResourcesReason(DEVELOPMENT_CARD_COST, resources) ??
    (canBuy ? null : "Unavailable right now")
  );
}

function getMissingResourcesReason(
  cost: Readonly<ResourceInventory>,
  resources: Readonly<ResourceInventory>,
): string | null {
  const missingResources = RESOURCE_ORDER.flatMap((resource) => {
    const missingCount = Math.max(0, cost[resource] - resources[resource]);
    return missingCount > 0 ? [`${missingCount} ${RESOURCE_LABELS[resource]}`] : [];
  });
  return missingResources.length > 0 ? `Need ${missingResources.join(", ")}` : null;
}

function TurnClock({ botThinking, nextActionAt }: { botThinking: boolean; nextActionAt?: number }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!nextActionAt) {
      setNow(null);
      return;
    }

    const initialNow = Date.now();
    setNow(initialNow);
    if (initialNow >= nextActionAt) {
      return;
    }

    const timer = window.setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);
      if (currentNow >= nextActionAt) {
        window.clearInterval(timer);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [nextActionAt]);

  if (!nextActionAt) {
    return null;
  }

  const isExpired = now !== null && now >= nextActionAt;
  const seconds = now === null ? null : Math.max(0, Math.ceil((nextActionAt - now) / 1_000));
  const status = isExpired
    ? botThinking
      ? "Bot acting"
      : "Advancing"
    : botThinking
      ? "Bot thinking"
      : "Turn time";
  return (
    <div
      aria-label={
        isExpired
          ? botThinking
            ? "Bot acting"
            : "Turn expired, advancing"
          : seconds === null
            ? `${status}, timer starting`
            : `${status}, ${seconds} seconds remaining`
      }
      aria-live="off"
      className={`turn-clock${botThinking ? " is-bot" : ""}${isExpired ? " is-expired" : ""}`}
      role="timer"
    >
      {botThinking ? <Icon aria-hidden="true" icon={botIcon} /> : null}
      <span>{status}</span>
      <strong>{isExpired ? "…" : seconds === null ? "—" : `${seconds}s`}</strong>
    </div>
  );
}

function getPhaseStatusLabel(phase: PlayerGameView["phase"]): string {
  switch (phase.kind) {
    case "setup_settlement":
      return "Place settlement";
    case "setup_road":
      return "Place road";
    case "roll":
      return "Roll dice";
    case "discard":
      return "Discard cards";
    case "move_robber":
      return "Move robber";
    case "steal":
      return "Choose player";
    case "build_and_trade":
      return "Build & trade";
    case "finished":
      return "Game complete";
  }
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
                <Icon icon={crownIcon} />
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

function acquireSingleFlight(lock: { current: boolean }): boolean {
  if (lock.current) {
    return false;
  }

  lock.current = true;
  return true;
}
