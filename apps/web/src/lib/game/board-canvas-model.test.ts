import assert from "node:assert/strict";
import test from "node:test";

import type { GamePhase, PlayerGameView } from "@colonistsaga/game";

import {
  createBoardCanvasTargetModels,
  resolveBoardTargetMode,
  type BoardBuildMode,
} from "./board-canvas-model.ts";
import {
  createBoardLayout,
  getEdgePlacement,
  getTilePoint,
  getVertexPoint,
} from "./board-layout.ts";

const TILES: PlayerGameView["board"]["tiles"] = [
  { id: "tile-a", numberToken: 5, q: 0, r: 0, terrain: "fields" },
  { id: "tile-b", numberToken: 8, q: 1, r: 0, terrain: "forest" },
];
const LAYOUT = createBoardLayout(TILES);
const VERTEX_KEY = Object.keys(LAYOUT.topology.vertexPositions)[0];
const EDGE_KEY = Object.keys(LAYOUT.topology.edgeVertices)[0];
const SHARED_VERTEX_KEY = Object.entries(LAYOUT.topology.vertexTileIds).find(
  ([, tileIds]) => tileIds.length === 2,
)?.[0];
const SHARED_EDGE_KEY = Object.entries(LAYOUT.topology.edgeTileIds).find(
  ([, tileIds]) => tileIds.length === 2,
)?.[0];

if (!VERTEX_KEY || !EDGE_KEY || !SHARED_VERTEX_KEY || !SHARED_EDGE_KEY) {
  throw new Error(
    "The board fixture must contain vertex and edge geometry, including shared locations.",
  );
}

test("setup phases override the optional build mode", () => {
  assert.equal(resolveBoardTargetMode(createGame("setup_settlement"), "city"), "settlement");
  assert.equal(resolveBoardTargetMode(createGame("setup_road"), null), "road");
  assert.equal(resolveBoardTargetMode(createGame("move_robber"), "road"), "robber");
});

test("hides every target when the viewer is not the required actor", () => {
  const game = createGame("build_and_trade", { isRequiredActor: false });

  assert.equal(resolveBoardTargetMode(game, "settlement"), null);
  assert.deepEqual(createModels(game, "settlement"), []);
});

test("builds a settlement target with stable geometry and command data", () => {
  const game = createGame("setup_settlement", { settlementVertexKeys: [VERTEX_KEY] });
  const [target] = createModels(game, null);

  assert.deepEqual(target, {
    angle: 0,
    ariaHidden: false,
    asset: "settlement",
    command: { kind: "place_settlement", vertexKey: VERTEX_KEY },
    compactLabel: "Settlement 1",
    compactPlacement: false,
    id: `settlement:${VERTEX_KEY}`,
    interactive: true,
    label: "Place settlement at legal vertex beside Fields 5 and Forest 8; option 1 of 1",
    locationKey: VERTEX_KEY,
    marker: 1,
    point: getVertexPoint(LAYOUT, VERTEX_KEY),
    showMarker: false,
    successMessage: "Settlement placed.",
    theme: "teal",
    type: "vertex",
  });
});

test("builds a compact city target for the selected build mode", () => {
  const game = createGame("build_and_trade", { cityVertexKeys: [SHARED_VERTEX_KEY] });
  const [target] = createModels(game, "city", true);

  assert.equal(target?.asset, "city");
  assert.deepEqual(target?.command, { kind: "build_city", vertexKey: SHARED_VERTEX_KEY });
  assert.equal(target?.compactLabel, "City 1");
  assert.equal(
    target?.label,
    "Upgrade city at legal vertex beside Fields 5 and Forest 8; option 1 of 1",
  );
  assert.equal(target?.ariaHidden, true);
  assert.equal(target?.interactive, false);
  assert.equal(target?.showMarker, true);
  assert.equal(target?.theme, "teal");
});

