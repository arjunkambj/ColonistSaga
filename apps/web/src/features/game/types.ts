import type { api } from "@catansaga/backend/convex/_generated/api";
import type { PlayerGameView } from "@catansaga/game";
import type { FunctionReturnType } from "convex/server";

export type RoomView = NonNullable<FunctionReturnType<typeof api.mvp.getRoom>>;
export type RoomEventView = RoomView["events"][number];

export function parsePlayerView(gameJson: string | undefined): PlayerGameView | null {
  if (!gameJson) {
    return null;
  }

  try {
    const value: unknown = JSON.parse(gameJson);
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
