import {
  DEFAULT_BASE_GAME_SETTINGS,
  createDefaultGame,
  getRequiredPlayerIds,
  toPlayerView,
} from "@catansaga/game";
import type {
  BaseGameSettings,
  BotDifficulty,
  GameCommand,
  GamePlayerInput,
  GameState,
} from "@catansaga/game";

import { nextScheduledActionAt, nextTurnDeadlineAt } from "../../lib/mvp-scheduling";
import { internal } from "../_generated/api";
import type { HexclaveUser } from "../hexclave/auth";
import { serializeCommand } from "./commands";
import { DEFAULT_BOT_DIFFICULTY } from "./constants";
import { fail } from "./errors";
import {
  createPrivateGameSeed,
  normalizeDisplayName,
  validateBotCount,
  validateGameSettings,
} from "./normalize";
import { allocateRoomCode, listSeats, nextOpenSeatIndex } from "./roomQueries";
import type { GameDoc, GameId, RoomDoc, SeatDoc, WriteCtx } from "./types";

export function parseGameState(stateJson: string): GameState {
  let state: unknown;
  try {
    state = JSON.parse(stateJson);
  } catch {
    fail("CORRUPT_GAME_STATE", "Stored game state is not valid JSON.");
  }

  if (
    typeof state !== "object" ||
    state === null ||
    !("actionNumber" in state) ||
    typeof state.actionNumber !== "number" ||
    !Number.isSafeInteger(state.actionNumber) ||
    !("players" in state) ||
    !Array.isArray(state.players)
  ) {
    fail("CORRUPT_GAME_STATE", "Stored game state has an invalid shape.");
  }
  return state as GameState;
}

export function serializeGameState(state: GameState): string {
  return JSON.stringify(state);
}

export function gameStatus(state: GameState): "active" | "finished" {
  return state.status === "completed" ? "finished" : "active";
}

export function roomViewStatus(status: RoomDoc["status"]): "completed" | "in_progress" | "waiting" {
  if (status === "active") return "in_progress";
  if (status === "finished") return "completed";
  return "waiting";
}

export function requiredAutomatedActor(state: GameState) {
  if (state.status === "completed") return null;
  const requiredPlayerIds = getRequiredPlayerIds(state);
  const playersById = new Map(state.players.map((player) => [player.id, player]));
  const playerId =
    requiredPlayerIds.find((requiredPlayerId) => playersById.get(requiredPlayerId)?.isBot) ??
    requiredPlayerIds[0];
  const player = playerId ? playersById.get(playerId) : undefined;
  return player ? { isBot: player.isBot, playerId } : null;
}

function activeTurnOwner(state: GameState) {
  if (state.status === "completed") return null;
  const player = state.players.find((candidate) => candidate.id === state.activePlayerId);
  return player ? { isBot: player.isBot, playerId: player.id } : null;
}

export async function scheduleNextAutomatedAction(
  ctx: WriteCtx,
  gameId: GameId,
  state: GameState,
  settings: BaseGameSettings,
  now: number,
  previousState?: GameState,
  previousActionAt?: number,
  previousTurnDeadlineAt?: number,
): Promise<{ nextActionAt?: number; turnDeadlineAt?: number }> {
  const actor = requiredAutomatedActor(state);
  const activePlayer = activeTurnOwner(state);
  const previousActor = previousState ? requiredAutomatedActor(previousState) : null;
  const previousHumanDeadline =
    previousActor && !previousActor.isBot && previousActionAt !== undefined
      ? { actorPlayerId: previousActor.playerId, nextActionAt: previousActionAt }
      : undefined;
  const previousTurnDeadline =
    previousState && previousTurnDeadlineAt !== undefined
      ? {
          actorPlayerId: previousState.activePlayerId,
          nextActionAt: previousTurnDeadlineAt,
        }
      : undefined;
  const turnDeadlineAt = nextTurnDeadlineAt(activePlayer, settings, now, previousTurnDeadline);
  const nextActionAt = nextScheduledActionAt(actor, settings, now, {
    previousHumanDeadline,
    turnDeadlineAt,
  });
  if (nextActionAt !== undefined && actor) {
    await ctx.scheduler.runAt(nextActionAt, internal.automation.runAutomatedAction, {
      expectedActionNumber: state.actionNumber,
      expectedActorPlayerId: actor.playerId,
      gameId,
      scheduledFor: nextActionAt,
    });
  }
  return { nextActionAt, turnDeadlineAt };
}

