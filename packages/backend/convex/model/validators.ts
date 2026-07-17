import { v } from "convex/values";

import {
  baseGameSettingsValidator,
  botDifficultyValidator,
  resourceInventoryValidator,
  resourceTypeValidator,
} from "../schema";

export const gameEventViewValidator = v.object({
  createdAt: v.number(),
  sequence: v.number(),
  text: v.string(),
});

export const roomMemberViewValidator = v.object({
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

export const roomViewValidator = v.object({
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

export const commandValidator = v.union(
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
