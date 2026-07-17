import { createDefaultBoard } from "./board";
import { BANK_RESOURCE_COUNT, INITIAL_PIECES } from "./constants";
import { emptyInventory, filledInventory } from "./resources";
import { GameRuleError } from "./types";
import type { GamePlayerInput, GameState } from "./types";

const MINIMUM_VICTORY_POINTS = 3;
const MAXIMUM_BUILDING_VICTORY_POINTS = 13;

export function createDefaultGame(
  players: readonly GamePlayerInput[],
  seed: string,
  victoryPoints = 10,
): GameState {
  if (players.length !== 4) {
    throw new GameRuleError("INVALID_COMMAND", "A default game requires exactly four players");
  }

  if (new Set(players.map((player) => player.id)).size !== players.length) {
    throw new GameRuleError("INVALID_COMMAND", "Player IDs must be unique");
  }

  if (!seed) {
    throw new GameRuleError("INVALID_COMMAND", "A game seed is required");
  }

  if (
    !Number.isInteger(victoryPoints) ||
    victoryPoints < MINIMUM_VICTORY_POINTS ||
    victoryPoints > MAXIMUM_BUILDING_VICTORY_POINTS
  ) {
    throw new GameRuleError(
      "INVALID_COMMAND",
      `Victory points must be an integer from ${MINIMUM_VICTORY_POINTS} to ${MAXIMUM_BUILDING_VICTORY_POINTS}`,
    );
  }

  const [firstPlayer] = players;

  if (!firstPlayer) {
    throw new GameRuleError("INVALID_COMMAND", "A first player is required");
  }

  return {
    actionNumber: 0,
    activePlayerId: firstPlayer.id,
    bank: filledInventory(BANK_RESOURCE_COUNT),
    board: createDefaultBoard(),
    lastDiceRoll: null,
    phase: { kind: "setup_settlement", setupIndex: 0 },
    players: players.map((player, seatIndex) => ({
      ...player,
      piecesRemaining: { ...INITIAL_PIECES },
      resources: emptyInventory(),
      seatIndex,
      victoryPoints: 0,
    })),
    randomIndex: 0,
    seed,
    status: "active",
    turnNumber: 0,
    turnOrder: players.map((player) => player.id),
    version: 1,
    victoryPoints,
    winnerPlayerId: null,
  };
}
