import { BUILD_COSTS, NUMBER_TOKEN_PIPS, RESOURCE_ORDER, TERRAIN_RESOURCE } from "./constants";
import {
  applyCommand,
  getCityVertexKeys,
  getLegalActions,
  getRequiredPlayerIds,
  getRoadEdgeKeys,
  getSettlementVertexKeys,
} from "./rules";
import { emptyInventory, totalResources } from "./resources";
import { DEFAULT_TOPOLOGY } from "./topology";
import type { BankTradeOption, GameCommand, GameState, PlayerId, ResourceInventory } from "./types";

function requireBotPlayer(state: GameState, playerId: PlayerId) {
  const player = state.players.find((candidate) => candidate.id === playerId);

  if (!player?.isBot) {
    throw new Error(`Expected a bot player: ${playerId}`);
  }

  return player;
}

function vertexProductionScore(state: GameState, vertexKey: string) {
  const resources = new Set<string>();
  let pips = 0;

  for (const tileId of DEFAULT_TOPOLOGY.vertexTileIds[vertexKey] ?? []) {
    const tile = state.board.tiles.find((candidate) => candidate.id === tileId);
    const resource = tile ? TERRAIN_RESOURCE[tile.terrain] : null;

    if (tile?.numberToken && resource) {
      pips += NUMBER_TOKEN_PIPS[tile.numberToken] ?? 0;
      resources.add(resource);
    }
  }

  return pips * 10 + resources.size * 3;
}

function highestScoringKey(keys: readonly string[], score: (key: string) => number) {
  return [...keys].sort(
    (first, second) => score(second) - score(first) || first.localeCompare(second),
  )[0];
}

function chooseSettlement(state: GameState, vertexKeys: readonly string[]) {
  return highestScoringKey(vertexKeys, (vertexKey) => vertexProductionScore(state, vertexKey));
}

function chooseRoad(state: GameState, edgeKeys: readonly string[]) {
  const openSettlementVertices = new Set(
    getSettlementVertexKeys(state, state.activePlayerId, false),
  );

  return highestScoringKey(edgeKeys, (edgeKey) => {
    const endpoints = DEFAULT_TOPOLOGY.edgeVertices[edgeKey] ?? [];
    return endpoints.reduce((score, vertexKey) => {
      const isOpenDestination = openSettlementVertices.has(vertexKey);
      return score + vertexProductionScore(state, vertexKey) + (isOpenDestination ? 1_000 : 0);
    }, 0);
  });
}

function createDiscard(resources: ResourceInventory, count: number) {
  const discarded = emptyInventory();
  let remaining = count;
  const resourceOrder = [...RESOURCE_ORDER].sort(
    (first, second) =>
      resources[second] - resources[first] ||
      RESOURCE_ORDER.indexOf(first) - RESOURCE_ORDER.indexOf(second),
  );

  for (const resource of resourceOrder) {
    const amount = Math.min(resources[resource], remaining);
    discarded[resource] = amount;
    remaining -= amount;

    if (remaining === 0) {
      break;
    }
  }

  return discarded;
}

function robberTileScore(state: GameState, playerId: PlayerId, tileId: string) {
  const vertices = new Set(DEFAULT_TOPOLOGY.tileById[tileId]?.vertexKeys ?? []);
  const tile = state.board.tiles.find((candidate) => candidate.id === tileId);
  const numberScore = tile?.numberToken ? (NUMBER_TOKEN_PIPS[tile.numberToken] ?? 0) : 0;

  return state.board.buildings.reduce((score, building) => {
    if (!vertices.has(building.vertexKey)) {
      return score;
    }

    const owner = state.players.find((player) => player.id === building.playerId);
    const weight = building.kind === "city" ? 2 : 1;

    if (building.playerId === playerId) {
      return score - numberScore * weight * 10;
    }

    return score + numberScore * weight * 10 + totalResources(owner?.resources ?? emptyInventory());
  }, 0);
}

function chooseTradeTowardCost(
  resources: ResourceInventory,
  trades: readonly BankTradeOption[],
  cost: Readonly<ResourceInventory>,
) {
  const deficits = RESOURCE_ORDER.filter((resource) => resources[resource] < cost[resource]).sort(
    (first, second) =>
      cost[second] - resources[second] - (cost[first] - resources[first]) ||
      RESOURCE_ORDER.indexOf(first) - RESOURCE_ORDER.indexOf(second),
  );

  for (const receive of deficits) {
    const trade = trades
      .filter(
        (option) =>
          option.receive === receive && resources[option.give] - cost[option.give] >= option.ratio,
      )
      .sort(
        (first, second) =>
          first.ratio - second.ratio ||
          resources[second.give] - cost[second.give] - (resources[first.give] - cost[first.give]) ||
          RESOURCE_ORDER.indexOf(first.give) - RESOURCE_ORDER.indexOf(second.give),
      )[0];

    if (trade) {
      return trade;
    }
  }

  return undefined;
}

