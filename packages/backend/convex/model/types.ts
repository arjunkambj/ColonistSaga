import type { Infer } from "convex/values";

import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { roomViewValidator } from "./validators";

export type ReadCtx = Pick<QueryCtx, "db">;
export type WriteCtx = MutationCtx;
export type RoomDoc = Doc<"mvpRooms">;
export type SeatDoc = Doc<"mvpSeats">;
export type GameDoc = Doc<"mvpGames">;
export type RoomId = Id<"mvpRooms">;
export type GameId = Id<"mvpGames">;
export type SeatId = Id<"mvpSeats">;
export type RoomView = Infer<typeof roomViewValidator>;
export type GameEventView = {
  createdAt: number;
  sequence: number;
  text: string;
};