test("builds a road target with its precomputed canvas angle", () => {
  const game = createGame("setup_road", { roadEdgeKeys: [SHARED_EDGE_KEY] });
  const [target] = createModels(game, null);
  const placement = getEdgePlacement(LAYOUT, SHARED_EDGE_KEY);

  assert.equal(target?.asset, "road");
  assert.equal(target?.type, "edge");
  assert.deepEqual(target?.command, { edgeKey: SHARED_EDGE_KEY, kind: "place_road" });
  assert.equal(target?.angle, placement?.angle);
  assert.deepEqual(target?.point, placement ? { x: placement.x, y: placement.y } : null);
  assert.equal(
    target?.label,
    "Place road at legal edge beside Fields 5 and Forest 8; option 1 of 1",
  );
});

test("indexes tiles once to build ordered robber targets", () => {
  const game = createGame("move_robber", { robberTileIds: ["tile-b", "tile-a"] });
  const targets = createModels(game, null);

  assert.deepEqual(
    targets.map((target) => ({
      command: target.command,
      id: target.id,
      label: target.label,
      marker: target.marker,
      point: target.point,
    })),
    [
      {
        command: { kind: "move_robber", tileId: "tile-b" },
        id: "robber:tile-b",
        label: "Move robber to Forest 8 tile; option 1 of 2",
        marker: 1,
        point: getTilePoint(LAYOUT, TILES[1]!),
      },
      {
        command: { kind: "move_robber", tileId: "tile-a" },
        id: "robber:tile-a",
        label: "Move robber to Fields 5 tile; option 2 of 2",
        marker: 2,
        point: getTilePoint(LAYOUT, TILES[0]!),
      },
    ],
  );
});

test("omits missing vertex, edge, and tile geometry and keeps markers contiguous", () => {
  const cases: readonly [BoardBuildMode, PlayerGameView][] = [
    [
      "settlement",
      createGame("build_and_trade", {
        settlementVertexKeys: ["missing-vertex", VERTEX_KEY],
      }),
    ],
    ["city", createGame("build_and_trade", { cityVertexKeys: ["missing-vertex", VERTEX_KEY] })],
    ["road", createGame("build_and_trade", { roadEdgeKeys: ["missing-edge", EDGE_KEY] })],
    [null, createGame("move_robber", { robberTileIds: ["missing-tile", "tile-a"] })],
  ];

  for (const [buildMode, game] of cases) {
    const targets = createModels(game, buildMode);

    assert.equal(targets.length, 1);
    assert.equal(targets[0]?.marker, 1);
    assert.equal(targets[0]?.label.endsWith("option 1 of 1"), true);
  }
});

function createModels(game: PlayerGameView, buildMode: BoardBuildMode, compactPlacement = false) {
  return createBoardCanvasTargetModels({
    buildMode,
    compactPlacement,
    game,
    layout: LAYOUT,
    viewerTheme: "teal",
  });
}

function createGame(
  phaseKind: GamePhase["kind"],
  legalActions: Partial<PlayerGameView["legalActions"]> = {},
): PlayerGameView {
  const phase = createPhase(phaseKind);

  return {
    board: {
      buildings: [],
      ports: [],
      roads: [],
      robberTileId: "tile-a",
      tiles: TILES,
    },
    legalActions: {
      bankTrades: [],
      canCancelTrade: false,
      canEndTurn: false,
      canProposeTrade: false,
      canRespondToTrade: false,
      canRoll: false,
      cityVertexKeys: [],
      discardCount: null,
      isRequiredActor: true,
      phase: phase.kind,
      roadEdgeKeys: [],
      robberTileIds: [],
      settlementVertexKeys: [],
      victimPlayerIds: [],
      ...legalActions,
    },
    phase,
  } as unknown as PlayerGameView;
}

function createPhase(kind: GamePhase["kind"]): GamePhase {
  switch (kind) {
    case "discard":
      return { kind, pending: [], rollerPlayerId: "viewer" };
    case "finished":
      return { kind };
    case "move_robber":
      return { kind, rollerPlayerId: "viewer" };
    case "setup_road":
      return { kind, settlementVertexKey: VERTEX_KEY, setupIndex: 0 };
    case "setup_settlement":
      return { kind, setupIndex: 0 };
    case "steal":
      return { eligibleVictimIds: [], kind, rollerPlayerId: "viewer" };
    case "build_and_trade":
    case "roll":
      return { kind };
  }
}
