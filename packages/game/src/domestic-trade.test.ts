import { describe, expect, it } from "vitest";

import { RESOURCE_TYPES } from "./types";
import { applyCommand, getLegalActions, getRequiredPlayerIds } from "./rules";
import { totalResources } from "./resources";
import { createTestGame, inventory, transferFromBank } from "./test-helpers";
import type { GameState, ResourceType } from "./types";

function tradeFixture() {
  let state: GameState = {
    ...createTestGame("domestic-trade"),
    phase: { kind: "build_and_trade" },
  };
  const [proposer, firstRecipient, secondRecipient] = state.players;
  if (!proposer || !firstRecipient || !secondRecipient) {
    throw new Error("Domestic trade fixture requires three players");
  }

  state = transferFromBank(state, proposer.id, inventory({ brick: 2 }));
  state = transferFromBank(state, firstRecipient.id, inventory({ wheat: 2 }));
  state = transferFromBank(state, secondRecipient.id, inventory({ wheat: 2 }));
  return { firstRecipient, proposer, secondRecipient, state };
}

function resourceTotal(state: GameState, resource: ResourceType) {
  return (
    state.bank[resource] +
    state.players.reduce((total, player) => total + player.resources[resource], 0)
  );
}

describe("domestic trades", () => {
  it("publishes an exact offer and atomically transfers cards to the first accepter", () => {
    const fixture = tradeFixture();
    const totalsBefore = Object.fromEntries(
      RESOURCE_TYPES.map((resource) => [resource, resourceTotal(fixture.state, resource)]),
    );
    const offered = applyCommand(fixture.state, fixture.proposer.id, {
      give: inventory({ brick: 1 }),
      kind: "propose_trade",
      recipientPlayerIds: [fixture.firstRecipient.id, fixture.secondRecipient.id],
      want: inventory({ wheat: 1 }),
    });

    expect(offered.tradeOffer).toEqual({
      give: inventory({ brick: 1 }),
      offerActionNumber: offered.actionNumber,
      proposerPlayerId: fixture.proposer.id,
      recipientPlayerIds: [fixture.firstRecipient.id, fixture.secondRecipient.id],
      rejectedPlayerIds: [],
      want: inventory({ wheat: 1 }),
    });
    expect(getRequiredPlayerIds(offered)).toEqual([
      fixture.proposer.id,
      fixture.firstRecipient.id,
      fixture.secondRecipient.id,
    ]);
    expect(getLegalActions(offered, fixture.proposer.id).canCancelTrade).toBe(true);
    expect(getLegalActions(offered, fixture.proposer.id).canProposeTrade).toBe(false);
    expect(getLegalActions(offered, fixture.firstRecipient.id).canRespondToTrade).toBe(true);
    expect(getLegalActions(offered, fixture.firstRecipient.id).canEndTurn).toBe(false);

    const accepted = applyCommand(offered, fixture.firstRecipient.id, {
      accept: true,
      kind: "respond_trade",
      offerActionNumber: offered.tradeOffer!.offerActionNumber,
    });
    const proposer = accepted.players.find((player) => player.id === fixture.proposer.id)!;
    const recipient = accepted.players.find((player) => player.id === fixture.firstRecipient.id)!;

    expect(accepted.tradeOffer).toBeNull();
    expect(proposer.resources).toEqual(inventory({ brick: 1, wheat: 1 }));
    expect(recipient.resources).toEqual(inventory({ brick: 1, wheat: 1 }));
    expect(totalResources(accepted.bank)).toBe(totalResources(offered.bank));
    for (const resource of RESOURCE_TYPES) {
      expect(resourceTotal(accepted, resource)).toBe(totalsBefore[resource]);
    }
    expect(() =>
      applyCommand(accepted, fixture.secondRecipient.id, {
        accept: true,
        kind: "respond_trade",
        offerActionNumber: offered.actionNumber,
      }),
    ).toThrowError(expect.objectContaining({ code: "NOT_REQUIRED_ACTOR" }));
  });

  it("tracks rejections and closes after the final recipient rejects", () => {
    const fixture = tradeFixture();
    let state = applyCommand(fixture.state, fixture.proposer.id, {
      give: inventory({ brick: 1 }),
      kind: "propose_trade",
      recipientPlayerIds: [fixture.firstRecipient.id, fixture.secondRecipient.id],
      want: inventory({ wheat: 1 }),
    });
    const offerActionNumber = state.tradeOffer!.offerActionNumber;

    state = applyCommand(state, fixture.firstRecipient.id, {
      accept: false,
      kind: "respond_trade",
      offerActionNumber,
    });
    expect(state.tradeOffer?.rejectedPlayerIds).toEqual([fixture.firstRecipient.id]);
    expect(getLegalActions(state, fixture.firstRecipient.id).canRespondToTrade).toBe(false);
    expect(getLegalActions(state, fixture.secondRecipient.id).canRespondToTrade).toBe(true);

    state = applyCommand(state, fixture.secondRecipient.id, {
      accept: false,
      kind: "respond_trade",
      offerActionNumber,
    });
    expect(state.tradeOffer).toBeNull();
  });

  it("revalidates both hands at acceptance time", () => {
    const fixture = tradeFixture();
    const offered = applyCommand(fixture.state, fixture.proposer.id, {
      give: inventory({ brick: 2 }),
      kind: "propose_trade",
      recipientPlayerIds: [fixture.firstRecipient.id],
      want: inventory({ wheat: 1 }),
    });
    const spent = {
      ...offered,
      players: offered.players.map((player) =>
        player.id === fixture.proposer.id
          ? { ...player, resources: inventory({ brick: 1 }) }
          : player,
      ),
    };

    expect(() =>
      applyCommand(spent, fixture.firstRecipient.id, {
        accept: true,
        kind: "respond_trade",
        offerActionNumber: offered.actionNumber,
      }),
    ).toThrowError(expect.objectContaining({ code: "INSUFFICIENT_RESOURCES" }));
  });

  it("validates proposals exactly and cancels by offer revision or turn end", () => {
    const fixture = tradeFixture();
    const invalidCommands = [
      {
        give: inventory({}),
        kind: "propose_trade" as const,
        recipientPlayerIds: [fixture.firstRecipient.id],
        want: inventory({ wheat: 1 }),
      },
      {
        give: inventory({ brick: 1 }),
        kind: "propose_trade" as const,
        recipientPlayerIds: [fixture.firstRecipient.id, fixture.firstRecipient.id],
        want: inventory({ wheat: 1 }),
      },
      {
        give: inventory({ brick: 1 }),
        kind: "propose_trade" as const,
        recipientPlayerIds: [fixture.proposer.id],
        want: inventory({ wheat: 1 }),
      },
      {
        give: inventory({ brick: 1 }),
        kind: "propose_trade" as const,
        recipientPlayerIds: [fixture.firstRecipient.id],
        want: inventory({ brick: 1 }),
      },
    ];

    for (const command of invalidCommands) {
      expect(() => applyCommand(fixture.state, fixture.proposer.id, command)).toThrowError(
        expect.objectContaining({ code: "INVALID_TRADE" }),
      );
    }

    const offered = applyCommand(fixture.state, fixture.proposer.id, {
      give: inventory({ brick: 1 }),
      kind: "propose_trade",
      recipientPlayerIds: [fixture.firstRecipient.id],
      want: inventory({ wheat: 1 }),
    });
    expect(() =>
      applyCommand(offered, fixture.proposer.id, {
        kind: "cancel_trade",
        offerActionNumber: offered.actionNumber + 1,
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_TRADE" }));

    const cancelled = applyCommand(offered, fixture.proposer.id, {
      kind: "cancel_trade",
      offerActionNumber: offered.actionNumber,
    });
    expect(cancelled.tradeOffer).toBeNull();

    const offeredAgain = applyCommand(cancelled, fixture.proposer.id, {
      give: inventory({ brick: 1 }),
      kind: "propose_trade",
      recipientPlayerIds: [fixture.firstRecipient.id],
      want: inventory({ wheat: 1 }),
    });
    expect(
      applyCommand(offeredAgain, fixture.proposer.id, { kind: "end_turn" }).tradeOffer,
    ).toBeNull();
  });
});
