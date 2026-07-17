"use client";

import { api } from "@catansaga/backend/convex/_generated/api";
import { DEFAULT_BASE_GAME_SETTINGS, type BaseGameSettings } from "@catansaga/game";
import { useHexclaveApp, useUser } from "@hexclave/next";
import { Button, Input, Label, Modal, TextField } from "@heroui/react";
import { useMutation, useQuery } from "convex/react";
import {
  Bot,
  Check,
  Clipboard,
  Crown,
  Gamepad2,
  LogIn,
  LogOut,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ConfirmationDialog } from "@/features/app/confirmation-dialog";
import { GameScreen } from "@/features/game/game-screen";
import { parsePlayerView, type RoomView } from "@/features/game/types";
import {
  LobbySettings,
  type BotCount,
  type LobbySettingsValue,
} from "@/features/lobby/lobby-settings";
import {
  type PlayerSession,
  isRoomCode,
  normalizeRoomCode,
  readPlayerSession,
  writePlayerSession,
} from "@/lib/session";

type PendingAction =
  | "create"
  | "join"
  | "leave"
  | "quick"
  | "replace"
  | "settings"
  | "signout"
  | "start"
  | null;

type LobbyConfirmation =
  | { kind: "leave" }
  | { displayName: string; kind: "replace"; targetSeatId: string };

export function MvpApp() {
  const user = useUser();

  if (!user || user.isAnonymous || user.isRestricted) {
    return <AuthScreen />;
  }

  const accountLabel = user.displayName ?? user.primaryEmail ?? "Signed-in player";
  const defaultDisplayName = cleanDisplayName(
    user.displayName ?? user.primaryEmail?.split("@")[0] ?? "Explorer",
  );

  return (
    <AuthenticatedMvpApp
      accountLabel={accountLabel}
      defaultDisplayName={defaultDisplayName}
      onSignOut={() => user.signOut({ redirectUrl: "/" })}
      userId={user.id}
    />
  );
}

