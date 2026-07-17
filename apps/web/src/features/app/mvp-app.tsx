"use client";

import { api } from "@catansaga/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  Bot,
  Check,
  Clipboard,
  Crown,
  Gamepad2,
  LogOut,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { GameScreen } from "@/features/game/game-screen";
import { parsePlayerView, type RoomView } from "@/features/game/types";
import {
  type GuestSession,
  isRoomCode,
  normalizeRoomCode,
  readGuestSession,
  writeGuestSession,
} from "@/lib/session";

type PendingAction = "create" | "join" | "leave" | "quick" | "replace" | "start" | null;

export function MvpApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRoom = searchParams.get("room");
  const [session, setSession] = useState<GuestSession | null>(null);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const createRoom = useMutation(api.mvp.createRoom);
  const joinRoom = useMutation(api.mvp.joinRoom);
  const createQuickGame = useMutation(api.mvp.createQuickGame);
  const leaveRoomMutation = useMutation(api.mvp.leaveRoom);
  const replacePlayerWithBot = useMutation(api.mvp.replacePlayerWithBot);
  const startGame = useMutation(api.mvp.startGame);

  useEffect(() => {
    const stored = readGuestSession(window.localStorage);
    const requestedCode = normalizeRoomCode(requestedRoom ?? "");
    const activeCode = isRoomCode(requestedCode) ? requestedCode : stored.activeCode;
    const restoredSession = { ...stored, activeCode };
    writeGuestSession(window.localStorage, restoredSession);
    setSession(restoredSession);
    if (activeCode && activeCode !== requestedCode) {
      router.replace(`/?room=${encodeURIComponent(activeCode)}`);
    }
  }, [requestedRoom, router]);

  const room = useQuery(
    api.mvp.getRoom,
    session?.activeCode ? { code: session.activeCode, sessionId: session.sessionId } : "skip",
  );

  if (!session) {
    return <FullPageStatus label="Restoring Your Seat…" />;
  }

  const updateSession = (update: (current: GuestSession) => GuestSession) => {
    setSession((current) => {
      if (!current) {
        return current;
      }
      const nextSession = update(current);
      writeGuestSession(window.localStorage, nextSession);
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
      await leaveRoomMutation({ code, sessionId: session.sessionId });
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

  const handleQuickPlay = async () => {
    const result = await perform("quick", () =>
      createQuickGame({
        displayName: cleanDisplayName(session.displayName),
        sessionId: session.sessionId,
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
        sessionId: session.sessionId,
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
        sessionId: session.sessionId,
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
    await perform("start", () => startGame({ code, sessionId: session.sessionId }));
  };

  const handleReplacePlayer = async (targetSeatId: string) => {
    const code = session.activeCode;
    if (!code) {
      return;
    }
    await perform("replace", async () => {
      await replacePlayerWithBot({ code, sessionId: session.sessionId, targetSeatId });
      return true;
    });
  };

  if (!session.activeCode) {
    return (
      <HomeScreen
        displayName={session.displayName}
        error={error}
        onCreateRoom={handleCreateRoom}
        onDisplayNameChange={updateDisplayName}
        onJoinRoom={handleJoinRoom}
        onQuickPlay={handleQuickPlay}
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
        onStart={handleStartGame}
        pendingAction={pendingAction}
        room={room}
      />
    );
  }

  const gameJson =
    "gameJson" in room && typeof room.gameJson === "string" ? room.gameJson : undefined;
  const game = parsePlayerView(gameJson);
  if (!game) {
    return (
      <NoticeScreen
        actionLabel="Leave Game"
        message="The live game payload could not be read. Refresh once, or leave and create a new game."
        onAction={leaveRoom}
        title="Game State Unavailable"
      />
    );
  }

  return (
    <GameScreen
      code={room.code}
      events={room.events ?? []}
      game={game}
      isHost={room.isHost}
      onLeave={leaveRoom}
      sessionId={session.sessionId}
    />
  );
}

interface HomeScreenProps {
  displayName: string;
  error: string;
  onCreateRoom(): Promise<void>;
  onDisplayNameChange(value: string): void;
  onJoinRoom(code: string): Promise<void>;
  onQuickPlay(): Promise<void>;
  pendingAction: PendingAction;
}

function HomeScreen({
  displayName,
  error,
  onCreateRoom,
  onDisplayNameChange,
  onJoinRoom,
  onQuickPlay,
  pendingAction,
}: HomeScreenProps) {
  const [joinCode, setJoinCode] = useState("");
  const isPending = pendingAction !== null;

  return (
    <main className="home-page" id="main-content">
      <div className="home-backdrop" aria-hidden="true">
        <span className="floating-hex hex-one" />
        <span className="floating-hex hex-two" />
        <span className="floating-hex hex-three" />
      </div>

      <header className="site-header">
        <Brand />
        <span className="status-pill">
          <span className="status-dot" /> Live Multiplayer
        </span>
      </header>

      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">
            <Sparkles size={16} aria-hidden="true" /> A New Island Every Game
          </p>
          <h1>Build Boldly. Trade Wisely. Rule the Island.</h1>
          <p className="hero-description">
            A polished four-player strategy game with quick turns, friendly bots, and a board made
            for every screen.
          </p>
          <ul className="feature-row" aria-label="Game features">
            <li>
              <Users aria-hidden="true" /> 4 Players
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
          <div>
            <p className="eyebrow">Your Seat</p>
            <h2>Ready to Explore?</h2>
          </div>

          <label className="field-label" htmlFor="display-name">
            Display Name
          </label>
          <input
            autoComplete="off"
            className="text-input"
            id="display-name"
            maxLength={24}
            name="displayName"
            onChange={(event) => onDisplayNameChange(event.target.value)}
            placeholder="Example: River Fox…"
            spellCheck={false}
            value={displayName}
          />

          <button
            className="button button-primary button-large"
            disabled={isPending || !displayName.trim()}
            onClick={onQuickPlay}
            type="button"
          >
            <Sparkles aria-hidden="true" />
            {pendingAction === "quick" ? "Preparing Game…" : "Quick Play"}
          </button>
          <p className="button-hint">Start instantly with three bots</p>

          <div className="divider" role="separator">
            <span>or play with friends</span>
          </div>

          <button
            className="button button-secondary"
            disabled={isPending || !displayName.trim()}
            onClick={onCreateRoom}
            type="button"
          >
            <Plus aria-hidden="true" />
            {pendingAction === "create" ? "Creating Room…" : "Create Private Room"}
          </button>

          <form
            className="join-form"
            onSubmit={(event) => {
              event.preventDefault();
              void onJoinRoom(joinCode);
            }}
          >
            <label className="sr-only" htmlFor="room-code">
              Room Code
            </label>
            <input
              autoComplete="off"
              className="text-input code-input"
              id="room-code"
              inputMode="text"
              maxLength={6}
              name="roomCode"
              onChange={(event) => setJoinCode(normalizeRoomCode(event.target.value))}
              placeholder="Room code…"
              spellCheck={false}
              value={joinCode}
            />
            <button
              className="button button-quiet"
              disabled={isPending || !isRoomCode(joinCode) || !displayName.trim()}
              type="submit"
            >
              {pendingAction === "join" ? "Joining…" : "Join Room"}
            </button>
          </form>

          <LiveMessage message={error} />
        </div>
      </section>
    </main>
  );
}

function LobbyScreen({
  error,
  onLeave,
  onReplacePlayer,
  onStart,
  pendingAction,
  room,
}: {
  error: string;
  onLeave(): Promise<void>;
  onReplacePlayer(targetSeatId: string): Promise<void>;
  onStart(): Promise<void>;
  pendingAction: PendingAction;
  room: RoomView;
}) {
  const [copied, setCopied] = useState(false);
  const seats = Array.from({ length: 4 }, (_, index) => room.members[index]);

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
        <button
          className="button button-quiet"
          disabled={pendingAction !== null}
          onClick={onLeave}
          type="button"
        >
          <LogOut aria-hidden="true" />
          {pendingAction === "leave" ? "Leaving…" : "Leave Room"}
        </button>
      </header>

      <section className="lobby-card" aria-labelledby="lobby-title">
        <p className="eyebrow">Private Base Game</p>
        <h1 id="lobby-title">Gather Your Crew</h1>
        <p>Share this room code, or start now and let bots fill the open seats.</p>

        <button
          aria-label={`Copy room code ${room.code}`}
          className="invite-code"
          onClick={copyCode}
          type="button"
        >
          <span>{room.code}</span>
          {copied ? <Check aria-hidden="true" /> : <Clipboard aria-hidden="true" />}
          <small>{copied ? "Copied" : "Copy Code"}</small>
        </button>

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
                    "Bot joins at start"
                  )}
                </span>
              </div>
              {room.isHost && member?.controller === "player" && member.role !== "host" ? (
                <button
                  aria-label={`Replace ${member.displayName} with a bot`}
                  className="seat-kick"
                  disabled={pendingAction !== null}
                  onClick={() => void onReplacePlayer(member.id)}
                  type="button"
                >
                  <Bot aria-hidden="true" />
                  {pendingAction === "replace" ? "Replacing…" : "Use Bot"}
                </button>
              ) : null}
            </li>
          ))}
        </ol>

        {room.isHost ? (
          <button
            className="button button-primary button-large"
            disabled={pendingAction !== null}
            onClick={onStart}
            type="button"
          >
            <Gamepad2 aria-hidden="true" />
            {pendingAction === "start" ? "Building the Island…" : "Start Game"}
          </button>
        ) : (
          <p className="waiting-callout" role="status">
            Waiting for the host to start…
          </p>
        )}
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
  message,
  onAction,
  title,
}: {
  actionLabel: string;
  message: string;
  onAction(): void;
  title: string;
}) {
  return (
    <main className="centered-page notice-card" id="main-content">
      <Brand />
      <h1>{title}</h1>
      <p>{message}</p>
      <button className="button button-primary" onClick={onAction} type="button">
        {actionLabel}
      </button>
    </main>
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

function toActionableError(cause: unknown): string {
  const message = cause instanceof Error ? cause.message : "Something went wrong.";
  const normalizedMessage = message.toLowerCase();
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
