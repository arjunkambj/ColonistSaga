import { MAX_SEATS, ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from "./constants";
import { fail } from "./errors";
import { normalizeRoomCode } from "./normalize";
import type { ReadCtx, RoomDoc, RoomId, SeatDoc } from "./types";

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

export async function allocateRoomCode(
  ctx: ReadCtx,
  authUserId: string,
  now: number,
): Promise<string> {
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

export async function findRoom(ctx: ReadCtx, code: string): Promise<RoomDoc | null> {
  return await ctx.db
    .query("mvpRooms")
    .withIndex("by_code", (index) => index.eq("code", code))
    .unique();
}

export async function requireRoom(ctx: ReadCtx, rawCode: string): Promise<RoomDoc> {
  const code = normalizeRoomCode(rawCode);
  const room = await findRoom(ctx, code);
  if (!room) fail("ROOM_NOT_FOUND", "Room not found.");
  return room;
}

export async function listSeats(ctx: ReadCtx, roomId: RoomId): Promise<SeatDoc[]> {
  const seats = await ctx.db
    .query("mvpSeats")
    .withIndex("by_room", (index) => index.eq("roomId", roomId))
    .take(MAX_SEATS + 1);
  if (seats.length > MAX_SEATS) {
    fail("CORRUPT_GAME_STATE", "Room contains more than four seats.");
  }
  return [...seats].sort((left, right) => left.seatIndex - right.seatIndex);
}

export async function findSeatByAuthUser(
  ctx: ReadCtx,
  roomId: RoomId,
  authUserId: string,
): Promise<SeatDoc | null> {
  return await ctx.db
    .query("mvpSeats")
    .withIndex("by_room_and_auth_user_id", (index) =>
      index.eq("roomId", roomId).eq("authUserId", authUserId),
    )
    .unique();
}

export async function requireHumanSeat(
  ctx: ReadCtx,
  roomId: RoomId,
  authUserId: string,
): Promise<SeatDoc> {
  const seat = await findSeatByAuthUser(ctx, roomId, authUserId);
  if (!seat || seat.kind !== "human") {
    fail("NOT_ROOM_MEMBER", "Your account does not own a human seat in this room.");
  }
  return seat;
}

export async function requireWaitingHost(
  ctx: ReadCtx,
  rawCode: string,
  authUserId: string,
): Promise<{ hostSeat: SeatDoc; room: RoomDoc }> {
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

export function nextOpenSeatIndex(seats: readonly SeatDoc[], maxPlayers: number): number {
  const occupied = new Set(seats.map((seat) => seat.seatIndex));
  const seatIndex = Array.from({ length: maxPlayers }, (_, index) => index).find(
    (index) => !occupied.has(index),
  );
  if (seatIndex === undefined) fail("ROOM_FULL", "Room already has its maximum seats.");
  return seatIndex;
}
