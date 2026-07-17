import {
  ANY_PORT_TRADE_RATIO,
  BANK_TRADE_RATIO,
  BUILD_COSTS,
  DEFAULT_DISCARD_LIMIT,
  MAX_PLAYER_TURNS,
  RESOURCE_PORT_TRADE_RATIO,
  RESOURCE_ORDER,
  SETUP_SEAT_ORDER,
  TERRAIN_RESOURCE,
} from "./constants";
import { deterministicInteger } from "./random";
import {
  addResources,
  emptyInventory,
  hasResources,
  isValidInventory,
  subtractResources,
  totalResources,
} from "./resources";
import { DEFAULT_TOPOLOGY } from "./topology";
import { GameRuleError, RESOURCE_TYPES } from "./types";
import type {
  GameCommand,
  GameRuleErrorCode,
  GameState,
  LegalActions,
  PlayerId,
  PlayerState,
  ResourceInventory,
  ResourceType,
} from "./types";

function fail(code: GameRuleErrorCode, message: string): never {
  throw new GameRuleError(code, message);
}

function requirePlayer(state: GameState, playerId: PlayerId) {
  const player = state.players.find((candidate) => candidate.id === playerId);

  if (!player) {
    fail("UNKNOWN_PLAYER", `Unknown player: ${playerId}`);
  }

  return player;
}

function updatePlayer(
  state: GameState,
  playerId: PlayerId,
  update: (player: PlayerState) => PlayerState,
) {
  return {
    ...state,
    players: state.players.map((player) => (player.id === playerId ? update(player) : player)),
  };
}

function buildingAt(state: Pick<GameState, "board">, vertexKey: string) {
  return state.board.buildings.find((building) => building.vertexKey === vertexKey);
}

function roadAt(state: GameState, edgeKey: string) {
  return state.board.roads.find((road) => road.edgeKey === edgeKey);
}

function playerOwnsPort(
  state: Pick<GameState, "board">,
  playerId: PlayerId,
  trade: "any" | ResourceType,
) {
  return state.board.ports.some((port) => {
    if (port.trade !== trade) {
      return false;
    }

    const portVertices = DEFAULT_TOPOLOGY.edgeVertices[port.edgeKey] ?? [];
    return portVertices.some((vertexKey) => buildingAt(state, vertexKey)?.playerId === playerId);
  });
}

export function getBankTradeRatio(
  state: Pick<GameState, "board"> & { players: readonly Pick<PlayerState, "id">[] },
  playerId: PlayerId,
  give: ResourceType,
) {
  if (!state.players.some((player) => player.id === playerId)) {
    fail("UNKNOWN_PLAYER", `Unknown player: ${playerId}`);
  }

  if (playerOwnsPort(state, playerId, give)) {
    return RESOURCE_PORT_TRADE_RATIO;
  }

  return playerOwnsPort(state, playerId, "any") ? ANY_PORT_TRADE_RATIO : BANK_TRADE_RATIO;
}

function isKnownVertex(vertexKey: string) {
  return DEFAULT_TOPOLOGY.vertexPositions[vertexKey] !== undefined;
}

function isKnownEdge(edgeKey: string) {
  return DEFAULT_TOPOLOGY.edgeVertices[edgeKey] !== undefined;
}

function followsDistanceRule(state: GameState, vertexKey: string) {
  return (DEFAULT_TOPOLOGY.vertexNeighbors[vertexKey] ?? []).every(
    (neighbor) => !buildingAt(state, neighbor),
  );
}

function hasPlayerRoadAtVertex(state: GameState, playerId: PlayerId, vertexKey: string) {
  return (DEFAULT_TOPOLOGY.vertexEdges[vertexKey] ?? []).some(
    (edgeKey) => roadAt(state, edgeKey)?.playerId === playerId,
  );
}

function roadConnectsToPlayer(state: GameState, playerId: PlayerId, edgeKey: string) {
  return (DEFAULT_TOPOLOGY.edgeVertices[edgeKey] ?? []).some((vertexKey) => {
    const building = buildingAt(state, vertexKey);

    if (building?.playerId === playerId) {
      return true;
    }

    if (building) {
      return false;
    }

    return hasPlayerRoadAtVertex(state, playerId, vertexKey);
  });
}

