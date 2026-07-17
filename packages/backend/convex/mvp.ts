import {
  advanceBots,
  applyCommand,
  createDefaultGame,
  getRequiredPlayerIds,
  toPlayerView,
} from "@catansaga/game";
import type { GameCommand, GamePlayerInput, GameState, ResourceInventory } from "@catansaga/game";
import { ConvexError, v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { resourceInventoryValidator, resourceTypeValidator } from "./schema";

const MAX_SEATS = 4;
const MAX_BOT_ACTIONS = 2_048;
const DEFAULT_VICTORY_POINTS = 10;
const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PLAYER_COLORS = ["red", "blue", "orange", "green"] as const;

const gameEventViewValidator = v.object({
  createdAt: v.number(),
  sequence: v.number(),
  text: v.string(),
});

const roomMemberViewValidator = v.object({
  controller: v.union(v.literal("bot"), v.literal("player")),
  displayName: v.string(),
  id: v.string(),
  playerColor: v.union(
    v.literal("blue"),
    v.literal("green"),
    v.literal("orange"),
    v.literal("red"),
  ),
  ready: v.boolean(),
  role: v.union(v.literal("host"), v.literal("player")),
});

const roomViewValidator = v.object({
  actionNumber: v.optional(v.number()),
  code: v.string(),
  events: v.array(gameEventViewValidator),
  gameId: v.optional(v.id("mvpGames")),
  gameJson: v.optional(v.string()),
  isHost: v.boolean(),
  members: v.array(roomMemberViewValidator),
  rules: v.object({ victoryPoints: v.number() }),
  status: v.union(v.literal("completed"), v.literal("in_progress"), v.literal("waiting")),
});

const commandValidator = v.union(
  v.object({
    kind: v.literal("place_settlement"),
    vertexKey: v.string(),
  }),
  v.object({
    edgeKey: v.string(),
    kind: v.literal("place_road"),
  }),
  v.object({ kind: v.literal("roll") }),
  v.object({
    kind: v.literal("discard"),
    resources: resourceInventoryValidator,
  }),
  v.object({
    kind: v.literal("move_robber"),
    tileId: v.string(),
  }),
  v.object({
    kind: v.literal("steal"),
    victimPlayerId: v.string(),
  }),
  v.object({
    kind: v.literal("build_city"),
    vertexKey: v.string(),
  }),
  v.object({
    give: resourceTypeValidator,
    kind: v.literal("trade_bank"),
    receive: resourceTypeValidator,
  }),
  v.object({ kind: v.literal("end_turn") }),
);

type ReadCtx = Pick<QueryCtx, "db">;
type MvpRoom = Doc<"mvpRooms">;
type MvpSeat = Doc<"mvpSeats">;
type MvpGame = Doc<"mvpGames">;
type GameEventView = {
  createdAt: number;
  sequence: number;
  text: string;
};

function fail(code: string, message: string): never {
  throw new ConvexError({ code, message });
}

function normalizeSessionId(value: string): string {
  const sessionId = value.trim();
  if (sessionId.length < 8 || sessionId.length > 128) {
    fail("INVALID_SESSION", "Session ID must contain 8 to 128 characters.");
  }
  return sessionId;
}

function normalizeDisplayName(value: string): string {
  const displayName = value.trim().replace(/\s+/g, " ");
  if (displayName.length < 1 || displayName.length > 24) {
    fail("INVALID_DISPLAY_NAME", "Display name must contain 1 to 24 characters.");
  }
  return displayName;
}

function normalizeRoomCode(value: string): string {
  const code = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== ROOM_CODE_LENGTH) {
    fail("INVALID_ROOM_CODE", `Room code must contain ${ROOM_CODE_LENGTH} characters.`);
  }
  return code;
}

function validateClientActionId(value: string): string {
  const clientActionId = value.trim();
  if (
    clientActionId.length < 1 ||
    clientActionId.length > 128 ||
    clientActionId.startsWith("system:")
  ) {
    fail(
      "INVALID_CLIENT_ACTION_ID",
      "Client action ID must contain 1 to 128 characters and cannot use the system prefix.",
    );
  }
  return clientActionId;
}

function createPrivateGameSeed(): string {
  const randomParts = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36),
  );
  return `catansaga-mvp-v1:${randomParts.join(":")}`;
}

