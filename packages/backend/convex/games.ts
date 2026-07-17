import { DEFAULT_BASE_GAME_SETTINGS, applyCommand as applyGameCommand } from "@catansaga/game";
import type { GameCommand } from "@catansaga/game";
import { ConvexError, v } from "convex/values";

import {
  earliestActionDeadlineAt,
  isActionDeadlineExpired,
} from "../lib/mvp-scheduling";
import { mutation } from "./_generated/server";
import { requireCurrentHexclaveUser } from "./hexclave/auth";
import {
  commandText,
  serializeCommand,
  validateCommandBounds,
} from "./model/commands";
import { fail } from "./model/errors";
import {
  createRoomRecord,
  parseGameState,
  persistAppliedCommand,
  setWaitingBotCount,
  startRoomGame,
} from "./model/gameState";
import {
  validateActionNumber,
  validateBotCount,
  validateClientActionId,
  validateGameSettings,
} from "./model/normalize";
import { requireHumanSeat, requireRoom } from "./model/roomQueries";
import { commandValidator } from "./model/validators";
import { baseGameSettingsValidator, botDifficultyValidator } from "./schema";
import { DEFAULT_BOT_DIFFICULTY } from "./model/constants";

export const startGame = mutation({
  args: {
    code: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireCurrentHexclaveUser(ctx);
    const room = await requireRoom(ctx, args.code);
    const seat = await requireHumanSeat(ctx, room._id, user.id);
    if (seat._id !== room.hostSeatId) fail("NOT_HOST", "Only the room host can start the game.");
    await startRoomGame(ctx, room);
    return null;
  },
});

export const createQuickGame = mutation({
  args: {
    botCount: v.optional(v.number()),
    botDifficulty: v.optional(botDifficultyValidator),
    displayName: v.string(),
    settings: v.optional(baseGameSettingsValidator),
  },
  returns: v.object({ code: v.string() }),
  handler: async (ctx, args) => {
    const user = await requireCurrentHexclaveUser(ctx);
    const settings = validateGameSettings(args.settings ?? DEFAULT_BASE_GAME_SETTINGS);
    const botCount = validateBotCount(
      args.botCount ?? settings.maxPlayers - 1,
      settings.maxPlayers,
    );
    if (botCount + 1 !== settings.maxPlayers) {
      fail(
        "INVALID_BOT_COUNT",
        `A solo ${settings.maxPlayers}-player game requires ${settings.maxPlayers - 1} bots.`,
      );
    }
    const botDifficulty = args.botDifficulty ?? DEFAULT_BOT_DIFFICULTY;
    const { code, room } = await createRoomRecord(
      ctx,
      user,
      args.displayName,
      settings,
      botDifficulty,
    );
    await setWaitingBotCount(ctx, room, botCount);
    await startRoomGame(ctx, room);
    return { code };
  },
});

export const applyCommand = mutation({
  args: {
    clientActionId: v.string(),
    code: v.string(),
    command: commandValidator,
    expectedActionNumber: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireCurrentHexclaveUser(ctx);
    const room = await requireRoom(ctx, args.code);
    const seat = await requireHumanSeat(ctx, room._id, user.id);
    if (!room.gameId) fail("GAME_NOT_STARTED", "Game has not started.");

    const game = await ctx.db.get("mvpGames", room.gameId);
    if (!game) fail("GAME_NOT_STARTED", "Game has not started.");
    const clientActionId = validateClientActionId(args.clientActionId);
    const command = args.command as GameCommand;
    validateCommandBounds(command);
    const commandJson = serializeCommand(command);

    const existingAction = await ctx.db
      .query("mvpGameActions")
      .withIndex("by_game_and_client_action_id", (index) =>
        index.eq("gameId", game._id).eq("clientActionId", clientActionId),
      )
      .unique();
    if (existingAction) {
      if (existingAction.actorSeatId !== seat._id || existingAction.commandJson !== commandJson) {
        fail("CLIENT_ACTION_CONFLICT", "Client action ID was already used for another command.");
      }
      return null;
    }

    const expectedActionNumber = validateActionNumber(args.expectedActionNumber);
    const state = parseGameState(game.stateJson);
    if (game.revision !== state.actionNumber) {
      fail("CORRUPT_GAME_STATE", "Stored game revision does not match its state.");
    }
    if (expectedActionNumber !== game.revision) {
      fail(
        "STALE_ACTION_NUMBER",
        `Expected action ${expectedActionNumber}, but the game is at action ${game.revision}.`,
      );
    }
    if (state.status === "completed") fail("GAME_ALREADY_FINISHED", "Game has already finished.");
    if (
      isActionDeadlineExpired(
        earliestActionDeadlineAt(game.nextActionAt, game.turnDeadlineAt),
        Date.now(),
      )
    ) {
      fail("ACTION_DEADLINE_PASSED", "The scheduled action deadline has passed.");
    }

    let nextState;
    try {
      nextState = applyGameCommand(state, String(seat._id), command);
    } catch (error) {
      if (error instanceof ConvexError) throw error;
      const message = error instanceof Error ? error.message : "Game command was rejected.";
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
          ? error.code
          : "INVALID_COMMAND";
      fail(code, message);
    }

    await persistAppliedCommand(
      ctx,
      game,
      state,
      nextState,
      seat,
      command,
      clientActionId,
      commandText(command, seat.displayName, nextState),
    );
    return null;
  },
});
