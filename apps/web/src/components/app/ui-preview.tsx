"use client";

import {
  applyCommand,
  createDefaultGame,
  emptyInventory,
  getLegalActions,
  toPlayerView,
  type GamePlayerInput,
  type GameState,
  type ResourceInventory,
} from "@colonistsaga/game";

import { AuthScreenView } from "@/components/auth/auth-screen";
import { ActionTile } from "@/components/game/action-tile";
import { GameScreen } from "@/components/game/game-screen";
import { getPieceAssetPath } from "@/components/game/piece-icon";
import { HomeScreen } from "@/components/home/home-screen";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import type { RoomEventView } from "@/lib/game/types";

export type UiPreviewMode = "action-preset" | "auth" | "game" | "game-actions" | "home";

const PREVIEW_MODES = new Set<UiPreviewMode>([
  "action-preset",
  "auth",
  "game",
  "game-actions",
  "home",
]);

export function isUiPreviewMode(value: string | null): value is UiPreviewMode {
  return value !== null && PREVIEW_MODES.has(value as UiPreviewMode);
}

export function UiPreview({ mode }: { mode: UiPreviewMode }) {
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
        profileImageUrl="/game-assets/players/red-navigator-v1.png"
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
      game={createPreviewGame(mode === "game-actions")}
      isHost
      nextActionAt={Date.now() + 45_000}
      onLeave={async () => undefined}
      viewerProfileImageUrl="/game-assets/players/red-navigator-v1.png"
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
                <img
                  alt=""
                  className="action-art"
                  draggable={false}
                  height={256}
                  src={tile.src}
                  width={256}
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

const ACTION_PRESET_TILES = [
  {
    caption: "Bank or players",
    kind: "trade",
    meta: "Open market",
    src: "/game-assets/ui/market-trade-v1.png",
    title: "Trade",
  },
  {
    caption: "Not in ruleset",
    count: "—",
    kind: "development-deck",
    meta: "Deck preview",
    src: "/game-assets/ui/development-deck-v1.avif",
    title: "Dev Deck",
    unavailable: true,
  },
  {
    caption: "Place on a glowing edge",
    count: 13,
    kind: "road",
    meta: "1 wood · 1 brick",
    src: getPieceAssetPath("road"),
    title: "Road",
  },
  {
    caption: "Build on a legal corner",
    count: 3,
    kind: "settlement",
    meta: "Wood · brick · sheep · wheat",
    src: getPieceAssetPath("settlement"),
    title: "Settlement",
  },
  {
    caption: "Upgrade a settlement",
    count: 4,
    kind: "city",
    meta: "2 wheat · 3 stone",
    src: getPieceAssetPath("city"),
    title: "City",
  },
  {
    caption: "Pass play clockwise",
    kind: "end-turn",
    meta: "Turn complete",
    src: "/game-assets/ui/end-turn-hourglass-v1.png",
    title: "End Turn",
  },
] satisfies readonly ActionPresetPreviewTile[];

function createPreviewGame(showActions: boolean) {
  const players: GamePlayerInput[] = [
    { displayName: "Arjun Kamboj", id: "player-1", isBot: false },
    { displayName: "Bot 2", id: "player-2", isBot: true },
    { displayName: "Bot 3", id: "player-3", isBot: true },
    { displayName: "Bot 4", id: "player-4", isBot: true },
  ];
  let state = completePreviewSetup(
    createDefaultGame(players, "reference-ui-preview", {
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

  state = {
    ...state,
    activePlayerId: "player-1",
    lastDiceRoll: showActions ? { first: 3, second: 5, sum: 8 } : null,
    phase: showActions ? { kind: "build_and_trade" } : { kind: "roll" },
    players: state.players.map((player, index) => ({
      ...player,
      resources: player.id === "player-1" ? resources : player.resources,
      victoryPoints: [3, 2, 2, 4][index] ?? player.victoryPoints,
    })),
    turnNumber: 5,
  };

  return toPlayerView(state, "player-1");
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

const previewNow = Date.now();
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
  createdAt: previewNow - (8 - index) * 60_000,
  sequence: index + 1,
  text,
}));