export function getSettlementVertexKeys(
  state: GameState,
  playerId: PlayerId,
  requiresRoad: boolean,
) {
  requirePlayer(state, playerId);

  return DEFAULT_TOPOLOGY.vertexKeys.filter(
    (vertexKey) =>
      !buildingAt(state, vertexKey) &&
      followsDistanceRule(state, vertexKey) &&
      (!requiresRoad || hasPlayerRoadAtVertex(state, playerId, vertexKey)),
  );
}

export function getRoadEdgeKeys(state: GameState, playerId: PlayerId) {
  requirePlayer(state, playerId);

  return DEFAULT_TOPOLOGY.edgeKeys.filter(
    (edgeKey) => !roadAt(state, edgeKey) && roadConnectsToPlayer(state, playerId, edgeKey),
  );
}

export function getCityVertexKeys(state: GameState, playerId: PlayerId) {
  requirePlayer(state, playerId);

  return state.board.buildings
    .filter((building) => building.playerId === playerId && building.kind === "settlement")
    .map((building) => building.vertexKey)
    .sort();
}

function payBuildCost(state: GameState, playerId: PlayerId, cost: Readonly<ResourceInventory>) {
  const player = requirePlayer(state, playerId);

  if (!hasResources(player.resources, cost)) {
    fail("INSUFFICIENT_RESOURCES", "Player cannot afford this build");
  }

  const withPaidPlayer = updatePlayer(state, playerId, (current) => ({
    ...current,
    resources: subtractResources(current.resources, cost),
  }));

  return {
    ...withPaidPlayer,
    bank: addResources(withPaidPlayer.bank, cost),
  };
}

function addBuilding(state: GameState, playerId: PlayerId, vertexKey: string) {
  const withBuilding: GameState = {
    ...state,
    board: {
      ...state.board,
      buildings: [...state.board.buildings, { kind: "settlement", playerId, vertexKey }],
    },
  };

  return updatePlayer(withBuilding, playerId, (player) => ({
    ...player,
    piecesRemaining: {
      ...player.piecesRemaining,
      settlements: player.piecesRemaining.settlements - 1,
    },
    victoryPoints: player.victoryPoints + 1,
  }));
}

function addRoad(state: GameState, playerId: PlayerId, edgeKey: string) {
  const withRoad: GameState = {
    ...state,
    board: {
      ...state.board,
      roads: [...state.board.roads, { edgeKey, playerId }],
    },
  };

  return updatePlayer(withRoad, playerId, (player) => ({
    ...player,
    piecesRemaining: {
      ...player.piecesRemaining,
      roads: player.piecesRemaining.roads - 1,
    },
  }));
}

function grantSecondSettlementResources(state: GameState, playerId: PlayerId, vertexKey: string) {
  const granted = emptyInventory();
  const bank = { ...state.bank };

  for (const tileId of DEFAULT_TOPOLOGY.vertexTileIds[vertexKey] ?? []) {
    const tile = state.board.tiles.find((candidate) => candidate.id === tileId);
    const resource = tile ? TERRAIN_RESOURCE[tile.terrain] : null;

    if (resource && bank[resource] > 0) {
      granted[resource] += 1;
      bank[resource] -= 1;
    }
  }

  const withResources = updatePlayer(state, playerId, (player) => ({
    ...player,
    resources: addResources(player.resources, granted),
  }));

  return { ...withResources, bank };
}

function finishIfWinner(state: GameState, playerId: PlayerId) {
  const player = requirePlayer(state, playerId);

  if (player.victoryPoints < state.victoryPoints) {
    return state;
  }

  return {
    ...state,
    phase: { kind: "finished" } as const,
    status: "completed" as const,
    winnerPlayerId: playerId,
  };
}

