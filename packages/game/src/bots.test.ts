import { describe, expect, it } from "vitest";

import { chooseAutomatedCommand } from "./bots";
import { applyCommand, getLegalActions } from "./rules";
import { createDefaultGame } from "./state";
import { createTestGame, createTestPlayers, inventory, transferFromBank } from "./test-helpers";
import type { GamePlayerInput, GameState } from "./types";

describe("one-command automation", () => {
  it("returns one deterministic first-legal command without mutating state", () => {
    const players = createTestPlayers(true).map((player) => ({
      ...player,
      botDifficulty: "easy" as const,
    }));
    const state = createDefaultGame(players, "one-command", {
      balancedDice: false,
      friendlyRobber: false,
    });
    const unchanged = structuredClone(state);
    const command = chooseAutomatedCommand(state, state.activePlayerId);

    expect(command).toEqual({
      kind: "place_settlement",
      vertexKey: getLegalActions(state, state.activePlayerId).settlementVertexKeys[0],
    });
    expect(state).toEqual(unchanged);

    const next = applyCommand(state, state.activePlayerId, command);
    expect(next.actionNumber).toBe(1);
    expect(next.board.buildings).toHaveLength(1);
    expect(next.board.roads).toHaveLength(0);
    expect(next.phase.kind).toBe("setup_road");
  });

  it("also supplies a deterministic timeout fallback for a human player", () => {
    const state = createTestGame("human-timeout");
    const first = chooseAutomatedCommand(state, state.activePlayerId);
    const second = chooseAutomatedCommand(state, state.activePlayerId);

    expect(first).toEqual(second);
    expect(() => applyCommand(state, state.activePlayerId, first)).not.toThrow();
  });

  it("gives hard bots a deeper placement heuristic than medium bots", () => {
    const createBotGame = (botDifficulty: "hard" | "medium") =>
      createDefaultGame(
        createTestPlayers().map((player, index) => ({
          ...player,
          botDifficulty: index === 0 ? botDifficulty : undefined,
          isBot: index === 0,
        })),
        "difficulty-placement",
        { friendlyRobber: false },
      );
    const mediumState = createBotGame("medium");
    const hardState = createBotGame("hard");

    expect(chooseAutomatedCommand(mediumState, mediumState.activePlayerId)).toEqual({
      kind: "place_settlement",
      vertexKey: "vertex:-4:2",
    });
    expect(chooseAutomatedCommand(hardState, hardState.activePlayerId)).toEqual({
      kind: "place_settlement",
      vertexKey: "vertex:-5:-1",
    });
  });

  it.each([
    { accept: true, give: inventory({ brick: 1 }), want: inventory({ wheat: 1 }) },
    { accept: false, give: inventory({ brick: 1 }), want: inventory({ wheat: 2 }) },
  ])("has bot recipients respond deterministically to an offer", ({ accept, give, want }) => {
    const players: GamePlayerInput[] = createTestPlayers().map((player, index) => ({
      ...player,
      botDifficulty: index === 1 ? "hard" : undefined,
      isBot: index === 1,
    }));
    let state: GameState = {
      ...createDefaultGame(players, `bot-trade-${accept}`, {
        balancedDice: false,
        friendlyRobber: false,
      }),
      phase: { kind: "build_and_trade" },
    };
    const [proposer, recipient] = state.players;
    if (!proposer || !recipient) throw new Error("Bot trade fixture requires two players");
    state = transferFromBank(state, proposer.id, inventory({ brick: 1 }));
    state = transferFromBank(state, recipient.id, inventory({ wheat: 2 }));
    state = applyCommand(state, proposer.id, {
      give,
      kind: "propose_trade",
      recipientPlayerIds: [recipient.id],
      want,
    });

    const command = chooseAutomatedCommand(state, recipient.id);
    expect(command).toEqual({
      accept,
      kind: "respond_trade",
      offerActionNumber: state.tradeOffer?.offerActionNumber,
    });
    expect(applyCommand(state, recipient.id, command).actionNumber).toBe(state.actionNumber + 1);
  });
});