function AuthenticatedMvpApp({
  accountLabel,
  defaultDisplayName,
  onSignOut,
  userId,
}: {
  accountLabel: string;
  defaultDisplayName: string;
  onSignOut(): Promise<void>;
  userId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRoom = searchParams.get("room");
  const [session, setSession] = useState<PlayerSession | null>(null);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const createRoom = useMutation(api.mvp.createRoom);
  const joinRoom = useMutation(api.mvp.joinRoom);
  const createQuickGame = useMutation(api.mvp.createQuickGame);
  const leaveRoomMutation = useMutation(api.mvp.leaveRoom);
  const replacePlayerWithBot = useMutation(api.mvp.replacePlayerWithBot);
  const updateLobbyConfiguration = useMutation(api.mvp.updateLobbyConfiguration);
  const startGame = useMutation(api.mvp.startGame);

  useEffect(() => {
    const stored = readPlayerSession(window.localStorage, userId, defaultDisplayName);
    const requestedCode = normalizeRoomCode(requestedRoom ?? "");
    const activeCode = isRoomCode(requestedCode) ? requestedCode : stored.activeCode;
    const restoredSession = { ...stored, activeCode };
    writePlayerSession(window.localStorage, restoredSession);
    setSession(restoredSession);
    if (activeCode && activeCode !== requestedCode) {
      router.replace(`/?room=${encodeURIComponent(activeCode)}`);
    }
  }, [defaultDisplayName, requestedRoom, router, userId]);

  const room = useQuery(
    api.mvp.getRoom,
    session?.activeCode ? { code: session.activeCode } : "skip",
  );

  if (!session) {
    return <FullPageStatus label="Restoring Your Seat…" />;
  }

  const updateSession = (update: (current: PlayerSession) => PlayerSession) => {
    setSession((current) => {
      if (!current) {
        return current;
      }
      const nextSession = update(current);
      writePlayerSession(window.localStorage, nextSession);
      return nextSession;
    });
  };

  const updateDisplayName = (displayName: string) => {
    updateSession((current) => ({ ...current, displayName }));
  };

  const enterRoom = (code: string) => {
    const normalizedCode = normalizeRoomCode(code);
    if (!isRoomCode(normalizedCode)) {
      setError("The room code could not be read. Create a new room and try again.");
      return;
    }
    updateSession((current) => ({ ...current, activeCode: normalizedCode }));
    router.replace(`/?room=${encodeURIComponent(normalizedCode)}`);
  };

  const exitRoomLocally = () => {
    updateSession((current) => {
      const { activeCode: _activeCode, ...nextSession } = current;
      return nextSession;
    });
    setError("");
    router.replace("/");
  };

  const leaveRoom = async () => {
    const code = session.activeCode;
    if (!code || room === null || room?.status === "completed") {
      exitRoomLocally();
      return;
    }

    const left = await perform("leave", async () => {
      await leaveRoomMutation({ code });
      return true;
    });
    if (left) {
      exitRoomLocally();
    }
  };

  const perform = async <Result,>(
    action: Exclude<PendingAction, null>,
    work: () => Promise<Result>,
  ): Promise<Result | null> => {
    setError("");
    setPendingAction(action);
    try {
      return await work();
    } catch (cause) {
      setError(toActionableError(cause));
      return null;
    } finally {
      setPendingAction(null);
    }
  };

  const handleQuickPlay = async ({ botCount, botDifficulty, settings }: LobbySettingsValue) => {
    const result = await perform("quick", () =>
      createQuickGame({
        botCount,
        botDifficulty,
        displayName: cleanDisplayName(session.displayName),
        settings,
      }),
    );
    if (result) {
      enterRoom(result.code);
    }
  };

  const handleCreateRoom = async () => {
    const result = await perform("create", () =>
      createRoom({
        displayName: cleanDisplayName(session.displayName),
      }),
    );
    if (result) {
      enterRoom(result.code);
    }
  };

  const handleJoinRoom = async (code: string) => {
    const result = await perform("join", () =>
      joinRoom({
        code: normalizeRoomCode(code),
        displayName: cleanDisplayName(session.displayName),
      }),
    );
    if (result) {
      enterRoom(result.code);
    }
  };

  const handleStartGame = async () => {
    const code = session.activeCode;
    if (!code) {
      return;
    }
    await perform("start", () => startGame({ code }));
  };

  const handleReplacePlayer = async (targetSeatId: string) => {
    const code = session.activeCode;
    if (!code) {
      return;
    }
    await perform("replace", async () => {
      await replacePlayerWithBot({ code, targetSeatId });
      return true;
    });
  };

  const handleRoomSettings = async ({ botCount, botDifficulty, settings }: LobbySettingsValue) => {
    const code = session.activeCode;
    if (!code) {
      return;
    }
    await perform("settings", async () => {
      await updateLobbyConfiguration({
        botCount,
        botDifficulty,
        code,
        settings,
      });
      return true;
    });
  };

  if (!session.activeCode) {
    return (
      <HomeScreen
        accountLabel={accountLabel}
        displayName={session.displayName}
        error={error}
        onCreateRoom={handleCreateRoom}
        onDisplayNameChange={updateDisplayName}
        onJoinRoom={handleJoinRoom}
        onQuickPlay={handleQuickPlay}
        onSignOut={() => perform("signout", onSignOut)}
        pendingAction={pendingAction}
      />
    );
  }

  if (room === undefined) {
    return <FullPageStatus label="Joining the Island…" />;
  }

  if (room === null) {
    return (
      <NoticeScreen
        actionLabel="Return Home"
        message="This invite may have expired. Check the code and try again."
        onAction={leaveRoom}
        title="Room Not Found"
      />
    );
  }

  if (room.status === "waiting") {
    return (
      <LobbyScreen
        error={error}
        onLeave={leaveRoom}
        onReplacePlayer={handleReplacePlayer}
        onSaveSettings={handleRoomSettings}
        onStart={handleStartGame}
        pendingAction={pendingAction}
        room={room}
      />
    );
  }

  const game = parsePlayerView(room.gameJson);
  if (!game) {
    return (
      <NoticeScreen
        actionLabel="Leave Game"
        confirmation={{
          confirmLabel: "Leave Game",
          description:
            "You cannot reclaim this seat after leaving. A bot will take over, or the game will close if no human players remain.",
          title: "Leave this game?",
        }}
        message="The live game payload could not be read. Refresh once, or leave and create a new game."
        onAction={leaveRoom}
        title="Game State Unavailable"
      />
    );
  }

  return (
    <GameScreen
      botThinking={room.botThinking}
      code={room.code}
      events={room.events}
      game={game}
      isHost={room.isHost}
      nextActionAt={room.nextActionAt}
      onLeave={leaveRoom}
    />
  );
}

interface HomeScreenProps {
  accountLabel: string;
  displayName: string;
  error: string;
  onCreateRoom(): Promise<void>;
  onDisplayNameChange(value: string): void;
  onJoinRoom(code: string): Promise<void>;
  onQuickPlay(value: LobbySettingsValue): Promise<void>;
  onSignOut(): Promise<void | null>;
  pendingAction: PendingAction;
}

function HomeScreen({
  accountLabel,
  displayName,
  error,
  onCreateRoom,
  onDisplayNameChange,
  onJoinRoom,
  onQuickPlay,
  onSignOut,
  pendingAction,
}: HomeScreenProps) {
  const [joinCode, setJoinCode] = useState("");
  const [showBotSetup, setShowBotSetup] = useState(false);
  const [quickSettings, setQuickSettings] = useState<LobbySettingsValue>({
    botCount: 3,
    botDifficulty: "medium",
    settings: { ...DEFAULT_BASE_GAME_SETTINGS },
  });
  const isPending = pendingAction !== null;

  return (
    <main className="home-page" id="main-content">
      <div className="home-backdrop" aria-hidden="true">
        <Image
          alt=""
          className="home-scenery"
          fill
          priority
          sizes="100vw"
          src="/home-assets/island-bay-v1.webp"
        />
      </div>

      <header className="site-header">
        <Brand />
        <div className="home-header-actions">
          <span className="status-pill">
            <span aria-hidden="true" className="status-dot" /> {accountLabel}
          </span>
          <Button
            className="button button-quiet home-sign-out"
            isPending={pendingAction === "signout"}
            onPress={() => void onSignOut()}
          >
            <LogOut aria-hidden="true" /> Sign Out
          </Button>
        </div>
      </header>

      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">
            <Sparkles size={16} aria-hidden="true" /> A New Island Every Game
          </p>
          <h1>Build Boldly. Trade Wisely. Rule the Island.</h1>
          <p className="hero-description">
            A polished three- or four-player strategy game with quick turns, friendly bots, and a
            board made for every screen.
          </p>
          <ul className="feature-row" aria-label="Game features">
            <li>
              <Users aria-hidden="true" /> 3–4 Players
            </li>
            <li>
              <Bot aria-hidden="true" /> Smart Bots
            </li>
            <li>
              <Gamepad2 aria-hidden="true" /> 10-Point Game
            </li>
          </ul>
        </div>

        <div className="play-card">
          <div className="play-card-heading">
            <p className="eyebrow">Your Seat</p>
            <h2>Choose Your Voyage</h2>
            <p>Set your name, then pick how you want to reach the island.</p>
          </div>

          <TextField
            fullWidth
            name="displayName"
            onChange={onDisplayNameChange}
            value={displayName}
          >
            <Label className="field-label">Display Name</Label>
            <Input
              autoComplete="off"
              className="text-input"
              id="display-name"
              maxLength={24}
              placeholder="Example: River Fox…"
              spellCheck={false}
            />
          </TextField>

          <form
            className="join-code-form"
            id="join-room-form"
            onSubmit={(event) => {
              event.preventDefault();
              void onJoinRoom(joinCode);
            }}
          >
            <TextField
              name="roomCode"
              onChange={(value) => setJoinCode(normalizeRoomCode(value))}
              value={joinCode}
            >
              <Label className="field-label">Friend Room Code</Label>
              <Input
                autoComplete="off"
                className="text-input code-input"
                id="room-code"
                inputMode="text"
                maxLength={6}
                placeholder="Room code…"
                spellCheck={false}
              />
            </TextField>
          </form>

          <div aria-label="Ways to play" className="home-menu-grid" role="group">
            <Button
              aria-controls="bot-setup-dialog"
              aria-expanded={showBotSetup}
              aria-haspopup="dialog"
              className="home-menu-tile home-menu-quick"
              isDisabled={isPending || !displayName.trim()}
              onPress={() => setShowBotSetup(true)}
              variant="ghost"
            >
              <span className="home-menu-art">
                <Image
                  alt=""
                  aria-hidden="true"
                  height={512}
                  src="/home-assets/menu/quick-match.png"
                  width={512}
                />
              </span>
              <strong>{pendingAction === "quick" ? "Preparing…" : "Quick Match"}</strong>
              <small>Customize 2–3 bots</small>
            </Button>

            <Button
              className="home-menu-tile home-menu-host"
              isDisabled={isPending || !displayName.trim()}
              onPress={onCreateRoom}
              variant="ghost"
            >
              <span className="home-menu-art">
                <Image
                  alt=""
                  aria-hidden="true"
                  height={512}
                  src="/home-assets/menu/host-island.png"
                  width={512}
                />
              </span>
              <strong>{pendingAction === "create" ? "Opening…" : "Host Island"}</strong>
              <small>Create a private room</small>
            </Button>

            <Button
              className="home-menu-tile home-menu-join"
              isDisabled={isPending || !isRoomCode(joinCode) || !displayName.trim()}
              form="join-room-form"
              type="submit"
              variant="ghost"
            >
              <span className="home-menu-art">
                <Image
                  alt=""
                  aria-hidden="true"
                  height={512}
                  src="/home-assets/menu/join-crew.png"
                  width={512}
                />
              </span>
              <strong>{pendingAction === "join" ? "Joining…" : "Join Crew"}</strong>
              <small>Use a friend code</small>
            </Button>
          </div>

          <LiveMessage message={error} />
        </div>
      </section>

      <Modal>
        <Modal.Backdrop
          className="setup-backdrop"
          isDismissable={!isPending}
          isKeyboardDismissDisabled={isPending}
          isOpen={showBotSetup}
          onOpenChange={(isOpen) => {
            if (!isOpen && !isPending) {
              setShowBotSetup(false);
            }
          }}
        >
          <Modal.Container>
            <Modal.Dialog className="setup-dialog" id="bot-setup-dialog">
              <Modal.Header className="setup-dialog-header">
                <div>
                  <p className="eyebrow">Bot Game</p>
                  <Modal.Heading id="bot-setup-title">Set Up Your Table</Modal.Heading>
                  <p id="bot-setup-description">
                    Pick the standard rules and bot challenge before the island is built.
                  </p>
                </div>
                <Button
                  aria-label="Close bot game setup"
                  className="setup-close"
                  isDisabled={isPending}
                  isIconOnly
                  onPress={() => setShowBotSetup(false)}
                  variant="ghost"
                >
                  ×
                </Button>
              </Modal.Header>
              <Modal.Body className="setup-dialog-body">
                <LobbySettings
                  botCount={quickSettings.botCount}
                  botDifficulty={quickSettings.botDifficulty}
                  disabled={isPending}
                  humanCount={1}
                  minBotCount={2}
                  onChange={(value) =>
                    setQuickSettings((current) => normalizeQuickSettings(current, value))
                  }
                  settings={quickSettings.settings}
                />
              </Modal.Body>
              <p className="setup-note">
                Bot games fill every open seat: choose two bots for a 3-player table or three bots
                for a 4-player table.
              </p>
              <Modal.Footer>
                <Button
                  className="button button-primary button-large setup-start"
                  isDisabled={isPending}
                  isPending={pendingAction === "quick"}
                  onPress={() => void onQuickPlay(quickSettings)}
                >
                  <Bot aria-hidden="true" />
                  {pendingAction === "quick" ? "Building the Island…" : "Start Bot Game"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </main>
  );
}

function LobbyScreen({
  error,
  onLeave,
  onReplacePlayer,
  onSaveSettings,
  onStart,
  pendingAction,
  room,
}: {
  error: string;
  onLeave(): Promise<void>;
  onReplacePlayer(targetSeatId: string): Promise<void>;
  onSaveSettings(value: LobbySettingsValue): Promise<void>;
  onStart(): Promise<void>;
  pendingAction: PendingAction;
  room: RoomView;
}) {
  const [copied, setCopied] = useState(false);
  const [confirmation, setConfirmation] = useState<LobbyConfirmation | null>(null);
  const botCount = room.members.filter((member) => member.controller === "bot").length as BotCount;
  const [settingsDraft, setSettingsDraft] = useState<LobbySettingsValue>(() => ({
    botCount,
    botDifficulty: room.botDifficulty,
    settings: room.settings,
  }));
  const seats = Array.from({ length: room.settings.maxPlayers }, (_, index) =>
    room.members.find((member) => member.seatIndex === index),
  );
  const humanCount = room.members.length - botCount;
  const settingsAreSaved = sameLobbySettings(settingsDraft, room);
  const tableIsFull = room.members.length === room.settings.maxPlayers;
  const startHint = !settingsAreSaved
    ? "Save game settings before starting."
    : !tableIsFull
      ? `Fill all ${room.settings.maxPlayers} seats with players or bots before starting.`
      : "";

  useEffect(() => {
    setSettingsDraft({
      botCount,
      botDifficulty: room.botDifficulty,
      settings: room.settings,
    });
  }, [
    botCount,
    humanCount,
    room.botDifficulty,
    room.settings.balancedDice,
    room.settings.discardLimit,
    room.settings.friendlyRobber,
    room.settings.hideBankCards,
    room.settings.maxPlayers,
    room.settings.turnTimerSeconds,
    room.settings.victoryPoints,
  ]);

  const runConfirmedAction = async () => {
    if (!confirmation) {
      return;
    }
    if (confirmation.kind === "leave") {
      await onLeave();
    } else {
      await onReplacePlayer(confirmation.targetSeatId);
    }
    setConfirmation(null);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="lobby-page" id="main-content">
      <header className="site-header lobby-header">
        <Brand />
        <Button
          className="button button-quiet"
          isDisabled={pendingAction !== null}
          onPress={() => setConfirmation({ kind: "leave" })}
          variant="ghost"
        >
          <LogOut aria-hidden="true" />
          {pendingAction === "leave" ? "Leaving…" : "Leave Room"}
        </Button>
      </header>

      <section className="lobby-card" aria-labelledby="lobby-title">
        <p className="eyebrow">Private Base Game</p>
        <h1 id="lobby-title">Gather Your Crew</h1>
        <p>Share this room code, then configure every open seat before starting.</p>

        <Button
          aria-label={`Copy room code ${room.code}`}
          className="invite-code"
          onPress={copyCode}
          variant="ghost"
        >
          <span translate="no">{room.code}</span>
          {copied ? <Check aria-hidden="true" /> : <Clipboard aria-hidden="true" />}
          <small aria-live="polite">{copied ? "Copied" : "Copy Code"}</small>
        </Button>

        <ol className="seat-grid" aria-label="Player seats">
          {seats.map((member, index) => (
            <li
              className={`seat-card ${member ? `player-${member.playerColor}` : "seat-empty"}`}
              key={index}
            >
              <span className="seat-avatar" aria-hidden="true">
                {member ? member.displayName.slice(0, 1).toUpperCase() : index + 1}
              </span>
              <div>
                <strong>{member?.displayName ?? "Open Seat"}</strong>
                <span>
                  {member?.role === "host" ? (
                    <>
                      <Crown aria-hidden="true" /> Host
                    </>
                  ) : member ? (
                    "Ready"
                  ) : (
                    "Configure a player or bot seat"
                  )}
                </span>
              </div>
              {room.isHost && member?.controller === "player" && member.role !== "host" ? (
                <Button
                  aria-label={`Replace ${member.displayName} with a bot`}
                  className="seat-kick"
                  isDisabled={pendingAction !== null}
                  onPress={() =>
                    setConfirmation({
                      displayName: member.displayName,
                      kind: "replace",
                      targetSeatId: member.id,
                    })
                  }
                  variant="secondary"
                >
                  <Bot aria-hidden="true" />
                  {pendingAction === "replace" ? "Replacing…" : "Use Bot"}
                </Button>
              ) : null}
            </li>
          ))}
        </ol>

        <LobbySettings
          botCount={settingsDraft.botCount}
          botDifficulty={settingsDraft.botDifficulty}
          disabled={!room.isHost || pendingAction !== null}
          humanCount={humanCount}
          onChange={setSettingsDraft}
          settings={settingsDraft.settings}
        />

        {room.isHost ? (
          <Button
            className="button button-secondary lobby-save-settings"
            isDisabled={pendingAction !== null || settingsAreSaved}
            isPending={pendingAction === "settings"}
            onPress={() => void onSaveSettings(settingsDraft)}
            variant="secondary"
          >
            {pendingAction === "settings" ? "Saving Settings…" : "Save Game Settings"}
          </Button>
        ) : null}

        {room.isHost ? (
          <>
            {startHint ? (
              <p className="lobby-start-hint" id="start-game-hint">
                {startHint}
              </p>
            ) : null}
            <Button
              aria-describedby={startHint ? "start-game-hint" : undefined}
              className="button button-primary button-large"
              isDisabled={pendingAction !== null || Boolean(startHint)}
              isPending={pendingAction === "start"}
              onPress={onStart}
            >
              <Gamepad2 aria-hidden="true" />
              {pendingAction === "start" ? "Building the Island…" : "Start Game"}
            </Button>
          </>
        ) : (
          <p className="waiting-callout" role="status">
            Waiting for the host to start…
          </p>
        )}
        <LiveMessage message={error} />
      </section>
      {confirmation ? (
        <ConfirmationDialog
          busy={pendingAction !== null}
          confirmLabel={confirmation.kind === "leave" ? "Leave Room" : "Use Bot"}
          description={
            confirmation.kind === "leave"
              ? room.isHost
                ? "Leaving now closes this waiting room for everyone in it."
                : "Leaving now frees your seat for another player or bot."
              : `${confirmation.displayName} will immediately lose control of this seat, and a bot will take over.`
          }
          onCancel={() => setConfirmation(null)}
          onConfirm={() => void runConfirmedAction()}
          title={confirmation.kind === "leave" ? "Leave this room?" : "Replace this player?"}
        />
      ) : null}
    </main>
  );
}

function AuthScreen() {
  const hexclave = useHexclaveApp();
  const [pending, setPending] = useState<"signin" | "signup" | null>(null);
  const [error, setError] = useState("");

  const redirectToAuth = async (kind: "signin" | "signup") => {
    if (pending) {
      return;
    }

    setError("");
    setPending(kind);
    try {
      if (kind === "signin") {
        await hexclave.redirectToSignIn();
      } else {
        await hexclave.redirectToSignUp();
      }
    } catch {
      setError("Authentication could not be opened. Check your connection and try again.");
      setPending(null);
    }
  };

  return (
    <main className="home-page auth-page" id="main-content">
      <div className="home-backdrop" aria-hidden="true">
        <Image
          alt=""
          className="home-scenery"
          fill
          priority
          sizes="100vw"
          src="/home-assets/island-bay-v1.webp"
        />
      </div>
      <header className="site-header">
        <Brand />
        <span className="status-pill">
          <ShieldCheck aria-hidden="true" /> Account-secured play
        </span>
      </header>
      <section className="auth-panel" aria-labelledby="auth-title">
        <p className="eyebrow">
          <Sparkles aria-hidden="true" /> Your Island Awaits
        </p>
        <h1 id="auth-title">Build, trade, and reconnect from any device.</h1>
        <p>Sign in to keep every room seat tied to your account and protected by Hexclave.</p>
        <div className="auth-actions">
          <Button
            className="button button-primary button-large"
            isPending={pending === "signin"}
            onPress={() => void redirectToAuth("signin")}
          >
            <LogIn aria-hidden="true" /> Sign In
          </Button>
          <Button
            className="button button-secondary button-large"
            isPending={pending === "signup"}
            onPress={() => void redirectToAuth("signup")}
          >
            <UserPlus aria-hidden="true" /> Create Account
          </Button>
        </div>
        <LiveMessage message={error} />
      </section>
    </main>
  );
}

function Brand() {
  return (
    <div className="brand" translate="no">
      <span className="brand-mark" aria-hidden="true">
        C
      </span>
      <span>
        <strong>CATAN</strong>
        <small>SAGA</small>
      </span>
    </div>
  );
}

function FullPageStatus({ label }: { label: string }) {
  return (
    <main className="centered-page" id="main-content">
      <div className="loading-mark" aria-hidden="true" />
      <p role="status">{label}</p>
    </main>
  );
}

function NoticeScreen({
  actionLabel,
  confirmation,
  message,
  onAction,
  title,
}: {
  actionLabel: string;
  confirmation?: {
    confirmLabel: string;
    description: string;
    title: string;
  };
  message: string;
  onAction(): Promise<void> | void;
  title: string;
}) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [runningAction, setRunningAction] = useState(false);

  const runAction = async () => {
    if (runningAction) {
      return;
    }
    setRunningAction(true);
    try {
      await onAction();
      setShowConfirmation(false);
    } finally {
      setRunningAction(false);
    }
  };

  return (
    <>
      <main className="centered-page notice-card" id="main-content">
        <Brand />
        <h1>{title}</h1>
        <p>{message}</p>
        <Button
          className="button button-primary"
          isPending={runningAction}
          onPress={() => (confirmation ? setShowConfirmation(true) : void runAction())}
        >
          {actionLabel}
        </Button>
      </main>
      {confirmation && showConfirmation ? (
        <ConfirmationDialog
          busy={runningAction}
          confirmLabel={confirmation.confirmLabel}
          description={confirmation.description}
          onCancel={() => setShowConfirmation(false)}
          onConfirm={() => void runAction()}
          title={confirmation.title}
        />
      ) : null}
    </>
  );
}

function LiveMessage({ message }: { message: string }) {
  return (
    <p aria-live="polite" className={message ? "form-message is-error" : "form-message"}>
      {message}
    </p>
  );
}

function cleanDisplayName(value: string): string {
  return value.trim().slice(0, 24) || "Explorer";
}

function sameLobbySettings(value: LobbySettingsValue, room: RoomView): boolean {
  const roomBotCount = room.members.filter((member) => member.controller === "bot").length;
  return (
    value.botCount === roomBotCount &&
    value.botDifficulty === room.botDifficulty &&
    Object.entries(value.settings).every(
      ([key, setting]) => room.settings[key as keyof BaseGameSettings] === setting,
    )
  );
}

function normalizeQuickSettings(
  current: LobbySettingsValue,
  next: LobbySettingsValue,
): LobbySettingsValue {
  if (next.settings.maxPlayers !== current.settings.maxPlayers) {
    return {
      ...next,
      botCount: next.settings.maxPlayers === 4 ? 3 : 2,
    };
  }

  const botCount: BotCount = next.botCount >= 3 ? 3 : 2;
  return {
    ...next,
    botCount,
    settings: {
      ...next.settings,
      maxPlayers: botCount === 3 ? 4 : 3,
    },
  };
}

function toActionableError(cause: unknown): string {
  const message = cause instanceof Error ? cause.message : "Something went wrong.";
  const normalizedMessage = message.toLowerCase();
  if (
    normalizedMessage.includes("too_many_players") ||
    normalizedMessage.includes("more human players")
  ) {
    return "Remove or replace a player before reducing the table to three seats.";
  }
  if (normalizedMessage.includes("room full")) {
    return "That room already has four players. Ask the host for a new room code.";
  }
  if (normalizedMessage.includes("not found") || normalizedMessage.includes("room code")) {
    return "That room could not be found. Check the six-character code and try again.";
  }
  if (normalizedMessage.includes("already started")) {
    return "That game has already started. Ask the host to create a new room.";
  }
  if (normalizedMessage.includes("only the room host")) {
    return "Only the room host can start this game.";
  }
  return "The request could not be completed. Check your connection and try again.";
}