function placeSettlement(state: GameState, playerId: PlayerId, vertexKey: string) {
  if (!isKnownVertex(vertexKey)) {
    fail("INVALID_LOCATION", `Unknown vertex: ${vertexKey}`);
  }

  if (buildingAt(state, vertexKey)) {
    fail("LOCATION_OCCUPIED", "The vertex already contains a building");
  }

  if (!followsDistanceRule(state, vertexKey)) {
    fail("DISTANCE_RULE", "Adjacent vertices must remain empty");
  }

  const player = requirePlayer(state, playerId);

  if (player.piecesRemaining.settlements <= 0) {
    fail("NO_PIECE_AVAILABLE", "Player has no settlements remaining");
  }

  if (state.phase.kind === "setup_settlement") {
    const setupIndex = state.phase.setupIndex;
    let next = addBuilding(state, playerId, vertexKey);

    if (setupIndex >= state.players.length) {
      next = grantSecondSettlementResources(next, playerId, vertexKey);
    }

    return {
      ...next,
      phase: { kind: "setup_road" as const, settlementVertexKey: vertexKey, setupIndex },
    };
  }

  if (state.phase.kind !== "build_and_trade") {
    fail("INVALID_PHASE", "Settlements cannot be placed in this phase");
  }

  if (!hasPlayerRoadAtVertex(state, playerId, vertexKey)) {
    fail("ROAD_NOT_CONNECTED", "Settlement must connect to the player's road");
  }

  return finishIfWinner(
    addBuilding(payBuildCost(state, playerId, BUILD_COSTS.settlement), playerId, vertexKey),
    playerId,
  );
}

function placeRoad(state: GameState, playerId: PlayerId, edgeKey: string) {
  if (!isKnownEdge(edgeKey)) {
    fail("INVALID_LOCATION", `Unknown edge: ${edgeKey}`);
  }

  if (roadAt(state, edgeKey)) {
    fail("LOCATION_OCCUPIED", "The edge already contains a road");
  }

  const player = requirePlayer(state, playerId);

  if (player.piecesRemaining.roads <= 0) {
    fail("NO_PIECE_AVAILABLE", "Player has no roads remaining");
  }

  if (state.phase.kind === "setup_road") {
    const { settlementVertexKey, setupIndex } = state.phase;
    const setupEdgeVertices = DEFAULT_TOPOLOGY.edgeVertices[edgeKey];

    if (!setupEdgeVertices?.includes(settlementVertexKey)) {
      fail("ROAD_NOT_CONNECTED", "Setup road must touch the new settlement");
    }

    const withRoad = addRoad(state, playerId, edgeKey);
    const nextSetupIndex = setupIndex + 1;

    if (nextSetupIndex >= SETUP_SEAT_ORDER.length) {
      const firstPlayerId = state.turnOrder[0];

      if (!firstPlayerId) {
        fail("INVALID_COMMAND", "Game has no first player");
      }

      return {
        ...withRoad,
        activePlayerId: firstPlayerId,
        phase: { kind: "roll" as const },
        turnNumber: 1,
      };
    }

    const nextSeat = SETUP_SEAT_ORDER[nextSetupIndex];
    const nextPlayerId = nextSeat === undefined ? undefined : state.turnOrder[nextSeat];

    if (!nextPlayerId) {
      fail("INVALID_COMMAND", "Setup order references a missing player");
    }

    return {
      ...withRoad,
      activePlayerId: nextPlayerId,
      phase: {
        kind: "setup_settlement" as const,
        setupIndex: nextSetupIndex,
      },
    };
  }

  if (state.phase.kind !== "build_and_trade") {
    fail("INVALID_PHASE", "Roads cannot be placed in this phase");
  }

  if (!roadConnectsToPlayer(state, playerId, edgeKey)) {
    fail("ROAD_NOT_CONNECTED", "Road must connect to the player's network");
  }

  return addRoad(payBuildCost(state, playerId, BUILD_COSTS.road), playerId, edgeKey);
}

