export function toActionableError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  const normalizedMessage = message.toLowerCase();
  if (
    normalizedMessage.includes("too_many_players") ||
    normalizedMessage.includes("more human players")
  ) {
    return "Remove or replace a player before reducing the table size.";
  }
  if (normalizedMessage.includes("room full")) {
    return "That room is full. Ask the host for a new room code or a larger table.";
  }
  if (normalizedMessage.includes("not found") || normalizedMessage.includes("room code")) {
    return "That room could not be found. Check the six-character code and try again.";
  }
  if (normalizedMessage.includes("already started")) {
    return "That game has already started. Ask the host to create a new room.";
  }
  if (normalizedMessage.includes("only the room host")) {
    return "Only the room host can start this game.";
  }
  return "The request could not be completed. Check your connection and try again.";
}
