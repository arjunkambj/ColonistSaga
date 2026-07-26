import { applyCommand, chooseAutomatedCommand } from "@colonistsaga/game";
import { v } from "convex/values";

import { isScheduledActionDue } from "../lib/game-scheduling";
import { internalMutation } from "./_generated/server";
import { commandText } from "./model/commands";
import { fail } from "./model/errors";
import { parseGameState, persistAppliedCommand, requiredAutomatedActor } from "./model/gameState";
import { validateActionNumber, validateGameSettings } from "./model/normalize";
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

    const settings = validateGameSettings(game.settings);
    const state = parseGameState(game.stateJson);
    if (state.actionNumber !== game.revision) {
      fail("CORRUPT_GAME_STATE", "Stored game revision does not match its state.");
    }
    const actor = requiredAutomatedActor(state);
    if (
      !actor ||
      (args.expectedActorPlayerId !== undefined && actor.playerId !== args.expectedActorPlayerId) ||
      (!actor.isBot && settings.turnTimerSeconds === 0)
    ) {
      return null;
    }

    const actorSeat = (await listSeats(ctx, game.roomId)).find(
      (seat) => String(seat._id) === actor.playerId,
    );
    if (!actorSeat) fail("CORRUPT_GAME_STATE", "Automated actor does not own a room seat.");

    let command;
    let nextState;
    try {
      command = chooseAutomatedCommand(state, actor.playerId);
      nextState = applyCommand(state, actor.playerId, command);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Automated action failed.";
      fail("AUTOMATED_ACTION_FAILED", message);
    }

    const actionText = commandText(command, actorSeat.displayName, state, nextState);
    await persistAppliedCommand(
      ctx,
      game,
      state,
      nextState,
      actorSeat,
      command,
      `system:automated:${state.actionNumber}`,
      actor.isBot ? actionText : `${actorSeat.displayName} timed out. ${actionText}`,
    );
    return null;
  },
});
