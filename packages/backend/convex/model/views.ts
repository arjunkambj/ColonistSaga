import { PLAYER_COLORS } from "./constants";
import { fail } from "./errors";
import {
  parseGameState,
  playerViewJson,
  requiredAutomatedActor,
  roomViewStatus,
} from "./gameState";
import { listSeats } from "./roomQueries";
import type { GameEventView, GameId, ReadCtx, RoomDoc, RoomView, SeatDoc } from "./types";

async function listGameEvents(ctx: ReadCtx, gameId: GameId): Promise<GameEventView[]> {
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

export async function toRoomView(ctx: ReadCtx, room: RoomDoc, seat: SeatDoc): Promise<RoomView> {
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
