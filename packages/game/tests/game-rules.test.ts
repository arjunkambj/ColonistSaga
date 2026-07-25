import { describe, expect, test } from "bun:test";

import {
  BUILD_COSTS,
  GAME_MAP_IDS,
  GameRuleError,
  RESOURCE_TYPES,
  applyCommand,
  chooseAutomatedCommand,
  createDefaultGame,
  emptyInventory,
  getBoardTopology,
  getLegalActions,
  getRequiredPlayerIds,
  mapSupportsPlayerCount,
  type GameState,
  type ResourceInventory,
} from "../src/index";

const PLAYERS = Array.from({ length: 4 }, (_, index) => ({
  botDifficulty: "hard" as const,
  displayName: `Bot ${index + 1}`,
  id: `player-${index + 1}`,
  isBot: true,
}));

function createGame(seed: string) {
  return createDefaultGame(PLAYERS, seed, {
    maxPlayers: 4,
    turnTimerSeconds: 0,
    victoryPoints: 10,
  });
}

function cityReadyState(ownerId = PLAYERS[0]!.id): { state: GameState; vertexKey: string } {
  const state = createGame("city-upgrade");
  const vertexKey = getBoardTopology(state.board.tiles).vertexKeys[0]!;
  const resources = { ...BUILD_COSTS.city };

  return {
    state: {
      ...state,
      activePlayerId: PLAYERS[0]!.id,
      bank: RESOURCE_TYPES.reduce<ResourceInventory>(
        (bank, resource) => {
          bank[resource] -= resources[resource];
          return bank;
        },
        { ...state.bank },
      ),
      board: {
        ...state.board,
        buildings: [{ kind: "settlement", playerId: ownerId, vertexKey }],
      },
      phase: { kind: "build_and_trade" },
      players: state.players.map((player) =>
        player.id === PLAYERS[0]!.id
          ? {
              ...player,
              piecesRemaining: { ...player.piecesRemaining, settlements: 4 },
              resources,
              victoryPoints: ownerId === player.id ? 1 : 0,
            }
          : player.id === ownerId
            ? {
                ...player,
                piecesRemaining: { ...player.piecesRemaining, settlements: 4 },
                victoryPoints: 1,
              }
            : player,
      ),
      turnNumber: 1,
    },
    vertexKey,
  };
}

function expectRuleError(action: () => unknown, code: GameRuleError["code"]) {
  try {
    action();
    throw new Error(`Expected ${code}`);
  } catch (error) {
    expect(error).toBeInstanceOf(GameRuleError);
    expect((error as GameRuleError).code).toBe(code);
  }
}

function expectConservedState(state: GameState) {
  const occupiedVertices = new Set<string>();
  for (const building of state.board.buildings) {
    expect(occupiedVertices.has(building.vertexKey)).toBe(false);
    occupiedVertices.add(building.vertexKey);
  }

  const occupiedEdges = new Set<string>();
  for (const road of state.board.roads) {
    expect(occupiedEdges.has(road.edgeKey)).toBe(false);
    occupiedEdges.add(road.edgeKey);
  }

  for (const player of state.players) {
    const buildings = state.board.buildings.filter((building) => building.playerId === player.id);
    const settlementCount = buildings.filter((building) => building.kind === "settlement").length;
    const cityCount = buildings.filter((building) => building.kind === "city").length;
    const roadCount = state.board.roads.filter((road) => road.playerId === player.id).length;

    expect(player.piecesRemaining.settlements + settlementCount).toBe(5);
    expect(player.piecesRemaining.cities + cityCount).toBe(4);
    expect(player.piecesRemaining.roads + roadCount).toBe(15);
    expect(player.victoryPoints).toBe(settlementCount + cityCount * 2);
  }

  for (const resource of RESOURCE_TYPES) {
    const playerCards = state.players.reduce(
      (total, player) => total + player.resources[resource],
      0,
    );
    expect(state.bank[resource] + playerCards).toBe(19);
  }
}