export function playerViewJson(state: GameState, seat: SeatDoc): string {
  const playerId = String(seat._id);
  if (!state.players.some((player) => player.id === playerId)) {
    fail("CORRUPT_GAME_STATE", "Room seat is missing from the game state.");
  }
  return JSON.stringify(toPlayerView(state, playerId));
}

export async function persistAppliedCommand(
  ctx: WriteCtx,
  game: GameDoc,
  state: GameState,
  nextState: GameState,
  actorSeat: SeatDoc,
  command: GameCommand,
  clientActionId: string,
  text: string,
): Promise<void> {
  if (nextState.actionNumber !== state.actionNumber + 1) {
    fail("CORRUPT_GAME_STATE", "Accepted command did not advance exactly one action.");
  }

  const now = Date.now();
  const schedule = await scheduleNextAutomatedAction(
    ctx,
    game._id,
    nextState,
    game.settings,
    now,
    state,
    game.nextActionAt,
    game.turnDeadlineAt,
  );
  await ctx.db.patch("mvpGames", game._id, {
    ...schedule,
    revision: nextState.actionNumber,
    stateJson: serializeGameState(nextState),
    status: gameStatus(nextState),
    updatedAt: now,
  });
  await ctx.db.insert("mvpGameActions", {
    actorSeatId: actorSeat._id,
    afterRevision: nextState.actionNumber,
    beforeRevision: state.actionNumber,
    clientActionId,
    commandJson: serializeCommand(command),
    createdAt: now,
    gameId: game._id,
    text,
  });
  await ctx.db.patch("mvpRooms", game.roomId, {
    status: gameStatus(nextState),
    updatedAt: now,
  });
}

export async function setWaitingBotCount(
  ctx: WriteCtx,
  room: RoomDoc,
  botCount: number,
): Promise<void> {
  const maxPlayers = room.settings.maxPlayers;
  validateBotCount(botCount, maxPlayers);
  const seats = await listSeats(ctx, room._id);
  const humanCount = seats.filter((seat) => seat.kind === "human").length;
  if (humanCount + botCount > maxPlayers) {
    fail(
      "ROOM_FULL",
      `${humanCount} human player${humanCount === 1 ? "" : "s"} leave room for at most ${maxPlayers - humanCount} bots.`,
    );
  }

  const bots = seats
    .filter((seat) => seat.kind === "bot")
    .sort((left, right) => right.seatIndex - left.seatIndex);
  const botsToRemove = bots.slice(0, Math.max(0, bots.length - botCount));
  await Promise.all(botsToRemove.map((seat) => ctx.db.delete("mvpSeats", seat._id)));

  const remainingSeats = seats.filter(
    (seat) => !botsToRemove.some((removed) => removed._id === seat._id),
  );
  for (let index = bots.length - botsToRemove.length; index < botCount; index += 1) {
    const seatIndex = nextOpenSeatIndex(remainingSeats, maxPlayers);
    const seatId = await ctx.db.insert("mvpSeats", {
      displayName: `Bot ${seatIndex + 1}`,
      joinedAt: Date.now(),
      kind: "bot",
      roomId: room._id,
      seatIndex,
    });
    const seat = await ctx.db.get("mvpSeats", seatId);
    if (!seat) fail("CORRUPT_GAME_STATE", "Bot seat creation did not complete.");
    remainingSeats.push(seat);
  }
}

