import { BUILD_COSTS, RESOURCE_ORDER } from "./constants";
import { deterministicInteger } from "./random";
import { addResources, emptyInventory, subtractResources } from "./resources";
import { applyCommand, getLegalActions } from "./rules";
import { createDefaultGame } from "./state";
import type { GamePlayerInput, GameState, PlayerId, ResourceInventory } from "./types";

export function createTestPlayers(isBot = false, playerCount = 4): GamePlayerInput[] {
  return Array.from({ length: playerCount }, (_, seatIndex) => ({
    displayName: `Player ${seatIndex + 1}`,
    id: `player-${seatIndex + 1}`,
    isBot,
  }));
}

export function createTestGame(seed = "test-seed", victoryPoints = 10) {
  return createDefaultGame(createTestPlayers(), seed, {
    balancedDice: false,
    friendlyRobber: false,
    victoryPoints,
  });
}

export function completeSetup(initialState = createTestGame()) {
  let state = initialState;

  while (state.phase.kind === "setup_settlement" || state.phase.kind === "setup_road") {
    const actorPlayerId = state.activePlayerId;
    const legal = getLegalActions(state, actorPlayerId);

    if (state.phase.kind === "setup_settlement") {
      const vertexKey = legal.settlementVertexKeys[0];

      if (!vertexKey) {
        throw new Error("Setup fixture has no legal settlement");
      }

      state = applyCommand(state, actorPlayerId, {
        kind: "place_settlement",
        vertexKey,
      });
    } else {
      const edgeKey = legal.roadEdgeKeys[0];

      if (!edgeKey) {
        throw new Error("Setup fixture has no legal road");
      }

      state = applyCommand(state, actorPlayerId, {
        edgeKey,
        kind: "place_road",
      });
    }
  }

  return state;
}

export function transferFromBank(
  state: GameState,
  playerId: PlayerId,
  resources: ResourceInventory,
) {
  return {
    ...state,
    bank: subtractResources(state.bank, resources),
    players: state.players.map((player) =>
      player.id === playerId
        ? {
            ...player,
            resources: addResources(player.resources, resources),
          }
        : player,
    ),
  };
}

export function inventory(values: Partial<ResourceInventory>): ResourceInventory {
  return { ...emptyInventory(), ...values };
}

export function seedForDiceTotal(total: number, randomIndex = 0) {
  for (let attempt = 0; attempt < 20_000; attempt += 1) {
    const seed = `dice-${total}-${attempt}`;
    const first = deterministicInteger(seed, randomIndex, 6);
    const second = deterministicInteger(seed, first.nextIndex, 6);

    if (first.value + second.value + 2 === total) {
      return seed;
    }
  }

  throw new Error(`Could not find seed for dice total ${total}`);
}

export function giveBuildCost(
  state: GameState,
  playerId: PlayerId,
  build: keyof typeof BUILD_COSTS,
) {
  return transferFromBank(state, playerId, { ...BUILD_COSTS[build] });
}

export function discardFromLargest(resources: ResourceInventory, count: number) {
  const discarded = emptyInventory();
  let remaining = count;

  for (const resource of [...RESOURCE_ORDER].sort(
    (first, second) => resources[second] - resources[first],
  )) {
    const amount = Math.min(resources[resource], remaining);
    discarded[resource] = amount;
    remaining -= amount;
  }

  return discarded;
}