function buildCity(state: GameState, playerId: PlayerId, vertexKey: string) {
  if (state.phase.kind !== "build_and_trade") {
    fail("INVALID_PHASE", "Cities cannot be built in this phase");
  }

  const building = buildingAt(state, vertexKey);

  if (!building || building.playerId !== playerId || building.kind !== "settlement") {
    fail("INVALID_LOCATION", "City must replace the player's settlement");
  }

  const player = requirePlayer(state, playerId);

  if (player.piecesRemaining.cities <= 0) {
    fail("NO_PIECE_AVAILABLE", "Player has no cities remaining");
  }

  const paid = payBuildCost(state, playerId, BUILD_COSTS.city);
  const withCity: GameState = {
    ...paid,
    board: {
      ...paid.board,
      buildings: paid.board.buildings.map((candidate) =>
        candidate.vertexKey === vertexKey ? { ...candidate, kind: "city" as const } : candidate,
      ),
    },
  };
  const withPieces = updatePlayer(withCity, playerId, (current) => ({
    ...current,
    piecesRemaining: {
      ...current.piecesRemaining,
      cities: current.piecesRemaining.cities - 1,
      settlements: current.piecesRemaining.settlements + 1,
    },
    victoryPoints: current.victoryPoints + 1,
  }));

  return finishIfWinner(withPieces, playerId);
}

export function distributeResourcesForRoll(state: GameState, rollTotal: number) {
  const claims = state.players.map((player) => ({
    playerId: player.id,
    resources: emptyInventory(),
  }));
  const buildingByVertex = new Map(
    state.board.buildings.map((building) => [building.vertexKey, building]),
  );

  for (const tile of state.board.tiles) {
    if (tile.id === state.board.robberTileId || tile.numberToken !== rollTotal) {
      continue;
    }

    const resource = TERRAIN_RESOURCE[tile.terrain];

    if (!resource) {
      continue;
    }

    for (const vertexKey of DEFAULT_TOPOLOGY.tileById[tile.id]?.vertexKeys ?? []) {
      const building = buildingByVertex.get(vertexKey);
      const claim = building
        ? claims.find((candidate) => candidate.playerId === building.playerId)
        : undefined;

      if (building && claim) {
        claim.resources[resource] += building.kind === "city" ? 2 : 1;
      }
    }
  }

  const allocations = claims.map((claim) => ({
    playerId: claim.playerId,
    resources: emptyInventory(),
  }));

  for (const resource of RESOURCE_TYPES) {
    const claimants = claims.filter((claim) => claim.resources[resource] > 0);
    const requested = claimants.reduce((total, claim) => total + claim.resources[resource], 0);

    if (requested <= state.bank[resource]) {
      for (const claimant of claimants) {
        const allocation = allocations.find(
          (candidate) => candidate.playerId === claimant.playerId,
        );

        if (allocation) {
          allocation.resources[resource] = claimant.resources[resource];
        }
      }
    } else if (claimants.length === 1) {
      const [claimant] = claimants;
      const allocation = allocations.find((candidate) => candidate.playerId === claimant?.playerId);

      if (allocation) {
        allocation.resources[resource] = state.bank[resource];
      }
    }
  }

  const distributed = RESOURCE_TYPES.reduce((totals, resource) => {
    totals[resource] = allocations.reduce(
      (total, allocation) => total + allocation.resources[resource],
      0,
    );
    return totals;
  }, emptyInventory());

  return {
    ...state,
    bank: subtractResources(state.bank, distributed),
    players: state.players.map((player) => {
      const allocation = allocations.find((candidate) => candidate.playerId === player.id);
      return allocation
        ? { ...player, resources: addResources(player.resources, allocation.resources) }
        : player;
    }),
  };
}

