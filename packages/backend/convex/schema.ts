import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const resourceInventoryValidator = v.object({
  brick: v.number(),
  sheep: v.number(),
  stone: v.number(),
  tree: v.number(),
  wheat: v.number(),
});

export const resourceTypeValidator = v.union(
  v.literal("brick"),
  v.literal("sheep"),
  v.literal("stone"),
  v.literal("tree"),
  v.literal("wheat"),
);

export const baseGameSettingsValidator = v.object({
  balancedDice: v.boolean(),
  discardLimit: v.number(),
  friendlyRobber: v.boolean(),
  hideBankCards: v.boolean(),
  map: v.literal("base"),
  maxPlayers: v.union(v.literal(3), v.literal(4)),
  turnTimerSeconds: v.union(
    v.literal(0),
    v.literal(30),
    v.literal(60),
    v.literal(90),
    v.literal(120),
  ),
  victoryPoints: v.number(),
});

export const botDifficultyValidator = v.union(
  v.literal("easy"),
  v.literal("medium"),
  v.literal("hard"),
);

const roomStatusValidator = v.union(
  v.literal("waiting"),
  v.literal("active"),
  v.literal("finished"),
);

const seatKindValidator = v.union(v.literal("human"), v.literal("bot"));
const gameStatusValidator = v.union(v.literal("active"), v.literal("finished"));

export default defineSchema({
  rooms: defineTable({
    botDifficulty: botDifficultyValidator,
    code: v.string(),
    createdAt: v.number(),
    gameId: v.optional(v.id("games")),
    hostSeatId: v.optional(v.id("seats")),
    settings: baseGameSettingsValidator,
    status: roomStatusValidator,
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_status_and_updated_at", ["status", "updatedAt"]),

  seats: defineTable({
    authUserId: v.optional(v.string()),
    displayName: v.string(),
    joinedAt: v.number(),
    kind: seatKindValidator,
    roomId: v.id("rooms"),
    seatIndex: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_seat_index", ["roomId", "seatIndex"])
    .index("by_room_and_auth_user_id", ["roomId", "authUserId"]),

  games: defineTable({
    botDifficulty: botDifficultyValidator,
    createdAt: v.number(),
    nextActionAt: v.optional(v.number()),
    revision: v.number(),
    roomId: v.id("rooms"),
    settings: baseGameSettingsValidator,
    stateJson: v.string(),
    status: gameStatusValidator,
    turnDeadlineAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_status_and_updated_at", ["status", "updatedAt"]),

  gameActions: defineTable({
    actorSeatId: v.id("seats"),
    afterRevision: v.number(),
    beforeRevision: v.number(),
    clientActionId: v.string(),
    commandJson: v.string(),
    createdAt: v.number(),
    gameId: v.id("games"),
    text: v.string(),
  })
    .index("by_game_and_before_revision", ["gameId", "beforeRevision"])
    .index("by_game_and_after_revision", ["gameId", "afterRevision"])
    .index("by_game_and_client_action_id", ["gameId", "clientActionId"]),
});