export async function fitWaitingSeatsToSettings(
  ctx: WriteCtx,
  room: RoomDoc,
  settings: BaseGameSettings,
): Promise<void> {
  const seats = await listSeats(ctx, room._id);
  const humans = seats.filter((seat) => seat.kind === "human");
  if (humans.length > settings.maxPlayers) {
    fail("TOO_MANY_PLAYERS", "The room has more human players than the selected player count.");
  }

  const botCapacity = settings.maxPlayers - humans.length;
  const bots = seats
    .filter((seat) => seat.kind === "bot")
    .sort((left, right) => left.seatIndex - right.seatIndex);
  await Promise.all(bots.slice(botCapacity).map((seat) => ctx.db.delete("mvpSeats", seat._id)));

  const keptSeats = [...humans, ...bots.slice(0, botCapacity)].sort((left, right) => {
    if (left._id === room.hostSeatId) return -1;
    if (right._id === room.hostSeatId) return 1;
    if (left.kind !== right.kind) return left.kind === "human" ? -1 : 1;
    return left.seatIndex - right.seatIndex;
  });
  await Promise.all(
    keptSeats.map((seat, seatIndex) => {
      const displayName = seat.kind === "bot" ? `Bot ${seatIndex + 1}` : seat.displayName;
      return seat.seatIndex === seatIndex && displayName === seat.displayName
        ? Promise.resolve()
        : ctx.db.patch("mvpSeats", seat._id, { displayName, seatIndex });
    }),
  );
}

export async function createRoomRecord(
  ctx: WriteCtx,
  user: HexclaveUser,
  rawDisplayName: string,
  settings: BaseGameSettings = DEFAULT_BASE_GAME_SETTINGS,
  botDifficulty: BotDifficulty = DEFAULT_BOT_DIFFICULTY,
): Promise<{ code: string; room: RoomDoc; seat: SeatDoc }> {
  const displayName = normalizeDisplayName(rawDisplayName);
  const now = Date.now();
  const code = await allocateRoomCode(ctx, user.id, now);
  const validatedSettings = validateGameSettings(settings);
  const roomId = await ctx.db.insert("mvpRooms", {
    botDifficulty,
    code,
    createdAt: now,
    settings: validatedSettings,
    status: "waiting",
    updatedAt: now,
  });
  const seatId = await ctx.db.insert("mvpSeats", {
    authUserId: user.id,
    displayName,
    joinedAt: now,
    kind: "human",
    roomId,
    seatIndex: 0,
  });
  await ctx.db.patch("mvpRooms", roomId, { hostSeatId: seatId });

  const room = await ctx.db.get("mvpRooms", roomId);
  const seat = await ctx.db.get("mvpSeats", seatId);
  if (!room || !seat) fail("ROOM_NOT_FOUND", "Room creation did not complete.");
  return { code, room, seat };
}

export async function startRoomGame(ctx: WriteCtx, room: RoomDoc): Promise<GameDoc> {
  if (room.gameId) {
    const existingGame = await ctx.db.get("mvpGames", room.gameId);
    if (existingGame) return existingGame;
  }
  if (room.status === "finished") fail("GAME_ALREADY_FINISHED", "Game has already finished.");
  if (room.status !== "waiting") fail("ROOM_STARTED", "Room is no longer waiting.");
  if (!room.hostSeatId) fail("NOT_HOST", "Room does not have a host seat.");

  const now = Date.now();
  const settings = validateGameSettings(room.settings);
  const seats = await listSeats(ctx, room._id);
  if (
    seats.length !== settings.maxPlayers ||
    seats.some((seat, index) => seat.seatIndex !== index)
  ) {
    fail(
      "ROOM_NOT_READY",
      `A ${settings.maxPlayers}-player game requires exactly ${settings.maxPlayers} configured seats.`,
    );
  }

  const players: GamePlayerInput[] = seats.map((seat) => ({
    botDifficulty: seat.kind === "bot" ? room.botDifficulty : undefined,
    displayName: seat.displayName,
    id: String(seat._id),
    isBot: seat.kind === "bot",
  }));
  const state = createDefaultGame(players, createPrivateGameSeed(), settings);
  const gameId = await ctx.db.insert("mvpGames", {
    botDifficulty: room.botDifficulty,
    createdAt: now,
    revision: state.actionNumber,
    roomId: room._id,
    settings,
    stateJson: serializeGameState(state),
    status: gameStatus(state),
    updatedAt: now,
  });
  const schedule = await scheduleNextAutomatedAction(ctx, gameId, state, settings, now);
  await ctx.db.patch("mvpGames", gameId, schedule);
  await ctx.db.patch("mvpRooms", room._id, {
    gameId,
    status: gameStatus(state),
    updatedAt: now,
  });
  const humanCount = seats.filter((seat) => seat.kind === "human").length;
  const botCount = seats.length - humanCount;
  await ctx.db.insert("mvpGameActions", {
    actorSeatId: room.hostSeatId,
    afterRevision: state.actionNumber,
    beforeRevision: state.actionNumber,
    clientActionId: "system:game-started",
    commandJson: JSON.stringify({ kind: "game_started" }),
    createdAt: now,
    gameId,
    text: `Game started with ${humanCount} human player${humanCount === 1 ? "" : "s"} and ${botCount} bot${botCount === 1 ? "" : "s"}.`,
  });
  const game = await ctx.db.get("mvpGames", gameId);
  if (!game) fail("GAME_NOT_STARTED", "Game creation did not complete.");
  return game;
}

