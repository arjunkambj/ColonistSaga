import type { Infer } from "convex/values";

import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { roomViewValidator } from "./validators";

export type ReadCtx = Pick<QueryCtx, "db">;
export type WriteCtx = MutationCtx;
export type RoomDoc = Doc<"rooms">;
export type SeatDoc = Doc<"seats">;
export type GameDoc = Doc<"games">;
export type RoomId = Id<"rooms">;
export type GameId = Id<"games">;
export type SeatId = Id<"seats">;
export type RoomView = Infer<typeof roomViewValidator>;
export type GameEventView = {
  createdAt: number;
  sequence: number;
  text: string;
};
