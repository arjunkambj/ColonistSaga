import {
  DEFAULT_BASE_GAME_SETTINGS,
  applyCommand,
  chooseAutomatedCommand,
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
  ResourceInventory,
} from "@catansaga/game";
import { ConvexError, v } from "convex/values";
import type { Infer } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { requireCurrentHexclaveUser } from "./hexclave/auth";
import type { HexclaveUser } from "./hexclave/auth";
import {
  earliestActionDeadlineAt,
  isActionDeadlineExpired,
  isScheduledActionDue,
  nextScheduledActionAt,
  nextTurnDeadlineAt,
} from "../lib/mvp-scheduling";
import {
  baseGameSettingsValidator,
  botDifficultyValidator,
  resourceInventoryValidator,
  resourceTypeValidator,
} from "./schema";

const MAX_SEATS = 4;
const DEFAULT_BOT_DIFFICULTY: BotDifficulty = "medium";
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
  seatIndex: v.number(),
});

const roomViewValidator = v.object({
  actionNumber: v.optional(v.number()),
  botDifficulty: botDifficultyValidator,
  botThinking: v.boolean(),
  code: v.string(),
  events: v.array(gameEventViewValidator),
  gameId: v.optional(v.id("mvpGames")),
  gameJson: v.optional(v.string()),
  isHost: v.boolean(),
  members: v.array(roomMemberViewValidator),
  nextActionAt: v.optional(v.number()),
  rules: v.object({ victoryPoints: v.number() }),
  settings: baseGameSettingsValidator,
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
  v.object({
    give: resourceInventoryValidator,
    kind: v.literal("propose_trade"),
    recipientPlayerIds: v.array(v.string()),
    want: resourceInventoryValidator,
  }),
  v.object({
    accept: v.boolean(),
    kind: v.literal("respond_trade"),
    offerActionNumber: v.number(),
  }),
  v.object({
    kind: v.literal("cancel_trade"),
    offerActionNumber: v.number(),
  }),
  v.object({ kind: v.literal("end_turn") }),
);

type ReadCtx = Pick<QueryCtx, "db">;
type MvpRoom = Doc<"mvpRooms">;
type MvpSeat = Doc<"mvpSeats">;
type MvpGame = Doc<"mvpGames">;
type RoomView = Infer<typeof roomViewValidator>;
type GameEventView = {
  createdAt: number;
  sequence: number;
  text: string;
};

function fail(code: string, message: string): never {
  throw new ConvexError({ code, message });
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

function roomCodeCandidate(authUserId: string, now: number, attempt: number): string {
  let random = hashText(`${authUserId}:${now}:${attempt}`);
  return Array.from({ length: ROOM_CODE_LENGTH }, () => {
    random ^= random << 13;
    random ^= random >>> 17;
    random ^= random << 5;
    return ROOM_CODE_ALPHABET[(random >>> 0) % ROOM_CODE_ALPHABET.length];
  }).join("");
}

async function allocateRoomCode(ctx: ReadCtx, authUserId: string, now: number): Promise<string> {
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const code = roomCodeCandidate(authUserId, now, attempt);
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

async function findSeatByAuthUser(
  ctx: ReadCtx,
  roomId: Id<"mvpRooms">,
  authUserId: string,
): Promise<MvpSeat | null> {
  return await ctx.db
    .query("mvpSeats")
    .withIndex("by_room_and_auth_user_id", (index) =>
      index.eq("roomId", roomId).eq("authUserId", authUserId),
    )
    .unique();
}

async function requireHumanSeat(
  ctx: ReadCtx,
  roomId: Id<"mvpRooms">,
  authUserId: string,
): Promise<MvpSeat> {
  const seat = await findSeatByAuthUser(ctx, roomId, authUserId);
  if (!seat || seat.kind !== "human") {
    fail("NOT_ROOM_MEMBER", "Your account does not own a human seat in this room.");
  }
  return seat;
}

async function requireWaitingHost(
  ctx: ReadCtx,
  rawCode: string,
  authUserId: string,
): Promise<{ hostSeat: MvpSeat; room: MvpRoom }> {
  const room = await requireRoom(ctx, rawCode);
  const hostSeat = await requireHumanSeat(ctx, room._id, authUserId);
  if (hostSeat._id !== room.hostSeatId) {
    fail("NOT_HOST", "Only the room host can change lobby settings.");
  }
  if (room.status !== "waiting" || room.gameId) {
    fail("ROOM_STARTED", "Lobby settings can only be changed before the game starts.");
  }
  return { hostSeat, room };
}

function nextOpenSeatIndex(seats: readonly MvpSeat[], maxPlayers: number): number {
  const occupied = new Set(seats.map((seat) => seat.seatIndex));
  const seatIndex = Array.from({ length: maxPlayers }, (_, index) => index).find(
    (index) => !occupied.has(index),
  );
  if (seatIndex === undefined) fail("ROOM_FULL", "Room already has its maximum seats.");
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

function validateGameSettings(settings: BaseGameSettings): BaseGameSettings {
  if (
    !Number.isSafeInteger(settings.victoryPoints) ||
    settings.victoryPoints < 3 ||
    settings.victoryPoints > 13
  ) {
    fail("INVALID_SETTINGS", "Victory points must be an integer from 3 to 13.");
  }
  if (
    !Number.isSafeInteger(settings.discardLimit) ||
    settings.discardLimit < 5 ||
    settings.discardLimit > 20
  ) {
    fail("INVALID_SETTINGS", "Discard limit must be an integer from 5 to 20.");
  }
  if (![0, 30, 60, 90, 120].includes(settings.turnTimerSeconds)) {
    fail("INVALID_SETTINGS", "Turn timer must be 0, 30, 60, 90, or 120 seconds.");
  }
  if (settings.maxPlayers !== 3 && settings.maxPlayers !== 4) {
    fail("INVALID_SETTINGS", "Player count must be 3 or 4.");
  }
  return { ...settings };
}

function requiredAutomatedActor(state: GameState) {
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

async function scheduleNextAutomatedAction(
  ctx: MutationCtx,
  gameId: Id<"mvpGames">,
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
    await ctx.scheduler.runAt(nextActionAt, internal.mvp.runAutomatedAction, {
      expectedActionNumber: state.actionNumber,
      expectedActorPlayerId: actor.playerId,
      gameId,
      scheduledFor: nextActionAt,
    });
  }
  return { nextActionAt, turnDeadlineAt };
}

function playerViewJson(state: GameState, seat: MvpSeat): string {
  const playerId = String(seat._id);
  if (!state.players.some((player) => player.id === playerId)) {
    fail("CORRUPT_GAME_STATE", "Room seat is missing from the game state.");
  }
  return JSON.stringify(toPlayerView(state, playerId));
}

function serializableInventory(inventory: ResourceInventory) {
  return {
    brick: inventory.brick,
    sheep: inventory.sheep,
    stone: inventory.stone,
    tree: inventory.tree,
    wheat: inventory.wheat,
  };
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
        resources: serializableInventory(command.resources),
      });
    case "move_robber":
      return JSON.stringify({ kind: command.kind, tileId: command.tileId });
    case "steal":
      return JSON.stringify({ kind: command.kind, victimPlayerId: command.victimPlayerId });
    case "build_city":
      return JSON.stringify({ kind: command.kind, vertexKey: command.vertexKey });
    case "trade_bank":
      return JSON.stringify({ give: command.give, kind: command.kind, receive: command.receive });
    case "propose_trade":
      return JSON.stringify({
        give: serializableInventory(command.give),
        kind: command.kind,
        recipientPlayerIds: [...command.recipientPlayerIds],
        want: serializableInventory(command.want),
      });
    case "respond_trade":
      return JSON.stringify({
        accept: command.accept,
        kind: command.kind,
        offerActionNumber: command.offerActionNumber,
      });
    case "cancel_trade":
      return JSON.stringify({
        kind: command.kind,
        offerActionNumber: command.offerActionNumber,
      });
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
    case "propose_trade":
      return `${displayName} proposed a player trade.`;
    case "respond_trade":
      return command.accept
        ? `${displayName} accepted a player trade.`
        : `${displayName} declined a player trade.`;
    case "cancel_trade":
      return `${displayName} cancelled a player trade.`;
    case "end_turn":
      return `${displayName} ended the turn.`;
  }
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
    case "propose_trade":
      if (!validInventory(command.give) || !validInventory(command.want)) {
        fail("INVALID_COMMAND", "Invalid player trade inventory.");
      }
      if (
        command.recipientPlayerIds.length < 1 ||
        command.recipientPlayerIds.length >= MAX_SEATS ||
        new Set(command.recipientPlayerIds).size !== command.recipientPlayerIds.length ||
        command.recipientPlayerIds.some((playerId) => !boundedKey(playerId))
      ) {
        fail("INVALID_COMMAND", "Invalid player trade recipients.");
      }
      return;
    case "respond_trade":
    case "cancel_trade":
      validateActionNumber(command.offerActionNumber);
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

async function persistAppliedCommand(
  ctx: MutationCtx,
  game: MvpGame,
  state: GameState,
  nextState: GameState,
  actorSeat: MvpSeat,
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

function validateBotCount(value: number, maxPlayers: number): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > maxPlayers - 1) {
    fail("INVALID_BOT_COUNT", `Bot count must be an integer from 0 to ${maxPlayers - 1}.`);
  }
  return value;
}

async function setWaitingBotCount(
  ctx: MutationCtx,
  room: MvpRoom,
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

async function fitWaitingSeatsToSettings(
  ctx: MutationCtx,
  room: MvpRoom,
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

async function createRoomRecord(
  ctx: MutationCtx,
  user: HexclaveUser,
  rawDisplayName: string,
  settings: BaseGameSettings = DEFAULT_BASE_GAME_SETTINGS,
  botDifficulty: BotDifficulty = DEFAULT_BOT_DIFFICULTY,
): Promise<{ code: string; room: MvpRoom; seat: MvpSeat }> {
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

async function startRoomGame(ctx: MutationCtx, room: MvpRoom): Promise<MvpGame> {
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

function transferPlayerToBot(
  state: GameState,
  seat: MvpSeat,
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

async function roomView(ctx: ReadCtx, room: MvpRoom, seat: MvpSeat): Promise<RoomView> {
  const seats = await listSeats(ctx, room._id);
  const members = seats.map((member) => ({
    controller: member.kind === "bot" ? ("bot" as const) : ("player" as const),
    displayName: member.displayName,
    id: String(member._id),
    playerColor: PLAYER_COLORS[member.seatIndex] ?? PLAYER_COLORS[0],
    ready: true,
    role: member._id === room.hostSeatId ? ("host" as const) : ("player" as const),
    seatIndex: member.seatIndex,
  }));
  const base: RoomView = {
    botDifficulty: room.botDifficulty,
    botThinking: false,
    code: room.code,
    events: [] as GameEventView[],
    isHost: seat._id === room.hostSeatId,
    members,
    rules: { victoryPoints: room.settings.victoryPoints },
    settings: room.settings,
    status: roomViewStatus(room.status),
  };
  if (!room.gameId) return base;

  const game = await ctx.db.get("mvpGames", room.gameId);
  if (!game) fail("CORRUPT_GAME_STATE", "Room points to a missing game.");
  const state = parseGameState(game.stateJson);
  const events = await listGameEvents(ctx, game._id);
  const automatedActor = requiredAutomatedActor(state);
  return {
    ...base,
    actionNumber: state.actionNumber,
    botDifficulty: game.botDifficulty,
    botThinking: automatedActor?.isBot === true && game.nextActionAt !== undefined,
    events,
    gameId: game._id,
    gameJson: playerViewJson(state, seat),
    nextActionAt: game.nextActionAt,
    rules: { victoryPoints: game.settings.victoryPoints },
    settings: game.settings,
  };
}

export const createRoom = mutation({
  args: {
    displayName: v.string(),
  },
  returns: v.object({ code: v.string() }),
  handler: async (ctx, args) => {
    const user = await requireCurrentHexclaveUser(ctx);
    const { code } = await createRoomRecord(ctx, user, args.displayName);
    return { code };
  },
});

export const updateLobbyConfiguration = mutation({
  args: {
    botCount: v.number(),
    botDifficulty: botDifficultyValidator,
    code: v.string(),
    settings: baseGameSettingsValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireCurrentHexclaveUser(ctx);
    const { room } = await requireWaitingHost(ctx, args.code, user.id);
    const settings = validateGameSettings(args.settings);
    await fitWaitingSeatsToSettings(ctx, room, settings);
    await setWaitingBotCount(ctx, { ...room, settings }, args.botCount);
    await ctx.db.patch("mvpRooms", room._id, {
      botDifficulty: args.botDifficulty,
      settings,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const joinRoom = mutation({
  args: {
    code: v.string(),
    displayName: v.string(),
  },
  returns: v.object({ code: v.string() }),
  handler: async (ctx, args) => {
    const user = await requireCurrentHexclaveUser(ctx);
    const room = await requireRoom(ctx, args.code);
    const existingSeat = await findSeatByAuthUser(ctx, room._id, user.id);
    if (existingSeat) return { code: room.code };
    if (room.status !== "waiting") fail("ROOM_STARTED", "Game has already started.");

    const seats = await listSeats(ctx, room._id);
    const displayName = normalizeDisplayName(args.displayName);
    const now = Date.now();
    if (seats.length < room.settings.maxPlayers) {
      const seatIndex = nextOpenSeatIndex(seats, room.settings.maxPlayers);
      await ctx.db.insert("mvpSeats", {
        authUserId: user.id,
        displayName,
        joinedAt: now,
        kind: "human",
        roomId: room._id,
        seatIndex,
      });
    } else {
      const replaceableBot = seats
        .filter((seat) => seat.kind === "bot")
        .sort((left, right) => right.seatIndex - left.seatIndex)[0];
      if (!replaceableBot) fail("ROOM_FULL", "Room is full.");
      await ctx.db.patch("mvpSeats", replaceableBot._id, {
        authUserId: user.id,
        displayName,
        joinedAt: now,
        kind: "human",
      });
    }
    await ctx.db.patch("mvpRooms", room._id, { updatedAt: Date.now() });
    return { code: room.code };
  },
});

export const leaveRoom = mutation({
  args: {
    code: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireCurrentHexclaveUser(ctx);
    const room = await requireRoom(ctx, args.code);
    const seat = await requireHumanSeat(ctx, room._id, user.id);

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

    const seats = await listSeats(ctx, room._id);
    const remainingHumans = seats.filter(
      (candidate) => candidate.kind === "human" && candidate._id !== seat._id,
    );
    if (room.status === "active" && remainingHumans.length === 0) {
      if (!room.gameId) fail("CORRUPT_GAME_STATE", "Active room does not have a game.");
      const game = await ctx.db.get("mvpGames", room.gameId);
      if (!game) fail("CORRUPT_GAME_STATE", "Room points to a missing game.");
      const state = parseGameState(game.stateJson);
      if (game.revision !== state.actionNumber) {
        fail("CORRUPT_GAME_STATE", "Stored game revision does not match its state.");
      }
      const nextState: GameState = {
        ...transferPlayerToBot(state, seat, room.botDifficulty),
        phase: { kind: "finished" },
        status: "completed",
        tradeOffer: null,
        winnerPlayerId: null,
      };
      const now = Date.now();
      await ctx.db.patch("mvpSeats", seat._id, {
        authUserId: undefined,
        displayName: `Bot ${seat.seatIndex + 1}`,
        kind: "bot",
      });
      await ctx.db.patch("mvpGames", game._id, {
        nextActionAt: undefined,
        stateJson: serializeGameState(nextState),
        status: gameStatus(nextState),
        turnDeadlineAt: undefined,
        updatedAt: now,
      });
      await ctx.db.patch("mvpRooms", room._id, {
        status: gameStatus(nextState),
        updatedAt: now,
      });
      await ctx.db.insert("mvpGameActions", {
        actorSeatId: seat._id,
        afterRevision: game.revision,
        beforeRevision: game.revision,
        clientActionId: `system:game-abandoned:${game.revision}`,
        commandJson: JSON.stringify({ kind: "game_abandoned" }),
        createdAt: now,
        gameId: game._id,
        text: `${seat.displayName} left. The game closed because no human players remain.`,
      });
      return null;
    }

    let eventText = `${seat.displayName} left the game and is now controlled by a bot.`;
    if (room.status === "active" && seat._id === room.hostSeatId) {
      const nextHost = remainingHumans[0];
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
    targetSeatId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireCurrentHexclaveUser(ctx);
    const room = await requireRoom(ctx, args.code);
    const hostSeat = await requireHumanSeat(ctx, room._id, user.id);
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
      await ctx.db.patch("mvpSeats", targetSeat._id, {
        authUserId: undefined,
        displayName: `Bot ${targetSeat.seatIndex + 1}`,
        joinedAt: Date.now(),
        kind: "bot",
      });
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

export const getRoom = query({
  args: {
    code: v.string(),
  },
  returns: v.union(v.null(), roomViewValidator),
  handler: async (ctx, args) => {
    const user = await requireCurrentHexclaveUser(ctx);
    const code = normalizeRoomCode(args.code);
    const room = await findRoom(ctx, code);
    if (!room) return null;
    const seat = await findSeatByAuthUser(ctx, room._id, user.id);
    if (!seat || seat.kind !== "human") return null;
    return await roomView(ctx, room, seat);
  },
});

export const runAutomatedAction = internalMutation({
  args: {
    expectedActionNumber: v.number(),
    expectedActorPlayerId: v.optional(v.string()),
    gameId: v.id("mvpGames"),
    scheduledFor: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    if (args.expectedActorPlayerId === undefined || args.scheduledFor === undefined) {
      return null;
    }
    const expectedActionNumber = validateActionNumber(args.expectedActionNumber);
    const game = await ctx.db.get("mvpGames", args.gameId);
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

export const command = mutation({
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

    let nextState: GameState;
    try {
      nextState = applyCommand(state, String(seat._id), command);
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
