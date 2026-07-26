export const RESOURCE_TYPES = ["brick", "sheep", "stone", "tree", "wheat"] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export type ResourceInventory = Record<ResourceType, number>;

export const DEVELOPMENT_CARD_TYPES = [
  "knight",
  "monopoly",
  "road-building",
  "victory-point",
  "year-of-plenty",
] as const;

export type DevelopmentCardType = (typeof DEVELOPMENT_CARD_TYPES)[number];

export const TERRAIN_TYPES = [
  "desert",
  "fields",
  "forest",
  "hills",
  "mountains",
  "pasture",
] as const;

export type TerrainType = (typeof TERRAIN_TYPES)[number];
export type PlayerId = string;
export type BuildingKind = "city" | "settlement";
export type BotDifficulty = "easy" | "medium" | "hard";
export const GAME_MAP_IDS = ["base", "extended-6", "extended-8"] as const;
export type GameMapId = (typeof GAME_MAP_IDS)[number];
export const PLAYER_COUNTS = [3, 4, 5, 6, 7, 8] as const;
export type PlayerCount = (typeof PLAYER_COUNTS)[number];
export const PLAYER_COLORS = [
  "red",
  "blue",
  "orange",
  "green",
  "purple",
  "teal",
  "yellow",
  "pink",
] as const;
export type PlayerColor = (typeof PLAYER_COLORS)[number];
export type TurnTimerSeconds = 0 | 30 | 60 | 90 | 120;

export interface BaseGameSettings {
  balancedDice: boolean;
  discardLimit: number;
  friendlyRobber: boolean;
  hideBankCards: boolean;
  map: GameMapId;
  maxPlayers: PlayerCount;
  turnTimerSeconds: TurnTimerSeconds;
  victoryPoints: number;
}

export interface AxialCoordinate {
  q: number;
  r: number;
}

export interface PixelCoordinate {
  x: number;
  y: number;
}

export interface GamePlayerInput {
  botDifficulty?: BotDifficulty;
  id: PlayerId;
  displayName: string;
  isBot: boolean;
}

export interface PlayerPieces {
  cities: number;
  roads: number;
  settlements: number;
}

export interface PlayerState extends GamePlayerInput {
  developmentCards: DevelopmentCardType[];
  piecesRemaining: PlayerPieces;
  playedKnights: number;
  resources: ResourceInventory;
  seatIndex: number;
  victoryPoints: number;
}

export interface TileState extends AxialCoordinate {
  id: string;
  numberToken: number | null;
  terrain: TerrainType;
}

export interface PortDescriptor {
  edgeKey: string;
  id: string;
  trade: "any" | ResourceType;
}

export interface BuildingState {
  kind: BuildingKind;
  playerId: PlayerId;
  vertexKey: string;
}

export interface RoadState {
  edgeKey: string;
  playerId: PlayerId;
}

export interface BoardState {
  buildings: BuildingState[];
  ports: PortDescriptor[];
  roads: RoadState[];
  robberTileId: string;
  tiles: TileState[];
}

export interface SetupSettlementPhase {
  kind: "setup_settlement";
  setupIndex: number;
}

export interface SetupRoadPhase {
  kind: "setup_road";
  settlementVertexKey: string;
  setupIndex: number;
}

export interface RollPhase {
  kind: "roll";
}

export interface DiscardRequirement {
  count: number;
  playerId: PlayerId;
}

export interface DiscardPhase {
  kind: "discard";
  pending: DiscardRequirement[];
  rollerPlayerId: PlayerId;
}

export interface MoveRobberPhase {
  kind: "move_robber";
  rollerPlayerId: PlayerId;
}

export interface StealPhase {
  eligibleVictimIds: PlayerId[];
  kind: "steal";
  rollerPlayerId: PlayerId;
}

export interface BuildAndTradePhase {
  kind: "build_and_trade";
}

export interface FinishedPhase {
  kind: "finished";
}

export type GamePhase =
  | SetupSettlementPhase
  | SetupRoadPhase
  | RollPhase
  | DiscardPhase
  | MoveRobberPhase
  | StealPhase
  | BuildAndTradePhase
  | FinishedPhase;

export interface DiceRoll {
  first: number;
  second: number;
  sum: number;
}