function validateActionNumber(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    fail("INVALID_ACTION_NUMBER", "Expected action number must be a non-negative integer.");
  }
  return value;
}

function normalizeSeatId(value: string): string {
  const seatId = value.trim();
  if (seatId.length < 1 || seatId.length > 128) {
    fail("INVALID_TARGET_SEAT", "Target seat ID must contain 1 to 128 characters.");
  }
  return seatId;
}

function hashText(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function roomCodeCandidate(sessionId: string, now: number, attempt: number): string {
  let random = hashText(`${sessionId}:${now}:${attempt}`);
  return Array.from({ length: ROOM_CODE_LENGTH }, () => {
    random ^= random << 13;
    random ^= random >>> 17;
    random ^= random << 5;
    return ROOM_CODE_ALPHABET[(random >>> 0) % ROOM_CODE_ALPHABET.length];
  }).join("");
}

async function allocateRoomCode(ctx: ReadCtx, sessionId: string, now: number): Promise<string> {
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const code = roomCodeCandidate(sessionId, now, attempt);
    const existing = await ctx.db
      .query("mvpRooms")
      .withIndex("by_code", (index) => index.eq("code", code))
      .unique();
    if (!existing) return code;
  }
  fail("ROOM_CODE_EXHAUSTED", "Could not allocate a unique room code.");
}

async function findRoom(ctx: ReadCtx, code: string): Promise<MvpRoom | null> {
  return await ctx.db
    .query("mvpRooms")
    .withIndex("by_code", (index) => index.eq("code", code))
    .unique();
}

async function requireRoom(ctx: ReadCtx, rawCode: string): Promise<MvpRoom> {
  const code = normalizeRoomCode(rawCode);
  const room = await findRoom(ctx, code);
  if (!room) fail("ROOM_NOT_FOUND", "Room not found.");
  return room;
}

async function listSeats(ctx: ReadCtx, roomId: Id<"mvpRooms">): Promise<MvpSeat[]> {
  const seats = await ctx.db
    .query("mvpSeats")
    .withIndex("by_room", (index) => index.eq("roomId", roomId))
    .take(MAX_SEATS + 1);
  if (seats.length > MAX_SEATS) {
    fail("CORRUPT_GAME_STATE", "Room contains more than four seats.");
  }
  return [...seats].sort((left, right) => left.seatIndex - right.seatIndex);
}

async function findSeatBySession(
  ctx: ReadCtx,
  roomId: Id<"mvpRooms">,
  sessionId: string,
): Promise<MvpSeat | null> {
  return await ctx.db
    .query("mvpSeats")
    .withIndex("by_room_and_session_id", (index) =>
      index.eq("roomId", roomId).eq("sessionId", sessionId),
    )
    .unique();
}

async function requireHumanSeat(
  ctx: ReadCtx,
  roomId: Id<"mvpRooms">,
  rawSessionId: string,
): Promise<MvpSeat> {
  const sessionId = normalizeSessionId(rawSessionId);
  const seat = await findSeatBySession(ctx, roomId, sessionId);
  if (!seat || seat.kind !== "human") {
    fail("NOT_ROOM_MEMBER", "This session does not own a human seat in the room.");
  }
  return seat;
}

function nextOpenSeatIndex(seats: readonly MvpSeat[]): number {
  const occupied = new Set(seats.map((seat) => seat.seatIndex));
  const seatIndex = Array.from({ length: MAX_SEATS }, (_, index) => index).find(
    (index) => !occupied.has(index),
  );
  if (seatIndex === undefined) fail("ROOM_FULL", "Room already has four seats.");
  return seatIndex;
}

