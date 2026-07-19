import { applyCommand, chooseAutomatedCommand } from "@colonistsaga/game";
import type { GameCommand, GameState } from "@colonistsaga/game";
import { v } from "convex/values";

import { isScheduledActionDue } from "../lib/game-scheduling";
import { internalMutation } from "./_generated/server";
import { commandText } from "./model/commands";
import { fail } from "./model/errors";
import { parseGameState, persistAppliedCommand, requiredAutomatedActor } from "./model/gameState";
import { validateActionNumber } from "./model/normalize";
import { listSeats } from "./model/roomQueries";

export const runAutomatedAction = internalMutation({
  args: {
    expectedActionNumber: v.number(),
    expectedActorPlayerId: v.optional(v.string()),
    gameId: v.id("games"),
    scheduledFor: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    if (args.expectedActorPlayerId === undefined || args.scheduledFor === undefined) {
      return null;
    }
    const expectedActionNumber = validateActionNumber(args.expectedActionNumber);
    const game = await ctx.db.get("games", args.gameId);
    if (
      !game ||
      game.status !== "active" ||
      game.revision !== expectedActionNumber ||
      !isScheduledActionDue(game.nextActionAt, args.scheduledFor, Date.now())
    ) {
      return null;
    }

    const state = parseGameState(game.stateJson);
    if (state.actionNumber !== game.revision) {
      fail("CORRUPT_GAME_STATE", "Stored game revision does not match its state.");
    }
    const actor = requiredAutomatedActor(state);
    if (
      !actor ||
      actor.playerId !== args.expectedActorPlayerId ||
      (!actor.isBot && game.settings.turnTimerSeconds === 0)
    ) {
      return null;
    }

    const seats = await listSeats(ctx, game.roomId);
    const actorSeat = seats.find((seat) => String(seat._id) === actor.playerId);
    if (!actorSeat) fail("CORRUPT_GAME_STATE", "Automated actor does not own a room seat.");

    let command: GameCommand;
    let nextState: GameState;
    try {
      command = chooseAutomatedCommand(state, actor.playerId);
      nextState = applyCommand(state, actor.playerId, command);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Automated action failed.";
      fail("AUTOMATED_ACTION_FAILED", message);
    }
    await persistAppliedCommand(
      ctx,
      game,
      state,
      nextState,
      actorSeat,
      command,
      `system:automated:${state.actionNumber}`,
      actor.isBot
        ? commandText(command, actorSeat.displayName, nextState)
        : `${actorSeat.displayName} timed out. ${commandText(command, actorSeat.displayName, nextState)}`,
    );
    return null;
  },
});