export function transferPlayerToBot(
  state: GameState,
  seat: SeatDoc,
  botDifficulty: BotDifficulty,
): GameState {
  const playerId = String(seat._id);
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    fail("CORRUPT_GAME_STATE", "Room seat is missing from the game state.");
  }
  if (player.isBot) {
    fail("TARGET_NOT_HUMAN", "Target seat is already controlled by a bot.");
  }

  return {
    ...state,
    players: state.players.map((candidate) =>
      candidate.id === playerId ? { ...candidate, botDifficulty, isBot: true } : candidate,
    ),
  };
}

export async function convertGameSeatToBot(
  ctx: WriteCtx,
  room: RoomDoc,
  seat: SeatDoc,
  eventText: string,
): Promise<void> {
  if (seat.kind !== "human") {
    fail("TARGET_NOT_HUMAN", "Target seat is not controlled by a human player.");
  }
  if (!room.gameId) {
    fail("CORRUPT_GAME_STATE", "Active room does not have a game.");
  }

  const game = await ctx.db.get("mvpGames", room.gameId);
  if (!game) {
    fail("CORRUPT_GAME_STATE", "Room points to a missing game.");
  }
  const state = parseGameState(game.stateJson);
  if (game.revision !== state.actionNumber) {
    fail("CORRUPT_GAME_STATE", "Stored game revision does not match its state.");
  }

  const playerId = String(seat._id);
  const nextState = transferPlayerToBot(state, seat, room.botDifficulty);
  const now = Date.now();
  const schedule = getRequiredPlayerIds(state).includes(playerId)
    ? await scheduleNextAutomatedAction(
        ctx,
        game._id,
        nextState,
        game.settings,
        now,
        state,
        game.nextActionAt,
        game.turnDeadlineAt,
      )
    : { nextActionAt: game.nextActionAt, turnDeadlineAt: game.turnDeadlineAt };
  await ctx.db.patch("mvpSeats", seat._id, {
    authUserId: undefined,
    displayName: `Bot ${seat.seatIndex + 1}`,
    kind: "bot",
  });
  await ctx.db.patch("mvpGames", game._id, {
    ...schedule,
    revision: nextState.actionNumber,
    stateJson: serializeGameState(nextState),
    status: gameStatus(nextState),
    updatedAt: now,
  });
  await ctx.db.patch("mvpRooms", room._id, {
    status: gameStatus(nextState),
    updatedAt: now,
  });
  await ctx.db.insert("mvpGameActions", {
    actorSeatId: seat._id,
    afterRevision: nextState.actionNumber,
    beforeRevision: state.actionNumber,
    clientActionId: `system:bot-control:${String(seat._id)}`,
    commandJson: JSON.stringify({ kind: "bot_control_started" }),
    createdAt: now,
    gameId: game._id,
    text: eventText,
  });
}