function parseGameState(stateJson: string): GameState {
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

function serializeGameState(state: GameState): string {
  return JSON.stringify(state);
}

function gameStatus(state: GameState): "active" | "finished" {
  return state.status === "completed" ? "finished" : "active";
}

function roomViewStatus(status: MvpRoom["status"]): "completed" | "in_progress" | "waiting" {
  if (status === "active") return "in_progress";
  if (status === "finished") return "completed";
  return "waiting";
}

function settleBots(state: GameState): GameState {
  let nextState: GameState;
  try {
    nextState = advanceBots(state, MAX_BOT_ACTIONS);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bot advancement failed.";
    fail("BOT_ADVANCE_FAILED", message);
  }

  const playersById = new Map(nextState.players.map((player) => [player.id, player]));
  const botStillRequired = getRequiredPlayerIds(nextState).some(
    (playerId) => playersById.get(playerId)?.isBot,
  );
  if (nextState.status === "active" && botStillRequired) {
    fail("BOT_ADVANCE_FAILED", "Bot action limit was reached before human input.");
  }
  return nextState;
}

function playerViewJson(state: GameState, seat: MvpSeat): string {
  const playerId = String(seat._id);
  if (!state.players.some((player) => player.id === playerId)) {
    fail("CORRUPT_GAME_STATE", "Room seat is missing from the game state.");
  }
  return JSON.stringify(toPlayerView(state, playerId));
}

function serializeCommand(command: GameCommand): string {
  switch (command.kind) {
    case "place_settlement":
      return JSON.stringify({ kind: command.kind, vertexKey: command.vertexKey });
    case "place_road":
      return JSON.stringify({ edgeKey: command.edgeKey, kind: command.kind });
    case "discard":
      return JSON.stringify({
        kind: command.kind,
        resources: {
          brick: command.resources.brick,
          sheep: command.resources.sheep,
          stone: command.resources.stone,
          tree: command.resources.tree,
          wheat: command.resources.wheat,
        },
      });
    case "move_robber":
      return JSON.stringify({ kind: command.kind, tileId: command.tileId });
    case "steal":
      return JSON.stringify({ kind: command.kind, victimPlayerId: command.victimPlayerId });
    case "build_city":
      return JSON.stringify({ kind: command.kind, vertexKey: command.vertexKey });
    case "trade_bank":
      return JSON.stringify({ give: command.give, kind: command.kind, receive: command.receive });
    case "roll":
    case "end_turn":
      return JSON.stringify({ kind: command.kind });
  }
}

function commandText(command: GameCommand, displayName: string, nextState: GameState): string {
  switch (command.kind) {
    case "place_settlement":
      return `${displayName} placed a settlement.`;
    case "place_road":
      return `${displayName} placed a road.`;
    case "roll": {
      const roll = nextState.lastDiceRoll;
      return roll
        ? `${displayName} rolled ${roll.first} + ${roll.second} (${roll.sum}).`
        : `${displayName} rolled the dice.`;
    }
    case "discard":
      return `${displayName} discarded resources.`;
    case "move_robber":
      return `${displayName} moved the robber.`;
    case "steal":
      return `${displayName} stole a resource.`;
    case "build_city":
      return `${displayName} built a city.`;
    case "trade_bank":
      return `${displayName} traded ${command.give} for ${command.receive}.`;
    case "end_turn":
      return `${displayName} ended the turn.`;
  }
}

function appendBotActionSummary(text: string, actionCount: number): string {
  if (actionCount <= 0) return text;
  return `${text} ${actionCount} bot action${actionCount === 1 ? "" : "s"} resolved automatically.`;
}

function validateCommandBounds(command: GameCommand): void {
  const boundedKey = (value: string) => value.length > 0 && value.length <= 128;
  switch (command.kind) {
    case "place_settlement":
    case "build_city":
      if (!boundedKey(command.vertexKey)) fail("INVALID_COMMAND", "Invalid vertex key.");
      return;
    case "place_road":
      if (!boundedKey(command.edgeKey)) fail("INVALID_COMMAND", "Invalid edge key.");
      return;
    case "move_robber":
      if (!boundedKey(command.tileId)) fail("INVALID_COMMAND", "Invalid tile ID.");
      return;
    case "steal":
      if (!boundedKey(command.victimPlayerId)) fail("INVALID_COMMAND", "Invalid victim ID.");
      return;
    case "discard":
      if (!validInventory(command.resources)) fail("INVALID_COMMAND", "Invalid discard inventory.");
      return;
    case "trade_bank":
    case "roll":
    case "end_turn":
      return;
  }
}

function validInventory(inventory: ResourceInventory): boolean {
  return Object.values(inventory).every(
    (quantity) => Number.isSafeInteger(quantity) && quantity >= 0,
  );
}

async function createRoomRecord(
  ctx: MutationCtx,
  rawSessionId: string,
  rawDisplayName: string,
): Promise<{ code: string; room: MvpRoom; seat: MvpSeat }> {
  const sessionId = normalizeSessionId(rawSessionId);
  const displayName = normalizeDisplayName(rawDisplayName);
  const now = Date.now();
  const code = await allocateRoomCode(ctx, sessionId, now);
  const roomId = await ctx.db.insert("mvpRooms", {
    code,
    createdAt: now,
    status: "waiting",
    updatedAt: now,
  });
  const seatId = await ctx.db.insert("mvpSeats", {
    displayName,
    joinedAt: now,
    kind: "human",
    roomId,
    seatIndex: 0,
    sessionId,
  });
  await ctx.db.patch("mvpRooms", roomId, { hostSeatId: seatId });

  const room = await ctx.db.get("mvpRooms", roomId);
  const seat = await ctx.db.get("mvpSeats", seatId);
  if (!room || !seat) fail("ROOM_NOT_FOUND", "Room creation did not complete.");
  return { code, room, seat };
}

async function startRoomGame(ctx: MutationCtx, room: MvpRoom): Promise<MvpGame> {
  if (room.gameId) {
    const existingGame = await ctx.db.get("mvpGames", room.gameId);
    if (existingGame) return existingGame;
  }
  if (room.status === "finished") fail("GAME_ALREADY_FINISHED", "Game has already finished.");
  if (room.status !== "waiting") fail("ROOM_STARTED", "Room is no longer waiting.");
  if (!room.hostSeatId) fail("NOT_HOST", "Room does not have a host seat.");

  const now = Date.now();
  const existingSeats = await listSeats(ctx, room._id);
  const occupiedIndexes = new Set(existingSeats.map((seat) => seat.seatIndex));
  const botSeatIndexes = Array.from({ length: MAX_SEATS }, (_, index) => index).filter(
    (index) => !occupiedIndexes.has(index),
  );
  const botSeatIds = await Promise.all(
    botSeatIndexes.map((seatIndex) =>
      ctx.db.insert("mvpSeats", {
        displayName: `Bot ${seatIndex + 1}`,
        joinedAt: now,
        kind: "bot",
        roomId: room._id,
        seatIndex,
      }),
    ),
  );
  const botSeats = await Promise.all(botSeatIds.map((seatId) => ctx.db.get("mvpSeats", seatId)));
  const seats = [...existingSeats, ...botSeats.filter((seat) => seat !== null)].sort(
    (left, right) => left.seatIndex - right.seatIndex,
  );
  if (seats.length !== MAX_SEATS) fail("ROOM_FULL", "A game requires exactly four seats.");

  const players: GamePlayerInput[] = seats.map((seat) => ({
    displayName: seat.displayName,
    id: String(seat._id),
    isBot: seat.kind === "bot",
  }));
  const initialState = createDefaultGame(players, createPrivateGameSeed(), DEFAULT_VICTORY_POINTS);
  const state = settleBots(initialState);
  const gameId = await ctx.db.insert("mvpGames", {
    createdAt: now,
    revision: state.actionNumber,
    roomId: room._id,
    stateJson: serializeGameState(state),
    status: gameStatus(state),
    updatedAt: now,
  });
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

function transferPlayerToBot(state: GameState, seat: MvpSeat): GameState {
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
      candidate.id === playerId ? { ...candidate, isBot: true } : candidate,
    ),
  };
}

