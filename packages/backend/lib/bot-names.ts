import { chooseBotName } from "@colonistsaga/game";

import type { RoomId, SeatDoc } from "../convex/model/types";

export function createBotDisplayName(
  roomId: RoomId,
  seatIndex: number,
  seats: readonly SeatDoc[],
  randomSalt = Date.now(),
): string {
  return chooseBotName(
    `${String(roomId)}:${seatIndex}:${randomSalt}`,
    seats.map((seat) => seat.displayName),
  );
}