describe("city upgrades", () => {
  test("a bot upgrades only its persisted settlement and pays the full cost", () => {
    const { state, vertexKey } = cityReadyState();

    expect(chooseAutomatedCommand(state, PLAYERS[0]!.id)).toEqual({
      kind: "build_city",
      vertexKey,
    });

    const next = applyCommand(state, PLAYERS[0]!.id, { kind: "build_city", vertexKey });
    const player = next.players[0]!;

    expect(next.board.buildings).toEqual([{ kind: "city", playerId: PLAYERS[0]!.id, vertexKey }]);
    expect(player.resources).toEqual(emptyInventory());
    expect(player.piecesRemaining).toEqual({ cities: 3, roads: 15, settlements: 5 });
    expect(player.victoryPoints).toBe(2);
    expectConservedState(next);
  });

  test("an empty vertex or an opponent settlement cannot become a city", () => {
    const empty = cityReadyState();
    empty.state.board.buildings = [];
    empty.state.players[0]!.piecesRemaining.settlements = 5;
    empty.state.players[0]!.victoryPoints = 0;

    expectRuleError(
      () =>
        applyCommand(empty.state, PLAYERS[0]!.id, {
          kind: "build_city",
          vertexKey: empty.vertexKey,
        }),
      "INVALID_LOCATION",
    );

    const opponent = cityReadyState(PLAYERS[1]!.id);
    expectRuleError(
      () =>
        applyCommand(opponent.state, PLAYERS[0]!.id, {
          kind: "build_city",
          vertexKey: opponent.vertexKey,
        }),
      "INVALID_LOCATION",
    );
  });
});

describe("command boundary", () => {
  test("rejects the removed development-card command without spending resources", () => {
    const { state } = cityReadyState();
    const playerId = PLAYERS[0]!.id;
    const resourcesBefore = { ...state.players[0]!.resources };

    expect("canBuyDevelopmentCard" in getLegalActions(state, playerId)).toBe(false);
    expectRuleError(
      () => applyCommand(state, playerId, { kind: "buy_development_card" } as never),
      "INVALID_COMMAND",
    );
    expect(state.players[0]!.resources).toEqual(resourcesBefore);
  });
});

describe("trade offers", () => {
  test("spending offered resources cancels the offer and stale bots reject it", () => {
    const cityReady = cityReadyState();
    const state: GameState = {
      ...cityReady.state,
      bank: { ...cityReady.state.bank, brick: cityReady.state.bank.brick - 1 },
      players: cityReady.state.players.map((player) =>
        player.id === PLAYERS[1]!.id
          ? { ...player, resources: { ...player.resources, brick: 1 } }
          : player,
      ),
    };
    const proposed = applyCommand(state, PLAYERS[0]!.id, {
      give: { brick: 0, sheep: 0, stone: 1, tree: 0, wheat: 0 },
      kind: "propose_trade",
      recipientPlayerIds: [PLAYERS[1]!.id],
      want: { brick: 1, sheep: 0, stone: 0, tree: 0, wheat: 0 },
    });
    const stale = {
      ...proposed,
      players: proposed.players.map((player) =>
        player.id === PLAYERS[0]!.id
          ? { ...player, resources: { ...player.resources, stone: 0 } }
          : player,
      ),
    };
    const offerActionNumber = proposed.tradeOffer?.offerActionNumber;
    if (offerActionNumber === undefined) throw new Error("Trade offer needs an action number");

    expect(chooseAutomatedCommand(stale, PLAYERS[1]!.id)).toEqual({
      accept: false,
      kind: "respond_trade",
      offerActionNumber,
    });

    const next = applyCommand(proposed, PLAYERS[0]!.id, {
      kind: "build_city",
      vertexKey: cityReady.vertexKey,
    });
    expect(next.tradeOffer).toBeNull();
    expectConservedState(next);
  });
});

describe("friendly robber", () => {
  test("falls back to the desert when protection leaves no other legal tile", () => {
    let state = createGame("fr7:58");

    while (state.phase.kind === "setup_settlement" || state.phase.kind === "setup_road") {
      const actorPlayerId = getRequiredPlayerIds(state)[0];
      if (!actorPlayerId) throw new Error("Setup requires an actor");
      state = applyCommand(state, actorPlayerId, chooseAutomatedCommand(state, actorPlayerId));
    }

    const protectingVertexKeys = [
      "vertex:-1:-3",
      "vertex:-5:-1",
      "vertex:-5:1",
      "vertex:-5:3",
      "vertex:1:1",
      "vertex:1:3",
      "vertex:4:-2",
      "vertex:5:1",
    ];
    state = {
      ...state,
      board: {
        ...state.board,
        buildings: state.board.buildings.map((building, index) => ({
          ...building,
          vertexKey: protectingVertexKeys[index] ?? building.vertexKey,
        })),
      },
    };

    state = applyCommand(state, state.activePlayerId, { kind: "roll" });
    expect(state.lastDiceRoll?.sum).toBe(7);
    expect(state.phase.kind).toBe("move_robber");

    const currentTileId = state.board.robberTileId;
    const legalTileIds = getLegalActions(state, state.activePlayerId).robberTileIds;
    expect(legalTileIds).toEqual([currentTileId]);

    const next = applyCommand(state, state.activePlayerId, {
      kind: "move_robber",
      tileId: currentTileId,
    });
    expect(next.board.robberTileId).toBe(currentTileId);
  });
});