async function convertGameSeatToBot(
  ctx: MutationCtx,
  room: MvpRoom,
  seat: MvpSeat,
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

  const nextState = settleBots(transferPlayerToBot(state, seat));
  const now = Date.now();
  const botActionCount = nextState.actionNumber - state.actionNumber;
  await ctx.db.patch("mvpSeats", seat._id, {
    kind: "bot",
    sessionId: undefined,
  });
  await ctx.db.patch("mvpGames", game._id, {
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
    text: appendBotActionSummary(eventText, botActionCount),
  });
}

async function listGameEvents(ctx: ReadCtx, gameId: Id<"mvpGames">): Promise<GameEventView[]> {
  const events = await ctx.db
    .query("mvpGameActions")
    .withIndex("by_game_and_after_revision", (index) => index.eq("gameId", gameId))
    .order("desc")
    .take(40);
  return [...events].reverse().map((event) => ({
    createdAt: event.createdAt,
    sequence: event._creationTime,
    text: event.text,
  }));
}

async function roomView(ctx: ReadCtx, room: MvpRoom, seat: MvpSeat) {
  const seats = await listSeats(ctx, room._id);
  const members = seats.map((member) => ({
    controller: member.kind === "bot" ? ("bot" as const) : ("player" as const),
    displayName: member.displayName,
    id: String(member._id),
    playerColor: PLAYER_COLORS[member.seatIndex] ?? PLAYER_COLORS[0],
    ready: true,
    role: member._id === room.hostSeatId ? ("host" as const) : ("player" as const),
  }));
  const base = {
    code: room.code,
    events: [] as GameEventView[],
    isHost: seat._id === room.hostSeatId,
    members,
    rules: { victoryPoints: DEFAULT_VICTORY_POINTS },
    status: roomViewStatus(room.status),
  };
  if (!room.gameId) return base;

  const game = await ctx.db.get("mvpGames", room.gameId);
  if (!game) fail("CORRUPT_GAME_STATE", "Room points to a missing game.");
  const state = parseGameState(game.stateJson);
  const events = await listGameEvents(ctx, game._id);
  return {
    ...base,
    actionNumber: state.actionNumber,
    events,
    gameId: game._id,
    gameJson: playerViewJson(state, seat),
  };
}