function rollDice(state: GameState, playerId: PlayerId) {
  if (state.phase.kind !== "roll") {
    fail("INVALID_PHASE", "Dice can only be rolled at the start of a turn");
  }

  const firstDraw = deterministicInteger(state.seed, state.randomIndex, 6);
  const secondDraw = deterministicInteger(state.seed, firstDraw.nextIndex, 6);
  const first = firstDraw.value + 1;
  const second = secondDraw.value + 1;
  const sum = first + second;
  const rolled: GameState = {
    ...state,
    lastDiceRoll: { first, second, sum },
    randomIndex: secondDraw.nextIndex,
  };

  if (sum !== 7) {
    return {
      ...distributeResourcesForRoll(rolled, sum),
      phase: { kind: "build_and_trade" as const },
    };
  }

  const pending = rolled.players
    .map((player) => ({
      count: Math.floor(totalResources(player.resources) / 2),
      playerId: player.id,
      total: totalResources(player.resources),
    }))
    .filter((requirement) => requirement.total > DEFAULT_DISCARD_LIMIT)
    .map(({ count, playerId: pendingPlayerId }) => ({
      count,
      playerId: pendingPlayerId,
    }));

  return {
    ...rolled,
    phase:
      pending.length > 0
        ? { kind: "discard" as const, pending, rollerPlayerId: playerId }
        : { kind: "move_robber" as const, rollerPlayerId: playerId },
  };
}

function discardResources(state: GameState, playerId: PlayerId, discarded: ResourceInventory) {
  if (state.phase.kind !== "discard") {
    fail("INVALID_PHASE", "No discard is currently required");
  }

  const requirement = state.phase.pending.find((pending) => pending.playerId === playerId);
  const player = requirePlayer(state, playerId);

  if (
    !requirement ||
    !isValidInventory(discarded) ||
    totalResources(discarded) !== requirement.count ||
    !hasResources(player.resources, discarded)
  ) {
    fail("INVALID_DISCARD", "Discard must exactly match the pending requirement");
  }

  const withDiscardedPlayer = updatePlayer(state, playerId, (current) => ({
    ...current,
    resources: subtractResources(current.resources, discarded),
  }));
  const pending = state.phase.pending.filter((candidate) => candidate.playerId !== playerId);

  return {
    ...withDiscardedPlayer,
    bank: addResources(withDiscardedPlayer.bank, discarded),
    phase:
      pending.length > 0
        ? {
            ...state.phase,
            pending,
          }
        : {
            kind: "move_robber" as const,
            rollerPlayerId: state.phase.rollerPlayerId,
          },
  };
}

function moveRobber(state: GameState, playerId: PlayerId, tileId: string) {
  if (state.phase.kind !== "move_robber") {
    fail("INVALID_PHASE", "Robber cannot be moved in this phase");
  }

  const tile = state.board.tiles.find((candidate) => candidate.id === tileId);

  if (!tile) {
    fail("INVALID_ROBBER_TILE", `Unknown robber tile: ${tileId}`);
  }

  if (tileId === state.board.robberTileId) {
    fail("ROBBER_TILE_UNCHANGED", "Robber must move to another tile");
  }

  const adjacentVertices = new Set(DEFAULT_TOPOLOGY.tileById[tileId]?.vertexKeys ?? []);
  const eligibleVictimIds = state.players
    .filter(
      (player) =>
        player.id !== playerId &&
        totalResources(player.resources) > 0 &&
        state.board.buildings.some(
          (building) => building.playerId === player.id && adjacentVertices.has(building.vertexKey),
        ),
    )
    .map((player) => player.id);
  const withRobber: GameState = {
    ...state,
    board: { ...state.board, robberTileId: tileId },
  };

  return {
    ...withRobber,
    phase:
      eligibleVictimIds.length > 0
        ? {
            eligibleVictimIds,
            kind: "steal" as const,
            rollerPlayerId: state.phase.rollerPlayerId,
          }
        : { kind: "build_and_trade" as const },
  };
}

