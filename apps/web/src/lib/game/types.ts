import type { api } from "@colonistsaga/backend/convex/_generated/api";
import type { PlayerGameView } from "@colonistsaga/game";
import type { FunctionReturnType } from "convex/server";

export type RoomView = NonNullable<FunctionReturnType<typeof api.rooms.getRoom>>;
export type RoomEventView = RoomView["events"][number];

export function parsePlayerView(serializedGame: string | undefined): PlayerGameView | null {
  if (!serializedGame) {
    return null;
  }

  try {
    const value: unknown = JSON.parse(serializedGame);
    if (!value || typeof value !== "object") {
      return null;
    }

    const candidate = value as Record<string, unknown>;
    if (!candidate.board || !Array.isArray(candidate.players)) {
      return null;
    }

    return value as PlayerGameView;
  } catch {
    return null;
  }
}