export const createRoom = mutation({
  args: {
    displayName: v.string(),
    sessionId: v.string(),
  },
  returns: v.object({ code: v.string() }),
  handler: async (ctx, args) => {
    const { code } = await createRoomRecord(ctx, args.sessionId, args.displayName);
    return { code };
  },
});

export const joinRoom = mutation({
  args: {
    code: v.string(),
    displayName: v.string(),
    sessionId: v.string(),
  },
  returns: v.object({ code: v.string() }),
  handler: async (ctx, args) => {
    const room = await requireRoom(ctx, args.code);
    const sessionId = normalizeSessionId(args.sessionId);
    const existingSeat = await findSeatBySession(ctx, room._id, sessionId);
    if (existingSeat) return { code: room.code };
    if (room.status !== "waiting") fail("ROOM_STARTED", "Game has already started.");

    const seats = await listSeats(ctx, room._id);
    const seatIndex = nextOpenSeatIndex(seats);
    await ctx.db.insert("mvpSeats", {
      displayName: normalizeDisplayName(args.displayName),
      joinedAt: Date.now(),
      kind: "human",
      roomId: room._id,
      seatIndex,
      sessionId,
    });
    await ctx.db.patch("mvpRooms", room._id, { updatedAt: Date.now() });
    return { code: room.code };
  },
});

export const leaveRoom = mutation({
  args: {
    code: v.string(),
    sessionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const room = await requireRoom(ctx, args.code);
    const seat = await requireHumanSeat(ctx, room._id, args.sessionId);

    if (room.status === "waiting") {
      const seats = await listSeats(ctx, room._id);
      if (seat._id === room.hostSeatId) {
        await Promise.all(seats.map((waitingSeat) => ctx.db.delete("mvpSeats", waitingSeat._id)));
        await ctx.db.delete("mvpRooms", room._id);
        return null;
      }

      await ctx.db.delete("mvpSeats", seat._id);
      await ctx.db.patch("mvpRooms", room._id, { updatedAt: Date.now() });
      return null;
    }

    let eventText = `${seat.displayName} left the game and is now controlled by a bot.`;
    if (room.status === "active" && seat._id === room.hostSeatId) {
      const seats = await listSeats(ctx, room._id);
      const nextHost = seats.find(
        (candidate) => candidate.kind === "human" && candidate._id !== seat._id,
      );
      if (nextHost) {
        await ctx.db.patch("mvpRooms", room._id, { hostSeatId: nextHost._id });
        eventText = `${eventText} ${nextHost.displayName} is now the room host.`;
      }
    }

    await convertGameSeatToBot(ctx, room, seat, eventText);
    return null;
  },
});

