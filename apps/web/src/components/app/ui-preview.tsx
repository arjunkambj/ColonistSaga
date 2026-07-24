"use client";

import {
  applyCommand,
  assertGameState,
  assertPlayerGameView,
  createDefaultGame,
  emptyInventory,
  getLegalActions,
  RESOURCE_TYPES,
  toPlayerView,
  type GamePlayerInput,
  type GameState,
  type ResourceInventory,
} from "@colonistsaga/game";
import Image from "next/image";
import { useEffect, useState } from "react";

import { AuthScreenView } from "@/components/auth/auth-screen";
import { ActionTile } from "@/components/game/action-tile";
import { GameScreen } from "@/components/game/game-screen";
import { HomeScreen } from "@/components/home/home-screen";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { ACTION_CARD_ASSET_PATHS } from "@/constants/game/card-assets";
import type { RoomEventView } from "@/lib/game/types";

export type UiPreviewMode =
  | "action-preset"
  | "auth"
  | "game"
  | "game-actions"
  | "game-setup"
  | "home";

const PREVIEW_MODES = new Set<UiPreviewMode>([
  "action-preset",
  "auth",
  "game",
  "game-actions",
  "game-setup",
  "home",
]);

const GAME_PREVIEW_MODES = new Set<UiPreviewMode>(["game", "game-actions", "game-setup"]);

const PREVIEW_PLAYERS: GamePlayerInput[] = [
  { displayName: "Arjun Kamboj", id: "player-1", isBot: false },
  { displayName: "Bot 2", id: "player-2", isBot: true },
  { displayName: "Bot 3", id: "player-3", isBot: true },
  { displayName: "Bot 4", id: "player-4", isBot: true },
];

export function isUiPreviewMode(value: string | null): value is UiPreviewMode {
  return value !== null && PREVIEW_MODES.has(value as UiPreviewMode);
}

export function isGamePreviewMode(mode: UiPreviewMode): boolean {
  return GAME_PREVIEW_MODES.has(mode);
}

export function UiPreview({ mode }: { mode: UiPreviewMode }) {
  const [previewDeadline, setPreviewDeadline] = useState<number>();

  useEffect(() => {
    if (!isGamePreviewMode(mode)) {
      setPreviewDeadline(undefined);
      return;
    }

    setPreviewDeadline(Date.now() + 45_000);
  }, [mode]);

  if (mode === "auth") {
    return <AuthScreenView onSignIn={async () => undefined} />;
  }

  if (mode === "home") {
    return (
      <HomeScreen
        accountLabel="Level 24"
        displayName="Arjun Kamboj"
        error=""
        musicVolume={35}
        onCreateRoom={async () => undefined}
        onDisplayNameChange={() => undefined}
        onJoinRoom={async () => undefined}
        onMusicVolumeChange={() => undefined}
        onQuickPlay={async () => undefined}
        onSignOut={async () => undefined}
        pendingAction={null}
        profileImageUrl="/game-assets/players/red-navigator.png"
      />
    );
  }

  if (mode === "action-preset") {
    return <ActionPresetPreview />;
  }

  return (
    <GameScreen
      botThinking={false}
      code="NW9C4B"
      events={PREVIEW_EVENTS}
      game={
        mode === "game-setup"
          ? createSetupPreviewGame()
          : createPreviewGame(mode === "game-actions")
      }
      isHost
      nextActionAt={previewDeadline}
      onLeave={async () => undefined}
      viewerProfileImageUrl="/game-assets/players/red-navigator.png"
    />
  );
}

function ActionPresetPreview() {
  return (
    <main className="action-preset-preview reference-game" id="main-content">
      <LiquidGlass
        as="section"
        aria-labelledby="action-preset-title"
        className="action-preset-preview__panel"
        kind="panel"
        radius="lg"
      >
        <header className="action-preset-preview__heading">
          <p>Reusable UI preset</p>
          <h1 id="action-preset-title">Action cards</h1>
          <span>The same component scales from the live dock to this poster treatment.</span>
        </header>
        <div className="action-preset-preview__row">
          {ACTION_PRESET_TILES.map((tile) => (
            <ActionTile
              ariaLabel={`${tile.title} action-card preset`}
              art={
                <Image
                  alt=""
                  className="action-art action-card-art"
                  draggable={false}
                  height={512}
                  loading="eager"
                  sizes="7.5rem"
                  src={tile.src}
                  width={512}
                />
              }
              caption={tile.caption}
              count={tile.count}
              disabled={tile.unavailable}
              key={tile.kind}
              kind={tile.kind}
              meta={tile.meta}
              onPress={() => undefined}
              size="poster"
              title={tile.title}
              unavailable={tile.unavailable}
            />
          ))}
        </div>
      </LiquidGlass>
    </main>
  );
}