function stealResource(state: GameState, playerId: PlayerId, victimPlayerId: PlayerId) {
  if (state.phase.kind !== "steal") {
    fail("INVALID_PHASE", "No resource can be stolen in this phase");
  }

  if (!state.phase.eligibleVictimIds.includes(victimPlayerId)) {
    fail("INVALID_VICTIM", "Selected player is not an eligible victim");
  }

  const victim = requirePlayer(state, victimPlayerId);
  const cardCount = totalResources(victim.resources);

  if (cardCount <= 0) {
    fail("INVALID_VICTIM", "Selected player has no resource cards");
  }

  const draw = deterministicInteger(state.seed, state.randomIndex, cardCount);
  let remaining = draw.value;
  let stolenResource: ResourceType | null = null;

  for (const resource of RESOURCE_ORDER) {
    if (remaining < victim.resources[resource]) {
      stolenResource = resource;
      break;
    }
    remaining -= victim.resources[resource];
  }

  if (!stolenResource) {
    fail("INVALID_VICTIM", "Victim inventory could not be sampled");
  }

  const singleCard = { ...emptyInventory(), [stolenResource]: 1 };
  const withVictim = updatePlayer(state, victimPlayerId, (current) => ({
    ...current,
    resources: subtractResources(current.resources, singleCard),
  }));
  const withThief = updatePlayer(withVictim, playerId, (current) => ({
    ...current,
    resources: addResources(current.resources, singleCard),
  }));

  return {
    ...withThief,
    phase: { kind: "build_and_trade" as const },
    randomIndex: draw.nextIndex,
  };
}

function tradeWithBank(state: GameState, playerId: PlayerId, give: unknown, receive: unknown) {
  if (!isResourceType(give) || !isResourceType(receive)) {
    fail("INVALID_TRADE", "Bank trades require known resources");
  }

  if (state.phase.kind !== "build_and_trade") {
    fail("INVALID_PHASE", "Bank trades are only allowed after rolling");
  }

  if (give === receive) {
    fail("INVALID_TRADE", "Trade resources must be different");
  }

  const player = requirePlayer(state, playerId);
  const ratio = getBankTradeRatio(state, playerId, give);

  if (player.resources[give] < ratio) {
    fail("INVALID_TRADE", `This bank trade requires ${ratio} cards`);
  }

  if (state.bank[receive] < 1) {
    fail("BANK_OUT_OF_RESOURCE", "Bank has none of the requested resource");
  }

  const given = { ...emptyInventory(), [give]: ratio };
  const received = { ...emptyInventory(), [receive]: 1 };
  const withPlayer = updatePlayer(state, playerId, (current) => ({
    ...current,
    resources: addResources(subtractResources(current.resources, given), received),
  }));

  return {
    ...withPlayer,
    bank: addResources(subtractResources(state.bank, received), given),
  };
}

function endTurn(state: GameState) {
  if (state.phase.kind !== "build_and_trade") {
    fail("INVALID_PHASE", "Turn cannot end before rolling and resolving actions");
  }

  if (state.turnNumber >= MAX_PLAYER_TURNS) {
    return {
      ...state,
      lastDiceRoll: null,
      phase: { kind: "finished" as const },
      status: "completed" as const,
      winnerPlayerId: null,
    };
  }

  const activeIndex = state.turnOrder.indexOf(state.activePlayerId);
  const nextPlayerId = state.turnOrder[(activeIndex + 1) % state.turnOrder.length];

  if (activeIndex < 0 || !nextPlayerId) {
    fail("INVALID_COMMAND", "Turn order is invalid");
  }

  return {
    ...state,
    activePlayerId: nextPlayerId,
    lastDiceRoll: null,
    phase: { kind: "roll" as const },
    turnNumber: state.turnNumber + 1,
  };
}

function isResourceType(resource: unknown): resource is ResourceType {
  return RESOURCE_TYPES.some((knownResource) => knownResource === resource);
}

export function getRequiredPlayerIds(state: GameState) {
  if (state.status === "completed") {
    return [];
  }

  return state.phase.kind === "discard"
    ? state.phase.pending.map((pending) => pending.playerId)
    : [state.activePlayerId];
}

function emptyLegalActions(state: GameState): LegalActions {
  return {
    bankTrades: [],
    canEndTurn: false,
    canRoll: false,
    cityVertexKeys: [],
    discardCount: null,
    isRequiredActor: false,
    phase: state.phase.kind,
    roadEdgeKeys: [],
    robberTileIds: [],
    settlementVertexKeys: [],
    victimPlayerIds: [],
  };
}