function chooseBuildCommand(state: GameState, playerId: PlayerId): GameCommand {
  const player = requireBotPlayer(state, playerId);
  const legal = getLegalActions(state, playerId);
  const cityVertex = chooseSettlement(state, legal.cityVertexKeys);

  if (cityVertex) {
    return { kind: "build_city", vertexKey: cityVertex };
  }

  const settlementVertex = chooseSettlement(state, legal.settlementVertexKeys);

  if (settlementVertex) {
    return { kind: "place_settlement", vertexKey: settlementVertex };
  }

  const cityLocations = player.piecesRemaining.cities > 0 ? getCityVertexKeys(state, playerId) : [];
  const settlementLocations =
    player.piecesRemaining.settlements > 0 ? getSettlementVertexKeys(state, playerId, true) : [];
  const roadLocations = player.piecesRemaining.roads > 0 ? getRoadEdgeKeys(state, playerId) : [];
  const targetCost =
    cityLocations.length > 0
      ? BUILD_COSTS.city
      : settlementLocations.length > 0
        ? BUILD_COSTS.settlement
        : roadLocations.length > 0
          ? BUILD_COSTS.road
          : null;
  const trade = targetCost
    ? chooseTradeTowardCost(player.resources, legal.bankTrades, targetCost)
    : undefined;

  if (trade) {
    return {
      give: trade.give,
      kind: "trade_bank",
      receive: trade.receive,
    };
  }

  const roadEdge = chooseRoad(state, legal.roadEdgeKeys);

  return roadEdge ? { edgeKey: roadEdge, kind: "place_road" } : { kind: "end_turn" };
}

function chooseBotCommand(state: GameState, playerId: PlayerId): GameCommand {
  const player = requireBotPlayer(state, playerId);
  const legal = getLegalActions(state, playerId);

  switch (state.phase.kind) {
    case "setup_settlement": {
      const vertexKey = chooseSettlement(state, legal.settlementVertexKeys);

      if (!vertexKey) {
        throw new Error("Bot has no legal setup settlement");
      }

      return { kind: "place_settlement", vertexKey };
    }
    case "setup_road": {
      const edgeKey = chooseRoad(state, legal.roadEdgeKeys);

      if (!edgeKey) {
        throw new Error("Bot has no legal setup road");
      }

      return { edgeKey, kind: "place_road" };
    }
    case "roll":
      return { kind: "roll" };
    case "discard": {
      const count = legal.discardCount;

      if (count === null) {
        throw new Error("Bot has no discard requirement");
      }

      return { kind: "discard", resources: createDiscard(player.resources, count) };
    }
    case "move_robber": {
      const tileId = highestScoringKey(legal.robberTileIds, (candidate) =>
        robberTileScore(state, playerId, candidate),
      );

      if (!tileId) {
        throw new Error("Bot has no legal robber destination");
      }

      return { kind: "move_robber", tileId };
    }
    case "steal": {
      const victimPlayerId = [...legal.victimPlayerIds].sort((first, second) => {
        const firstPlayer = state.players.find((candidate) => candidate.id === first);
        const secondPlayer = state.players.find((candidate) => candidate.id === second);
        return (
          totalResources(secondPlayer?.resources ?? emptyInventory()) -
            totalResources(firstPlayer?.resources ?? emptyInventory()) ||
          (firstPlayer?.seatIndex ?? 0) - (secondPlayer?.seatIndex ?? 0)
        );
      })[0];

      if (!victimPlayerId) {
        throw new Error("Bot has no eligible victim");
      }

      return { kind: "steal", victimPlayerId };
    }
    case "build_and_trade":
      return chooseBuildCommand(state, playerId);
    case "finished":
      throw new Error("Finished game does not require a bot command");
  }
}

export function advanceBots(state: GameState, maxActions = 256) {
  if (!Number.isInteger(maxActions) || maxActions < 0) {
    throw new Error("maxActions must be a nonnegative integer");
  }

  let next = state;

  for (let action = 0; action < maxActions; action += 1) {
    if (next.status === "completed") {
      return next;
    }

    const botPlayerId = getRequiredPlayerIds(next).find(
      (playerId) => next.players.find((player) => player.id === playerId)?.isBot,
    );

    if (!botPlayerId) {
      return next;
    }

    next = applyCommand(next, botPlayerId, chooseBotCommand(next, botPlayerId));
  }

  return next;
}