describe("maps and turn limits", () => {
  test("each supported map exposes only its intended player counts", () => {
    expect(GAME_MAP_IDS).toEqual(["base", "extended-6", "extended-8"]);
    expect([3, 4, 5, 6, 7, 8].filter((count) => mapSupportsPlayerCount("base", count))).toEqual([
      3, 4,
    ]);
    expect(
      [3, 4, 5, 6, 7, 8].filter((count) => mapSupportsPlayerCount("extended-6", count)),
    ).toEqual([5, 6]);
    expect(
      [3, 4, 5, 6, 7, 8].filter((count) => mapSupportsPlayerCount("extended-8", count)),
    ).toEqual([7, 8]);

    expectRuleError(
      () =>
        createDefaultGame(
          [
            ...PLAYERS,
            {
              botDifficulty: "hard",
              displayName: "Bot 5",
              id: "player-5",
              isBot: true,
            } as const,
          ],
          "invalid-map-size",
          { map: "base", maxPlayers: 5 },
        ),
      "INVALID_COMMAND",
    );
  });

  test("ending turn 500 continues to the next player", () => {
    const state: GameState = {
      ...createGame("long-game"),
      phase: { kind: "build_and_trade" },
      turnNumber: 500,
    };
    const next = applyCommand(state, PLAYERS[0]!.id, { kind: "end_turn" });

    expect(next.status).toBe("active");
    expect(next.phase).toEqual({ kind: "roll" });
    expect(next.activePlayerId).toBe(PLAYERS[1]!.id);
    expect(next.turnNumber).toBe(501);
    expect(next.winnerPlayerId).toBeNull();
  });
});

describe("automated decisions", () => {
  test("a human timeout never spends cards on an optional build", () => {
    const { state } = cityReadyState();
    state.players[0]!.isBot = false;
    state.players[0]!.botDifficulty = undefined;

    expect(chooseAutomatedCommand(state, PLAYERS[0]!.id)).toEqual({ kind: "end_turn" });
  });

  test("easy bots use targeted trades instead of cycling or starving forever", () => {
    const players = Array.from({ length: 3 }, (_, index) => ({
      botDifficulty: "easy" as const,
      displayName: `Easy Bot ${index + 1}`,
      id: `easy-player-${index + 1}`,
      isBot: true,
    }));
    let state = createDefaultGame(players, "audit:base:easy:0", {
      map: "base",
      maxPlayers: 3,
      turnTimerSeconds: 0,
      victoryPoints: 10,
    });

    for (let step = 0; step < 2_000 && state.status !== "completed"; step += 1) {
      const actorPlayerId = getRequiredPlayerIds(state)[0];
      if (!actorPlayerId) throw new Error("Automated game requires an actor");
      state = applyCommand(state, actorPlayerId, chooseAutomatedCommand(state, actorPlayerId));
    }

    expect(state.status).toBe("completed");
    expect(state.winnerPlayerId).not.toBeNull();
    expectConservedState(state);
  });

  test("complete bot games preserve legality after every action", () => {
    for (let gameIndex = 0; gameIndex < 4; gameIndex += 1) {
      let state = createGame(`rules-audit-${gameIndex}`);

      for (let step = 0; step < 5_000 && state.status !== "completed"; step += 1) {
        const actorPlayerId = getRequiredPlayerIds(state).find(
          (playerId) => state.players.find((player) => player.id === playerId)?.isBot,
        );
        expect(actorPlayerId).toBeDefined();

        const command = chooseAutomatedCommand(state, actorPlayerId!);
        if (command.kind === "build_city") {
          expect(state.board.buildings).toContainEqual({
            kind: "settlement",
            playerId: actorPlayerId!,
            vertexKey: command.vertexKey,
          });
        }

        const previousActionNumber = state.actionNumber;
        state = applyCommand(state, actorPlayerId!, command);
        expect(state.actionNumber).toBe(previousActionNumber + 1);
        expectConservedState(state);
      }

      expect(state.status).toBe("completed");
    }
  });
});
