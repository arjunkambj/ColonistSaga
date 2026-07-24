import { describe, expect, it } from "vitest";

import { DEVELOPMENT_CARD_COST, DEVELOPMENT_CARD_COUNTS } from "./constants";
import { createDevelopmentCardDeck } from "./development-cards";
import { applyCommand, getLegalActions } from "./rules";
import { toPlayerView } from "./views";
import { completeSetup, transferFromBank } from "./test-helpers";

describe("development cards", () => {
  it("creates the standard deterministic 25-card deck", () => {
    const first = createDevelopmentCardDeck("deck-seed");
    const second = createDevelopmentCardDeck("deck-seed");

    expect(first).toEqual(second);
    expect(first).toHaveLength(25);
    for (const [type, count] of Object.entries(DEVELOPMENT_CARD_COUNTS)) {
      expect(first.filter((card) => card === type)).toHaveLength(count);
    }
  });

  it("charges the cost and privately adds the top card to the buyer's hand", () => {
    const setup = completeSetup();
    const playerId = setup.activePlayerId;
    const funded = transferFromBank({ ...setup, phase: { kind: "build_and_trade" } }, playerId, {
      ...DEVELOPMENT_CARD_COST,
    });
    const expectedCard = funded.developmentDeck[0];

    expect(getLegalActions(funded, playerId).canBuyDevelopmentCard).toBe(true);

    const purchased = applyCommand(funded, playerId, { kind: "buy_development_card" });
    const buyer = purchased.players.find((player) => player.id === playerId)!;
    const opponentId = purchased.players.find((player) => player.id !== playerId)!.id;
    const buyerView = toPlayerView(purchased, playerId);
    const opponentView = toPlayerView(purchased, opponentId);

    for (const resource of Object.keys(DEVELOPMENT_CARD_COST) as Array<
      keyof typeof DEVELOPMENT_CARD_COST
    >) {
      expect(buyer.resources[resource]).toBe(
        funded.players.find((player) => player.id === playerId)!.resources[resource] -
          DEVELOPMENT_CARD_COST[resource],
      );
    }
    expect(buyer.developmentCards).toEqual([expectedCard]);
    expect(purchased.developmentDeck).toHaveLength(funded.developmentDeck.length - 1);
    expect(buyerView.players.find((player) => player.id === playerId)).toMatchObject({
      developmentCardCount: 1,
      developmentCards: [expectedCard],
    });
    expect(opponentView.players.find((player) => player.id === playerId)).toMatchObject({
      developmentCardCount: 1,
    });
    expect(opponentView.players.find((player) => player.id === playerId)).not.toHaveProperty(
      "developmentCards",
    );
  });

  it("rejects purchases before rolling, without resources, or from an empty deck", () => {
    const setup = completeSetup();
    const playerId = setup.activePlayerId;

    expect(() => applyCommand(setup, playerId, { kind: "buy_development_card" })).toThrowError(
      expect.objectContaining({ code: "INVALID_PHASE" }),
    );

    const buildPhase = { ...setup, phase: { kind: "build_and_trade" as const } };
    expect(getLegalActions(buildPhase, playerId).canBuyDevelopmentCard).toBe(false);
    expect(() => applyCommand(buildPhase, playerId, { kind: "buy_development_card" })).toThrowError(
      expect.objectContaining({ code: "INSUFFICIENT_RESOURCES" }),
    );

    const emptyDeck = transferFromBank({ ...buildPhase, developmentDeck: [] }, playerId, {
      ...DEVELOPMENT_CARD_COST,
    });
    expect(() => applyCommand(emptyDeck, playerId, { kind: "buy_development_card" })).toThrowError(
      expect.objectContaining({ code: "INVALID_COMMAND" }),
    );
  });
});