export function getLegalActions(state: GameState, actorPlayerId: PlayerId): LegalActions {
  const player = requirePlayer(state, actorPlayerId);
  const actions = emptyLegalActions(state);

  if (!getRequiredPlayerIds(state).includes(actorPlayerId)) {
    return actions;
  }

  actions.isRequiredActor = true;

  switch (state.phase.kind) {
    case "setup_settlement":
      actions.settlementVertexKeys =
        player.piecesRemaining.settlements > 0
          ? getSettlementVertexKeys(state, actorPlayerId, false)
          : [];
      return actions;
    case "setup_road":
      actions.roadEdgeKeys =
        player.piecesRemaining.roads > 0
          ? (DEFAULT_TOPOLOGY.vertexEdges[state.phase.settlementVertexKey] ?? []).filter(
              (edgeKey) => !roadAt(state, edgeKey),
            )
          : [];
      return actions;
    case "roll":
      actions.canRoll = true;
      return actions;
    case "discard":
      actions.discardCount =
        state.phase.pending.find((requirement) => requirement.playerId === actorPlayerId)?.count ??
        null;
      return actions;
    case "move_robber":
      actions.robberTileIds = state.board.tiles
        .filter((tile) => tile.id !== state.board.robberTileId)
        .map((tile) => tile.id);
      return actions;
    case "steal":
      actions.victimPlayerIds = [...state.phase.eligibleVictimIds];
      return actions;
    case "build_and_trade":
      actions.canEndTurn = true;
      actions.cityVertexKeys =
        player.piecesRemaining.cities > 0 && hasResources(player.resources, BUILD_COSTS.city)
          ? getCityVertexKeys(state, actorPlayerId)
          : [];
      actions.settlementVertexKeys =
        player.piecesRemaining.settlements > 0 &&
        hasResources(player.resources, BUILD_COSTS.settlement)
          ? getSettlementVertexKeys(state, actorPlayerId, true)
          : [];
      actions.roadEdgeKeys =
        player.piecesRemaining.roads > 0 && hasResources(player.resources, BUILD_COSTS.road)
          ? getRoadEdgeKeys(state, actorPlayerId)
          : [];
      actions.bankTrades = RESOURCE_TYPES.flatMap((give) => {
        const ratio = getBankTradeRatio(state, actorPlayerId, give);

        return player.resources[give] >= ratio
          ? RESOURCE_TYPES.filter((receive) => receive !== give && state.bank[receive] > 0).map(
              (receive) => ({ give, ratio, receive }),
            )
          : [];
      });
      return actions;
    case "finished":
      return actions;
  }
}

export function applyCommand(
  state: GameState,
  actorPlayerId: PlayerId,
  command: GameCommand,
): GameState {
  if (state.status === "completed") {
    fail("GAME_FINISHED", "Game is already complete");
  }

  requirePlayer(state, actorPlayerId);

  if (!getRequiredPlayerIds(state).includes(actorPlayerId)) {
    fail("NOT_REQUIRED_ACTOR", "Player cannot act in the current phase");
  }

  let next: GameState;

  switch (command.kind) {
    case "place_settlement":
      next = placeSettlement(state, actorPlayerId, command.vertexKey);
      break;
    case "place_road":
      next = placeRoad(state, actorPlayerId, command.edgeKey);
      break;
    case "roll":
      next = rollDice(state, actorPlayerId);
      break;
    case "discard":
      next = discardResources(state, actorPlayerId, command.resources);
      break;
    case "move_robber":
      next = moveRobber(state, actorPlayerId, command.tileId);
      break;
    case "steal":
      next = stealResource(state, actorPlayerId, command.victimPlayerId);
      break;
    case "build_city":
      next = buildCity(state, actorPlayerId, command.vertexKey);
      break;
    case "trade_bank":
      next = tradeWithBank(state, actorPlayerId, command.give, command.receive);
      break;
    case "end_turn":
      next = endTurn(state);
      break;
    default:
      return fail("INVALID_COMMAND", "Unknown game command");
  }

  return { ...next, actionNumber: state.actionNumber + 1 };
}