interface ActionPresetPreviewTile {
  caption: string;
  count?: number | string;
  kind: string;
  meta: string;
  src: string;
  title: string;
  unavailable?: boolean;
}

const ACTION_PRESET_TILES: readonly ActionPresetPreviewTile[] = [
  {
    caption: "Bank or players",
    kind: "trade",
    meta: "Open market",
    src: ACTION_CARD_ASSET_PATHS.trade,
    title: "Trade",
  },
  {
    caption: "Place on a glowing edge",
    count: 13,
    kind: "road",
    meta: "1 wood · 1 brick",
    src: ACTION_CARD_ASSET_PATHS.road,
    title: "Road",
  },
  {
    caption: "Build on a legal corner",
    count: 3,
    kind: "settlement",
    meta: "Wood · brick · sheep · wheat",
    src: ACTION_CARD_ASSET_PATHS.settlement,
    title: "Settlement",
  },
  {
    caption: "Upgrade a settlement",
    count: 4,
    kind: "city",
    meta: "2 wheat · 3 stone",
    src: ACTION_CARD_ASSET_PATHS.city,
    title: "City",
  },
  {
    caption: "Pass play clockwise",
    kind: "end-turn",
    meta: "Turn complete",
    src: "/game-assets/ui/end-turn-hourglass.png",
    title: "End Turn",
  },
];

function createPreviewGame(showActions: boolean) {
  let state = completePreviewSetup(
    createDefaultGame(PREVIEW_PLAYERS, "reference-ui-preview", {
      balancedDice: false,
      friendlyRobber: false,
      victoryPoints: 10,
    }),
  );
  const resources: ResourceInventory = {
    ...emptyInventory(),
    brick: 1,
    sheep: 2,
    stone: 1,
    tree: 3,
    wheat: 2,
  };
  const viewer = state.players.find((player) => player.id === "player-1");
  if (!viewer) throw new Error("Preview game requires its viewer");
  const bank = { ...state.bank };
  for (const resource of RESOURCE_TYPES) {
    bank[resource] -= resources[resource] - viewer.resources[resource];
  }

  state = {
    ...state,
    activePlayerId: "player-1",
    bank,
    lastDiceRoll: showActions ? { first: 3, second: 5, sum: 8 } : null,
    phase: showActions ? { kind: "build_and_trade" } : { kind: "roll" },
    players: state.players.map((player) => ({
      ...player,
      resources: player.id === "player-1" ? resources : player.resources,
    })),
    turnNumber: 5,
  };

  assertGameState(state);
  const view = toPlayerView(state, "player-1");
  assertPlayerGameView(view);
  return view;
}

function createSetupPreviewGame() {
  return toPlayerView(
    createDefaultGame(PREVIEW_PLAYERS, "reference-setup-preview", {
      balancedDice: false,
      friendlyRobber: false,
      victoryPoints: 10,
    }),
    "player-1",
  );
}

function completePreviewSetup(initialState: GameState) {
  let state = initialState;

  while (state.phase.kind === "setup_settlement" || state.phase.kind === "setup_road") {
    const actorPlayerId = state.activePlayerId;
    const legal = getLegalActions(state, actorPlayerId);

    if (state.phase.kind === "setup_settlement") {
      const vertexKey = legal.settlementVertexKeys[0];
      if (!vertexKey) {
        break;
      }
      state = applyCommand(state, actorPlayerId, { kind: "place_settlement", vertexKey });
      continue;
    }

    const edgeKey = legal.roadEdgeKeys[0];
    if (!edgeKey) {
      break;
    }
    state = applyCommand(state, actorPlayerId, { edgeKey, kind: "place_road" });
  }

  return state;
}

const PREVIEW_EVENT_ANCHOR = Date.UTC(2026, 6, 19, 22, 30);
const PREVIEW_EVENTS: RoomEventView[] = [
  "Arjun placed a Settlement",
  "Arjun received starting resources",
  "Arjun placed a Road",
  "Bot 2 placed a Settlement",
  "Bot 2 received starting resources",
  "Bot 3 placed a Road",
  "Bot 4 placed a Settlement",
  "Bot 4 received starting resources",
].map((text, index) => ({
  createdAt: PREVIEW_EVENT_ANCHOR - (8 - index) * 60_000,
  sequence: index + 1,
  text,
}));
