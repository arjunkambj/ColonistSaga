import assert from "node:assert/strict";
import { access, stat } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  createDefaultGame,
  emptyInventory,
  toPlayerView,
  type GamePlayerInput,
} from "@colonistsaga/game";
import { ConvexProvider, type ConvexReactClient } from "convex/react";
import NextImage from "next/image";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { DevelopmentCardReferenceGallery } from "@/components/game/development-deck-guide";
import { GameScreen } from "@/components/game/game-screen";

import {
  ACTION_CARD_ASSET_PATHS,
  DEVELOPMENT_CARD_ASSETS,
  GAME_CARD_ASSET_PATHS,
  GAME_CARD_RUNTIME_ASSET_PATHS,
  RESOURCE_CARD_ASSET_PATHS,
} from "./card-assets.ts";

const PUBLIC_DIRECTORY = fileURLToPath(new URL("../../../public", import.meta.url));

test("defines one unique runtime path for every generated game card", () => {
  assert.equal(Object.keys(RESOURCE_CARD_ASSET_PATHS).length, 5);
  assert.equal(Object.keys(ACTION_CARD_ASSET_PATHS).length, 5);
  assert.equal(DEVELOPMENT_CARD_ASSETS.length, 5);
  assert.equal(GAME_CARD_ASSET_PATHS.length, 16);
  assert.equal(new Set(GAME_CARD_ASSET_PATHS).size, GAME_CARD_ASSET_PATHS.length);
  assert.equal(new Set(GAME_CARD_RUNTIME_ASSET_PATHS).size, GAME_CARD_ASSET_PATHS.length);
  assert.ok(GAME_CARD_RUNTIME_ASSET_PATHS.every((path) => path.endsWith(".webp")));
});

test("every generated card source and gameplay rendition exists in the public asset pack", async () => {
  await Promise.all(
    [...GAME_CARD_ASSET_PATHS, ...GAME_CARD_RUNTIME_ASSET_PATHS].map((path) =>
      access(`${PUBLIC_DIRECTORY}${path}`),
    ),
  );
});

test("the live game screen and development reference render every generated card", () => {
  normalizeNextImageForNodeRenderer();
  const gameMarkup = renderToStaticMarkup(
    createElement(
      ConvexProvider,
      { client: TEST_CONVEX_CLIENT },
      createElement(GameScreen, {
        botThinking: false,
        code: "CARD16",
        events: [],
        game: createCardCoverageGame(),
        isHost: true,
        onLeave: async () => undefined,
        viewerProfileImageUrl: null,
      }),
    ),
  );
  const referenceMarkup = renderToStaticMarkup(createElement(DevelopmentCardReferenceGallery));
  const renderedCardPaths = new Set(
    [
      ...gameMarkup.matchAll(/data-card-asset="([^"]+)"/g),
      ...referenceMarkup.matchAll(/data-card-asset="([^"]+)"/g),
    ].map(([, path]) => path),
  );

  assert.deepEqual([...renderedCardPaths].sort(), [...GAME_CARD_ASSET_PATHS].sort());
});

test("the complete gameplay card rendition pack stays below one megabyte", async () => {
  const files = await Promise.all(
    GAME_CARD_RUNTIME_ASSET_PATHS.map((path) => stat(`${PUBLIC_DIRECTORY}${path}`)),
  );
  const totalBytes = files.reduce((total, file) => total + file.size, 0);

  assert.ok(
    totalBytes < 1_000_000,
    `Expected runtime card pack below 1 MB, received ${totalBytes}`,
  );
});

const TEST_PLAYERS: readonly GamePlayerInput[] = [
  { displayName: "Player 1", id: "player-1", isBot: false },
  { displayName: "Player 2", id: "player-2", isBot: true },
  { displayName: "Player 3", id: "player-3", isBot: true },
];

const TEST_CONVEX_CLIENT = {
  mutation: async () => undefined,
} as unknown as ConvexReactClient;

function createCardCoverageGame() {
  const initialGame = createDefaultGame([...TEST_PLAYERS], "card-coverage", {
    balancedDice: false,
    friendlyRobber: false,
    victoryPoints: 10,
  });
  const resources = {
    ...emptyInventory(),
    brick: 4,
    sheep: 4,
    stone: 4,
    tree: 4,
    wheat: 4,
  };

  return toPlayerView(
    {
      ...initialGame,
      lastDiceRoll: { first: 3, second: 4, sum: 7 },
      phase: { kind: "build_and_trade" },
      players: initialGame.players.map((player) =>
        player.id === "player-1" ? { ...player, resources } : player,
      ),
    },
    "player-1",
  );
}

function normalizeNextImageForNodeRenderer() {
  const imageModule = NextImage as unknown as {
    $$typeof?: symbol;
    default?: object;
  };

  if (!imageModule.$$typeof && imageModule.default) {
    Object.assign(imageModule, imageModule.default);
  }
}