export const replacePlayerWithBot = mutation({
  args: {
    code: v.string(),
    sessionId: v.string(),
    targetSeatId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const room = await requireRoom(ctx, args.code);
    const hostSeat = await requireHumanSeat(ctx, room._id, args.sessionId);
    if (hostSeat._id !== room.hostSeatId) {
      fail("NOT_HOST", "Only the room host can replace a player with a bot.");
    }

    const targetSeatId = normalizeSeatId(args.targetSeatId);
    const seats = await listSeats(ctx, room._id);
    const targetSeat = seats.find((seat) => String(seat._id) === targetSeatId);
    if (!targetSeat) {
      fail("TARGET_SEAT_NOT_FOUND", "Target seat does not belong to this room.");
    }
    if (targetSeat._id === hostSeat._id) {
      fail("CANNOT_REPLACE_SELF", "The host cannot replace their own seat.");
    }
    if (targetSeat._id === room.hostSeatId) {
      fail("CANNOT_REPLACE_HOST", "The host seat cannot be replaced.");
    }
    if (targetSeat.kind !== "human") {
      fail("TARGET_NOT_HUMAN", "Target seat is not controlled by a human player.");
    }

    if (room.status === "waiting") {
      await ctx.db.delete("mvpSeats", targetSeat._id);
      await ctx.db.patch("mvpRooms", room._id, { updatedAt: Date.now() });
      return null;
    }
    if (room.status === "finished") {
      fail("GAME_ALREADY_FINISHED", "A completed game cannot replace player control.");
    }

    await convertGameSeatToBot(
      ctx,
      room,
      targetSeat,
      `${hostSeat.displayName} replaced ${targetSeat.displayName} with a bot.`,
    );
    return null;
  },
});

export const startGame = mutation({
  args: {
    code: v.string(),
    sessionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const room = await requireRoom(ctx, args.code);
    const seat = await requireHumanSeat(ctx, room._id, args.sessionId);
    if (seat._id !== room.hostSeatId) fail("NOT_HOST", "Only the room host can start the game.");
    await startRoomGame(ctx, room);
    return null;
  },
});

export const createQuickGame = mutation({
  args: {
    displayName: v.string(),
    sessionId: v.string(),
  },
  returns: v.object({ code: v.string() }),
  handler: async (ctx, args) => {
    const { code, room } = await createRoomRecord(ctx, args.sessionId, args.displayName);
    await startRoomGame(ctx, room);
    return { code };
  },
});

export const getRoom = query({
  args: {
    code: v.string(),
    sessionId: v.string(),
  },
  returns: v.union(v.null(), roomViewValidator),
  handler: async (ctx, args) => {
    const code = normalizeRoomCode(args.code);
    const sessionId = normalizeSessionId(args.sessionId);
    const room = await findRoom(ctx, code);
    if (!room) return null;
    const seat = await findSeatBySession(ctx, room._id, sessionId);
    if (!seat || seat.kind !== "human") return null;
    return await roomView(ctx, room, seat);
  },
});

export const command = mutation({
  args: {
    clientActionId: v.string(),
    code: v.string(),
    command: commandValidator,
    expectedActionNumber: v.number(),
    sessionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const room = await requireRoom(ctx, args.code);
    const seat = await requireHumanSeat(ctx, room._id, args.sessionId);
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

    let nextState: GameState;
    try {
      nextState = settleBots(applyCommand(state, String(seat._id), command));
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

    if (nextState.actionNumber <= state.actionNumber) {
      fail("CORRUPT_GAME_STATE", "Accepted command did not advance the action number.");
    }
    const now = Date.now();
    await ctx.db.patch("mvpGames", game._id, {
      revision: nextState.actionNumber,
      stateJson: serializeGameState(nextState),
      status: gameStatus(nextState),
      updatedAt: now,
    });
    await ctx.db.insert("mvpGameActions", {
      actorSeatId: seat._id,
      afterRevision: nextState.actionNumber,
      beforeRevision: state.actionNumber,
      clientActionId,
      commandJson,
      createdAt: now,
      gameId: game._id,
      text: appendBotActionSummary(
        commandText(command, seat.displayName, nextState),
        nextState.actionNumber - state.actionNumber - 1,
      ),
    });
    await ctx.db.patch("mvpRooms", room._id, {
      status: gameStatus(nextState),
      updatedAt: now,
    });
    return null;
  },
});
