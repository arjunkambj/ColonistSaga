import { describe, expect, test } from "bun:test";

import { createDefaultGame, getBoardTopology, type ResourceInventory } from "@colonistsaga/game";

import { parseGameState, serializeGameState } from "../convex/model/gameState";

const PLAYERS = ["one", "two", "three"].map((id) => ({
  displayName: id,
  id,
  isBot: false,
}));

const LEGACY_DEVELOPMENT_DECK = [
  ...Array.from({ length: 13 }, () => "knight"),
  ...Array.from({ length: 2 }, () => "monopoly"),
  ...Array.from({ length: 2 }, () => "road-building"),
  ...Array.from({ length: 5 }, () => "victory-point"),
  ...Array.from({ length: 2 }, () => "year-of-plenty"),
];

function serializedGame(): string {
  return JSON.stringify(
    createDefaultGame(PLAYERS, "backend-state-validation", {
      maxPlayers: 3,
      turnTimerSeconds: 0,
    }),
  );
}

describe("stored game-state parsing", () => {
  test("accepts a complete current game state", () => {
    const parsed = parseGameState(serializedGame());
    expect(parsed.version).toBe(2);
    expect(parsed.players.map((player) => player.id)).toEqual(["one", "two", "three"]);
  });

  test("strips unusable legacy cards without changing conserved resources", () => {
    const oldState = JSON.parse(serializedGame()) as Record<string, unknown> & {
      players: Record<string, unknown>[];
    };
    oldState.version = 1;
    oldState.developmentDeck = LEGACY_DEVELOPMENT_DECK;
    oldState.victoryPoints = 10;
    oldState.players[0]!.developmentCards = ["knight"];
    const resourcesBefore = structuredClone(oldState.players[0]!.resources) as ResourceInventory;
    const bankBefore = structuredClone(oldState.bank) as ResourceInventory;

    const parsed = parseGameState(JSON.stringify(oldState));
    expect(parsed.version).toBe(2);
    expect("developmentDeck" in parsed).toBe(false);
    expect("victoryPoints" in parsed).toBe(false);
    expect("developmentCards" in parsed.players[0]!).toBe(false);
    expect(JSON.stringify(parsed)).not.toContain("development");
    expect(parsed.players[0]!.resources).toEqual(resourcesBefore);
    expect(parsed.bank).toEqual(bankBefore);
  });

  test("keeps a reachable legacy game reconnectable when the bank is depleted", () => {
    const oldState = JSON.parse(serializedGame()) as Record<string, unknown> & {
      bank: Record<string, number>;
      players: (Record<string, unknown> & { resources: Record<string, number> })[];
    };
    oldState.version = 1;
    oldState.players[0]!.developmentCards = ["knight"];
    oldState.bank.sheep = 0;
    oldState.players[1]!.resources.sheep = 19;

    const parsed = parseGameState(JSON.stringify(oldState));
    expect(parsed.bank.sheep).toBe(0);
    expect(parsed.players[1]!.resources.sheep).toBe(19);
    expect("developmentCards" in parsed.players[0]!).toBe(false);
  });

  test("rejects unknown versions and legacy fields mislabeled as version 2", () => {
    const unknownVersion = JSON.parse(serializedGame()) as Record<string, unknown>;
    unknownVersion.version = 99;

    const mislabeledLegacy = JSON.parse(serializedGame()) as Record<string, unknown> & {
      players: Record<string, unknown>[];
    };
    mislabeledLegacy.developmentDeck = LEGACY_DEVELOPMENT_DECK;
    mislabeledLegacy.players[0]!.developmentCards = [];

    expect(() => parseGameState(JSON.stringify(unknownVersion))).toThrow();
    expect(() => parseGameState(JSON.stringify(mislabeledLegacy))).toThrow();
  });

  test("rejects unknown legacy cards and invalid legacy deck counts", () => {
    const unknownCard = JSON.parse(serializedGame()) as Record<string, unknown> & {
      players: Record<string, unknown>[];
    };
    unknownCard.version = 1;
    unknownCard.players[0]!.developmentCards = ["unknown-card"];

    const invalidDeck = JSON.parse(serializedGame()) as Record<string, unknown>;
    invalidDeck.version = 1;
    invalidDeck.developmentDeck = [];

    expect(() => parseGameState(JSON.stringify(unknownCard))).toThrow();
    expect(() => parseGameState(JSON.stringify(invalidDeck))).toThrow();
  });

  test("still rejects malformed and unknown-owner board pieces", () => {
    const malformed = createDefaultGame(PLAYERS, "malformed-piece", {
      maxPlayers: 3,
      turnTimerSeconds: 0,
    });
    const vertexKey = getBoardTopology(malformed.board.tiles).vertexKeys[0];
    if (!vertexKey) throw new Error("Test board needs a vertex");
    malformed.board.buildings = [{ kind: "castle" as never, playerId: PLAYERS[0]!.id, vertexKey }];

    const unknownOwner = createDefaultGame(PLAYERS, "unknown-piece-owner", {
      maxPlayers: 3,
      turnTimerSeconds: 0,
    });
    unknownOwner.board.buildings = [{ kind: "settlement", playerId: "missing-player", vertexKey }];

    expect(() => parseGameState(JSON.stringify(malformed))).toThrow();
    expect(() => parseGameState(JSON.stringify(unknownOwner))).toThrow();
    expect(() => serializeGameState(malformed)).toThrow();
  });
});
