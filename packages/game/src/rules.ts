import {
  ANY_PORT_TRADE_RATIO,
  BANK_TRADE_RATIO,
  BUILD_COSTS,
  RESOURCE_PORT_TRADE_RATIO,
  RESOURCE_ORDER,
  TERRAIN_RESOURCE,
  getSetupSeatOrder,
} from "./constants";
import { createBalancedDiceBag, deterministicInteger } from "./random";
import {
  addResources,
  emptyInventory,
  hasResources,
  isValidInventory,
  subtractResources,
  totalResources,
} from "./resources";
import { getBoardTopology } from "./topology";
import { GameRuleError, RESOURCE_TYPES } from "./types";
import type {
  GameCommand,
  GameRuleErrorCode,
  GameState,
  LegalActions,
  PlayerId,
  PlayerCount,
  PlayerState,
  ResourceInventory,
  ResourceType,
  TradeOffer,
} from "./types";

function fail(code: GameRuleErrorCode, message: string): never {
  throw new GameRuleError(code, message);
}

function getCurrentSetupSeatOrder(state: GameState) {
  const playerCount = state.players.length;

  if (playerCount < 3 || playerCount > 8) {
    fail("INVALID_COMMAND", "A base game requires three to eight players");
  }

  return getSetupSeatOrder(playerCount as PlayerCount);
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

function boardTopology(state: Pick<GameState, "board">) {
  return getBoardTopology(state.board.tiles);
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

    const portVertices = boardTopology(state).edgeVertices[port.edgeKey] ?? [];
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

function isKnownVertex(state: GameState, vertexKey: string) {
  return boardTopology(state).vertexPositions[vertexKey] !== undefined;
}

function isKnownEdge(state: GameState, edgeKey: string) {
  return boardTopology(state).edgeVertices[edgeKey] !== undefined;
}

function followsDistanceRule(state: GameState, vertexKey: string) {
  return (boardTopology(state).vertexNeighbors[vertexKey] ?? []).every(
    (neighbor) => !buildingAt(state, neighbor),
  );
}

function hasPlayerRoadAtVertex(state: GameState, playerId: PlayerId, vertexKey: string) {
  return (boardTopology(state).vertexEdges[vertexKey] ?? []).some(
    (edgeKey) => roadAt(state, edgeKey)?.playerId === playerId,
  );
}

function roadConnectsToPlayer(state: GameState, playerId: PlayerId, edgeKey: string) {
  return (boardTopology(state).edgeVertices[edgeKey] ?? []).some((vertexKey) => {
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

  return boardTopology(state).vertexKeys.filter(
    (vertexKey) =>
      !buildingAt(state, vertexKey) &&
      followsDistanceRule(state, vertexKey) &&
      (!requiresRoad || hasPlayerRoadAtVertex(state, playerId, vertexKey)),
  );
}

export function getRoadEdgeKeys(state: GameState, playerId: PlayerId) {
  requirePlayer(state, playerId);

  return boardTopology(state).edgeKeys.filter(
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

  for (const tileId of boardTopology(state).vertexTileIds[vertexKey] ?? []) {
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

  if (player.victoryPoints < state.settings.victoryPoints) {
    return state;
  }

  return {
    ...state,
    phase: { kind: "finished" } as const,
    status: "completed" as const,
    tradeOffer: null,
    winnerPlayerId: playerId,
  };
}

function placeSettlement(state: GameState, playerId: PlayerId, vertexKey: string) {
  if (!isKnownVertex(state, vertexKey)) {
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
  if (!isKnownEdge(state, edgeKey)) {
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
    const setupEdgeVertices = boardTopology(state).edgeVertices[edgeKey];

    if (!setupEdgeVertices?.includes(settlementVertexKey)) {
      fail("ROAD_NOT_CONNECTED", "Setup road must touch the new settlement");
    }

    const withRoad = addRoad(state, playerId, edgeKey);
    const nextSetupIndex = setupIndex + 1;
    const setupSeatOrder = getCurrentSetupSeatOrder(state);

    if (nextSetupIndex >= setupSeatOrder.length) {
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

    const nextSeat = setupSeatOrder[nextSetupIndex];
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

    for (const vertexKey of boardTopology(state).tileById[tile.id]?.vertexKeys ?? []) {
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

function drawDice(state: GameState) {
  if (!state.settings.balancedDice) {
    const firstDraw = deterministicInteger(state.seed, state.randomIndex, 6);
    const secondDraw = deterministicInteger(state.seed, firstDraw.nextIndex, 6);
    const first = firstDraw.value + 1;
    const second = secondDraw.value + 1;

    return {
      balancedDiceBag: state.balancedDiceBag,
      randomIndex: secondDraw.nextIndex,
      roll: { first, second, sum: first + second },
    };
  }

  const shuffled =
    state.balancedDiceBag.length > 0
      ? { bag: state.balancedDiceBag, nextIndex: state.randomIndex }
      : createBalancedDiceBag(state.seed, state.randomIndex);
  const [roll, ...balancedDiceBag] = shuffled.bag;

  if (!roll) {
    fail("INVALID_COMMAND", "Balanced dice bag is empty");
  }

  return {
    balancedDiceBag,
    randomIndex: shuffled.nextIndex,
    roll,
  };
}

function rollDice(state: GameState, playerId: PlayerId) {
  if (state.phase.kind !== "roll") {
    fail("INVALID_PHASE", "Dice can only be rolled at the start of a turn");
  }

  const draw = drawDice(state);
  const { first, second, sum } = draw.roll;
  const rolled: GameState = {
    ...state,
    balancedDiceBag: draw.balancedDiceBag,
    lastDiceRoll: { first, second, sum },
    randomIndex: draw.randomIndex,
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
    .filter((requirement) => requirement.total > state.settings.discardLimit)
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

function friendlyRobberProtectedPlayerIds(state: GameState) {
  if (!state.settings.friendlyRobber) {
    return new Set<PlayerId>();
  }

  return new Set(
    state.players.filter((player) => player.victoryPoints <= 2).map((player) => player.id),
  );
}

function robberTileIds(state: GameState) {
  const available = state.board.tiles
    .filter((tile) => tile.id !== state.board.robberTileId)
    .map((tile) => tile.id);
  const protectedPlayerIds = friendlyRobberProtectedPlayerIds(state);

  if (protectedPlayerIds.size === 0) {
    return available;
  }

  const friendly = available.filter((tileId) => {
    const adjacentVertices = new Set(boardTopology(state).tileById[tileId]?.vertexKeys ?? []);
    return !state.board.buildings.some(
      (building) =>
        protectedPlayerIds.has(building.playerId) && adjacentVertices.has(building.vertexKey),
    );
  });

  const desertTileId = state.board.tiles.find(
    (tile) => TERRAIN_RESOURCE[tile.terrain] === null,
  )?.id;
  return friendly.length > 0 ? friendly : desertTileId ? [desertTileId] : available;
}

function moveRobber(state: GameState, playerId: PlayerId, tileId: string) {
  if (state.phase.kind !== "move_robber") {
    fail("INVALID_PHASE", "Robber cannot be moved in this phase");
  }

  const tile = state.board.tiles.find((candidate) => candidate.id === tileId);

  if (!tile) {
    fail("INVALID_ROBBER_TILE", `Unknown robber tile: ${tileId}`);
  }

  const legalTileIds = robberTileIds(state);
  if (!legalTileIds.includes(tileId)) {
    if (tileId === state.board.robberTileId) {
      fail("ROBBER_TILE_UNCHANGED", "Robber must move to another tile");
    }
    fail("INVALID_ROBBER_TILE", "Friendly robber protects players with two or fewer points");
  }

  const adjacentVertices = new Set(boardTopology(state).tileById[tileId]?.vertexKeys ?? []);
  const protectedPlayerIds = friendlyRobberProtectedPlayerIds(state);
  const eligibleVictimIds = state.players
    .filter(
      (player) =>
        player.id !== playerId &&
        !protectedPlayerIds.has(player.id) &&
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

  if (eligibleVictimIds.length === 0) {
    return {
      ...withRobber,
      phase: { kind: "build_and_trade" as const },
    };
  }

  const awaitingVictimSelection: GameState = {
    ...withRobber,
    phase: {
      eligibleVictimIds,
      kind: "steal",
      rollerPlayerId: state.phase.rollerPlayerId,
    },
  };

  return eligibleVictimIds.length === 1
    ? stealResource(awaitingVictimSelection, playerId, eligibleVictimIds[0]!)
    : awaitingVictimSelection;
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

function requireOfferActionNumber(offerActionNumber: number) {
  if (!Number.isSafeInteger(offerActionNumber) || offerActionNumber < 1) {
    fail("INVALID_TRADE", "Trade offer action number is invalid");
  }
}

function validateDomesticTradeInventories(give: ResourceInventory, want: ResourceInventory): void {
  if (
    !isValidInventory(give) ||
    !isValidInventory(want) ||
    totalResources(give) === 0 ||
    totalResources(want) === 0
  ) {
    fail("INVALID_TRADE", "A trade must give and request at least one resource");
  }

  if (RESOURCE_TYPES.some((resource) => give[resource] > 0 && want[resource] > 0)) {
    fail("INVALID_TRADE", "A trade cannot give and request the same resource");
  }
}

function proposeTrade(
  state: GameState,
  playerId: PlayerId,
  give: ResourceInventory,
  want: ResourceInventory,
  recipientPlayerIds: readonly PlayerId[],
) {
  if (state.phase.kind !== "build_and_trade" || state.activePlayerId !== playerId) {
    fail("INVALID_PHASE", "Only the active player may propose a trade after rolling");
  }

  if (state.tradeOffer) {
    fail("INVALID_TRADE", "Cancel the current trade offer before proposing another");
  }

  validateDomesticTradeInventories(give, want);
  const proposer = requirePlayer(state, playerId);
  if (!hasResources(proposer.resources, give)) {
    fail("INSUFFICIENT_RESOURCES", "Player cannot afford the proposed trade");
  }

  const uniqueRecipients = [...new Set(recipientPlayerIds)];
  if (
    uniqueRecipients.length === 0 ||
    uniqueRecipients.length !== recipientPlayerIds.length ||
    uniqueRecipients.includes(playerId)
  ) {
    fail("INVALID_TRADE", "Trade recipients must be unique opponents");
  }

  for (const recipientPlayerId of uniqueRecipients) {
    requirePlayer(state, recipientPlayerId);
  }

  const tradeOffer: TradeOffer = {
    give: { ...give },
    offerActionNumber: state.actionNumber + 1,
    proposerPlayerId: playerId,
    recipientPlayerIds: uniqueRecipients,
    rejectedPlayerIds: [],
    want: { ...want },
  };

  return { ...state, tradeOffer };
}

function respondToTrade(
  state: GameState,
  playerId: PlayerId,
  offerActionNumber: number,
  accept: boolean,
) {
  requireOfferActionNumber(offerActionNumber);
  const offer = state.tradeOffer;

  if (state.phase.kind !== "build_and_trade" || !offer) {
    fail("INVALID_TRADE", "There is no active trade offer");
  }

  if (offer.offerActionNumber !== offerActionNumber) {
    fail("INVALID_TRADE", "Trade offer is stale");
  }

  if (!offer.recipientPlayerIds.includes(playerId) || offer.rejectedPlayerIds.includes(playerId)) {
    fail("INVALID_TRADE", "Player cannot respond to this trade offer");
  }

  if (!accept) {
    const rejectedPlayerIds = [...offer.rejectedPlayerIds, playerId];
    const allRejected = offer.recipientPlayerIds.every((recipientPlayerId) =>
      rejectedPlayerIds.includes(recipientPlayerId),
    );
    return {
      ...state,
      tradeOffer: allRejected ? null : { ...offer, rejectedPlayerIds },
    };
  }

  const proposer = requirePlayer(state, offer.proposerPlayerId);
  const recipient = requirePlayer(state, playerId);
  if (
    !hasResources(proposer.resources, offer.give) ||
    !hasResources(recipient.resources, offer.want)
  ) {
    fail("INSUFFICIENT_RESOURCES", "Trade participants can no longer afford this offer");
  }

  const withProposer = updatePlayer(state, proposer.id, (current) => ({
    ...current,
    resources: addResources(subtractResources(current.resources, offer.give), offer.want),
  }));
  const withRecipient = updatePlayer(withProposer, recipient.id, (current) => ({
    ...current,
    resources: addResources(subtractResources(current.resources, offer.want), offer.give),
  }));

  return { ...withRecipient, tradeOffer: null };
}

function cancelTrade(state: GameState, playerId: PlayerId, offerActionNumber: number) {
  requireOfferActionNumber(offerActionNumber);
  const offer = state.tradeOffer;

  if (
    state.phase.kind !== "build_and_trade" ||
    !offer ||
    offer.offerActionNumber !== offerActionNumber ||
    offer.proposerPlayerId !== playerId
  ) {
    fail("INVALID_TRADE", "Player cannot cancel this trade offer");
  }

  return { ...state, tradeOffer: null };
}

function endTurn(state: GameState) {
  if (state.phase.kind !== "build_and_trade") {
    fail("INVALID_PHASE", "Turn cannot end before rolling and resolving actions");
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
    tradeOffer: null,
    turnNumber: state.turnNumber + 1,
  };
}

function cancelUnaffordableTradeOffer(state: GameState) {
  const offer = state.tradeOffer;

  if (!offer) {
    return state;
  }

  const proposer = requirePlayer(state, offer.proposerPlayerId);
  return hasResources(proposer.resources, offer.give) ? state : { ...state, tradeOffer: null };
}

function isResourceType(resource: unknown): resource is ResourceType {
  return RESOURCE_TYPES.some((knownResource) => knownResource === resource);
}

export function getRequiredPlayerIds(state: GameState) {
  if (state.status === "completed") {
    return [];
  }

  if (state.phase.kind === "discard") {
    return state.phase.pending.map((pending) => pending.playerId);
  }

  if (state.phase.kind === "build_and_trade" && state.tradeOffer) {
    const offer = state.tradeOffer;
    const outstandingRecipients = offer.recipientPlayerIds.filter(
      (playerId) => !offer.rejectedPlayerIds.includes(playerId),
    );
    return [state.activePlayerId, ...outstandingRecipients];
  }

  return [state.activePlayerId];
}

function emptyLegalActions(state: GameState): LegalActions {
  return {
    bankTrades: [],
    canCancelTrade: false,
    canEndTurn: false,
    canProposeTrade: false,
    canRespondToTrade: false,
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
          ? (boardTopology(state).vertexEdges[state.phase.settlementVertexKey] ?? []).filter(
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
      actions.robberTileIds = robberTileIds(state);
      return actions;
    case "steal":
      actions.victimPlayerIds = [...state.phase.eligibleVictimIds];
      return actions;
    case "build_and_trade":
      if (actorPlayerId !== state.activePlayerId) {
        actions.canRespondToTrade = Boolean(
          state.tradeOffer?.recipientPlayerIds.includes(actorPlayerId) &&
          !state.tradeOffer.rejectedPlayerIds.includes(actorPlayerId),
        );
        return actions;
      }

      actions.canEndTurn = true;
      actions.canCancelTrade = state.tradeOffer?.proposerPlayerId === actorPlayerId;
      actions.canProposeTrade = state.tradeOffer === null;
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

  if (
    actorPlayerId !== state.activePlayerId &&
    state.phase.kind !== "discard" &&
    command.kind !== "respond_trade"
  ) {
    fail("NOT_REQUIRED_ACTOR", "Player may only respond to the active trade offer");
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
    case "propose_trade":
      next = proposeTrade(
        state,
        actorPlayerId,
        command.give,
        command.want,
        command.recipientPlayerIds,
      );
      break;
    case "respond_trade":
      next = respondToTrade(state, actorPlayerId, command.offerActionNumber, command.accept);
      break;
    case "cancel_trade":
      next = cancelTrade(state, actorPlayerId, command.offerActionNumber);
      break;
    case "end_turn":
      next = endTurn(state);
      break;
    default:
      return fail("INVALID_COMMAND", "Unknown game command");
  }

  return {
    ...cancelUnaffordableTradeOffer(next),
    actionNumber: state.actionNumber + 1,
  };
}
