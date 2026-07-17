import { describe, expect, it } from "vitest";

import { totalResources } from "./resources";
import { applyCommand, getBankTradeRatio, getLegalActions } from "./rules";
import { DEFAULT_TOPOLOGY } from "./topology";
import type { BuildingKind, GameState, PlayerId, PortDescriptor, ResourceType } from "./types";
import { createTestGame, inventory, transferFromBank } from "./test-helpers";

function enterTradePhase(): GameState {
  const state = createTestGame("port-trades");
  return { ...state, phase: { kind: "build_and_trade" as const } };
}

function withOwnedPort(
  state: GameState,
  playerId: PlayerId,
  trade: PortDescriptor["trade"],
  kind: BuildingKind = "settlement",
  endpoint = 0,
) {
  const port = state.board.ports.find((candidate) => candidate.trade === trade);
  const vertexKey = port ? DEFAULT_TOPOLOGY.edgeVertices[port.edgeKey]?.[endpoint] : undefined;

  if (!port || !vertexKey) {
    throw new Error(`Fixture requires a ${trade} port endpoint`);
  }

  return {
    ...state,
    board: {
      ...state.board,
      buildings: [...state.board.buildings, { kind, playerId, vertexKey }],
    },
  };
}

function fundTrade(state: GameState, playerId: PlayerId, give: ResourceType, amount: number) {
  return transferFromBank(state, playerId, inventory({ [give]: amount }));
}

function findTrade(
  state: GameState,
  playerId: PlayerId,
  give: ResourceType,
  receive: ResourceType,
) {
  return getLegalActions(state, playerId).bankTrades.find(
    (trade) => trade.give === give && trade.receive === receive,
  );
}

describe("bank and port trades", () => {
  it("uses a four-to-one ratio without an owned port", () => {
    let state = enterTradePhase();
    const playerId = state.activePlayerId;
    state = fundTrade(state, playerId, "brick", 4);

    expect(getBankTradeRatio(state, playerId, "brick")).toBe(4);
    expect(findTrade(state, playerId, "brick", "stone")).toEqual({
      give: "brick",
      ratio: 4,
      receive: "stone",
    });
  });

  it("uses a three-to-one ratio from an owned any-resource port", () => {
    let state = withOwnedPort(enterTradePhase(), "player-1", "any", "city", 1);
    const playerId = state.activePlayerId;
    state = fundTrade(state, playerId, "brick", 3);

    expect(getBankTradeRatio(state, playerId, "brick")).toBe(3);
    expect(findTrade(state, playerId, "brick", "stone")?.ratio).toBe(3);
  });

  it("prefers a matching two-to-one resource port over an any-resource port", () => {
    let state = enterTradePhase();
    const playerId = state.activePlayerId;
    state = withOwnedPort(state, playerId, "brick", "settlement", 1);
    state = withOwnedPort(state, playerId, "any");
    state = fundTrade(state, playerId, "brick", 2);

    expect(getBankTradeRatio(state, playerId, "brick")).toBe(2);
    expect(findTrade(state, playerId, "brick", "stone")?.ratio).toBe(2);
  });

  it("does not discount a nonmatching resource at a specific port", () => {
    let state = withOwnedPort(enterTradePhase(), "player-1", "sheep");
    const playerId = state.activePlayerId;
    state = fundTrade(state, playerId, "brick", 4);

    expect(getBankTradeRatio(state, playerId, "brick")).toBe(4);
    expect(findTrade(state, playerId, "brick", "stone")?.ratio).toBe(4);
  });

  it("charges the authoritative ratio and conserves bank and player cards", () => {
    let state = enterTradePhase();
    const playerId = state.activePlayerId;
    state = withOwnedPort(state, playerId, "wheat");
    state = fundTrade(state, playerId, "wheat", 2);
    const playerBefore = state.players.find((player) => player.id === playerId)!;
    const wheatBefore = state.bank.wheat + playerBefore.resources.wheat;
    const stoneBefore = state.bank.stone + playerBefore.resources.stone;

    const traded = applyCommand(state, playerId, {
      give: "wheat",
      kind: "trade_bank",
      receive: "stone",
    });
    const playerAfter = traded.players.find((player) => player.id === playerId)!;

    expect(playerAfter.resources.wheat).toBe(playerBefore.resources.wheat - 2);
    expect(playerAfter.resources.stone).toBe(playerBefore.resources.stone + 1);
    expect(traded.bank.wheat).toBe(state.bank.wheat + 2);
    expect(traded.bank.stone).toBe(state.bank.stone - 1);
    expect(traded.bank.wheat + playerAfter.resources.wheat).toBe(wheatBefore);
    expect(traded.bank.stone + playerAfter.resources.stone).toBe(stoneBefore);
    expect(totalResources(traded.bank) + totalResources(playerAfter.resources)).toBe(
      totalResources(state.bank) + totalResources(playerBefore.resources),
    );
  });

  it("rejects a direct command that cannot pay its calculated port ratio", () => {
    let state = enterTradePhase();
    const playerId = state.activePlayerId;
    state = withOwnedPort(state, playerId, "brick");
    state = fundTrade(state, playerId, "brick", 1);

    expect(findTrade(state, playerId, "brick", "stone")).toBeUndefined();
    expect(() =>
      applyCommand(state, playerId, {
        give: "brick",
        kind: "trade_bank",
        receive: "stone",
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_TRADE" }));
  });
});