export interface TradeOffer {
  give: ResourceInventory;
  offerActionNumber: number;
  proposerPlayerId: PlayerId;
  recipientPlayerIds: PlayerId[];
  rejectedPlayerIds: PlayerId[];
  want: ResourceInventory;
}

export interface GameState {
  actionNumber: number;
  activePlayerId: PlayerId;
  balancedDiceBag: DiceRoll[];
  bank: ResourceInventory;
  board: BoardState;
  developmentDeck: DevelopmentCardType[];
  lastDiceRoll: DiceRoll | null;
  longestRoadPlayerId: PlayerId | null;
  phase: GamePhase;
  players: PlayerState[];
  randomIndex: number;
  seed: string;
  settings: BaseGameSettings;
  status: "active" | "completed";
  tradeOffer: TradeOffer | null;
  turnNumber: number;
  turnOrder: PlayerId[];
  version: 3;
  winnerPlayerId: PlayerId | null;
}

export type GameCommand =
  | { kind: "place_settlement"; vertexKey: string }
  | { edgeKey: string; kind: "place_road" }
  | { kind: "roll" }
  | { kind: "discard"; resources: ResourceInventory }
  | { kind: "move_robber"; tileId: string }
  | { kind: "steal"; victimPlayerId: PlayerId }
  | { kind: "build_city"; vertexKey: string }
  | { kind: "buy_development_card" }
  | {
      give: ResourceType;
      kind: "trade_bank";
      receive: ResourceType;
    }
  | {
      give: ResourceInventory;
      kind: "propose_trade";
      recipientPlayerIds: PlayerId[];
      want: ResourceInventory;
    }
  | {
      accept: boolean;
      kind: "respond_trade";
      offerActionNumber: number;
    }
  | {
      kind: "cancel_trade";
      offerActionNumber: number;
    }
  | { kind: "end_turn" };

export interface BankTradeOption {
  give: ResourceType;
  ratio: number;
  receive: ResourceType;
}

export interface LegalActions {
  bankTrades: BankTradeOption[];
  canBuyDevelopmentCard: boolean;
  canCancelTrade: boolean;
  canEndTurn: boolean;
  canProposeTrade: boolean;
  canRespondToTrade: boolean;
  canRoll: boolean;
  cityVertexKeys: string[];
  discardCount: number | null;
  isRequiredActor: boolean;
  phase: GamePhase["kind"];
  roadEdgeKeys: string[];
  robberTileIds: string[];
  settlementVertexKeys: string[];
  victimPlayerIds: PlayerId[];
}

export interface PublicPlayerState extends Omit<PlayerState, "developmentCards" | "resources"> {
  developmentCardCount: number;
  isViewer: false;
  resourceCount: number;
}

export interface PrivatePlayerState extends PlayerState {
  isViewer: true;
  resourceCount: number;
}

export type PlayerViewState = PublicPlayerState | PrivatePlayerState;

export interface PlayerGameView extends Omit<
  GameState,
  "balancedDiceBag" | "bank" | "developmentDeck" | "players" | "randomIndex" | "seed"
> {
  bank: ResourceInventory | null;
  developmentCardSupply: number;
  legalActions: LegalActions;
  players: PlayerViewState[];
  viewerPlayerId: PlayerId;
}

export type GameRuleErrorCode =
  | "BANK_OUT_OF_RESOURCE"
  | "DISTANCE_RULE"
  | "GAME_FINISHED"
  | "INSUFFICIENT_RESOURCES"
  | "INVALID_COMMAND"
  | "INVALID_DISCARD"
  | "INVALID_LOCATION"
  | "INVALID_PHASE"
  | "INVALID_ROBBER_TILE"
  | "INVALID_TRADE"
  | "INVALID_VICTIM"
  | "LOCATION_OCCUPIED"
  | "NO_DEVELOPMENT_CARD_AVAILABLE"
  | "NO_PIECE_AVAILABLE"
  | "NOT_REQUIRED_ACTOR"
  | "ROAD_NOT_CONNECTED"
  | "ROBBER_TILE_UNCHANGED"
  | "UNKNOWN_PLAYER";

export class GameRuleError extends Error {
  readonly code: GameRuleErrorCode;

  constructor(code: GameRuleErrorCode, message: string) {
    super(message);
    this.name = "GameRuleError";
    this.code = code;
  }
}
