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

const roomStatusValidator = v.union(
  v.literal("waiting"),
  v.literal("active"),
  v.literal("finished"),
);

const seatKindValidator = v.union(v.literal("human"), v.literal("bot"));
const gameStatusValidator = v.union(v.literal("active"), v.literal("finished"));

export default defineSchema({
  mvpRooms: defineTable({
    code: v.string(),
    createdAt: v.number(),
    gameId: v.optional(v.id("mvpGames")),
    hostSeatId: v.optional(v.id("mvpSeats")),
    status: roomStatusValidator,
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_status_and_updated_at", ["status", "updatedAt"]),

  mvpSeats: defineTable({
    displayName: v.string(),
    joinedAt: v.number(),
    kind: seatKindValidator,
    roomId: v.id("mvpRooms"),
    seatIndex: v.number(),
    sessionId: v.optional(v.string()),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_seat_index", ["roomId", "seatIndex"])
    .index("by_room_and_session_id", ["roomId", "sessionId"]),

  mvpGames: defineTable({
    createdAt: v.number(),
    revision: v.number(),
    roomId: v.id("mvpRooms"),
    stateJson: v.string(),
    status: gameStatusValidator,
    updatedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_status_and_updated_at", ["status", "updatedAt"]),

  mvpGameActions: defineTable({
    actorSeatId: v.id("mvpSeats"),
    afterRevision: v.number(),
    beforeRevision: v.number(),
    clientActionId: v.string(),
    commandJson: v.string(),
    createdAt: v.number(),
    gameId: v.id("mvpGames"),
    text: v.string(),
  })
    .index("by_game_and_before_revision", ["gameId", "beforeRevision"])
    .index("by_game_and_after_revision", ["gameId", "afterRevision"])
    .index("by_game_and_client_action_id", ["gameId", "clientActionId"]),
});
