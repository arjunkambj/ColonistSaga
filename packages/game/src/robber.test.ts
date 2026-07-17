import { describe, expect, it } from "vitest";

import { emptyInventory, filledInventory, totalResources } from "./resources";
import { applyCommand, getLegalActions } from "./rules";
import { DEFAULT_TOPOLOGY } from "./topology";
import {
  completeSetup,
  createTestGame,
  inventory,
  seedForDiceTotal,
  transferFromBank,
} from "./test-helpers";

function robberFixture() {
  let state = completeSetup(createTestGame());
  const [roller, victim] = state.players;

  if (!roller || !victim) {
    throw new Error("Robber fixture requires two players");
  }

  state = {
    ...state,
    bank: filledInventory(19),
    players: state.players.map((player) => ({
      ...player,
      resources: emptyInventory(),
    })),
    seed: seedForDiceTotal(7, state.randomIndex),
  };
  state = transferFromBank(state, roller.id, inventory({ tree: 8 }));
  state = transferFromBank(state, victim.id, inventory({ wheat: 8 }));

  return { roller, state, victim };
}

describe("seven and robber", () => {
  it("requires exact half discards, moves the robber, and steals randomly", () => {
    const fixture = robberFixture();
    let state = applyCommand(fixture.state, fixture.roller.id, { kind: "roll" });

    expect(state.lastDiceRoll?.sum).toBe(7);
    expect(state.phase.kind).toBe("discard");
    expect(getLegalActions(state, fixture.roller.id).discardCount).toBe(4);
    expect(getLegalActions(state, fixture.victim.id).discardCount).toBe(4);
    expect(() =>
      applyCommand(state, fixture.roller.id, {
        kind: "discard",
        resources: inventory({ tree: 3 }),
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_DISCARD" }));

    state = applyCommand(state, fixture.roller.id, {
      kind: "discard",
      resources: inventory({ tree: 4 }),
    });
    state = applyCommand(state, fixture.victim.id, {
      kind: "discard",
      resources: inventory({ wheat: 4 }),
    });
    expect(state.phase.kind).toBe("move_robber");
    expect(() =>
      applyCommand(state, fixture.roller.id, {
        kind: "move_robber",
        tileId: state.board.robberTileId,
      }),
    ).toThrowError(expect.objectContaining({ code: "ROBBER_TILE_UNCHANGED" }));

    const victimBuilding = state.board.buildings.find(
      (building) => building.playerId === fixture.victim.id,
    )!;
    const tileId = DEFAULT_TOPOLOGY.vertexTileIds[victimBuilding.vertexKey]?.find(
      (candidate) => candidate !== state.board.robberTileId,
    );

    expect(tileId).toBeDefined();
    state = applyCommand(state, fixture.roller.id, {
      kind: "move_robber",
      tileId: tileId!,
    });
    expect(state.phase.kind).toBe("steal");
    expect(getLegalActions(state, fixture.roller.id).victimPlayerIds).toContain(fixture.victim.id);

    const bankBefore = { ...state.bank };
    const rollerCardsBefore = totalResources(
      state.players.find((player) => player.id === fixture.roller.id)!.resources,
    );
    const victimCardsBefore = totalResources(
      state.players.find((player) => player.id === fixture.victim.id)!.resources,
    );
    const randomIndexBefore = state.randomIndex;
    state = applyCommand(state, fixture.roller.id, {
      kind: "steal",
      victimPlayerId: fixture.victim.id,
    });

    expect(state.phase.kind).toBe("build_and_trade");
    expect(state.randomIndex).toBe(randomIndexBefore + 1);
    expect(state.bank).toEqual(bankBefore);
    expect(
      totalResources(state.players.find((player) => player.id === fixture.roller.id)!.resources),
    ).toBe(rollerCardsBefore + 1);
    expect(
      totalResources(state.players.find((player) => player.id === fixture.victim.id)!.resources),
    ).toBe(victimCardsBefore - 1);
  });

  it("does not let an unrelated player act during discards", () => {
    const fixture = robberFixture();
    const state = applyCommand(fixture.state, fixture.roller.id, { kind: "roll" });
    const unrelated = state.players[2]!;

    expect(() =>
      applyCommand(state, unrelated.id, {
        kind: "discard",
        resources: emptyInventory(),
      }),
    ).toThrowError(expect.objectContaining({ code: "NOT_REQUIRED_ACTOR" }));
  });

  it("skips stealing when the destination has no eligible victim", () => {
    const fixture = robberFixture();
    let state = applyCommand(fixture.state, fixture.roller.id, { kind: "roll" });
    state = applyCommand(state, fixture.roller.id, {
      kind: "discard",
      resources: inventory({ tree: 4 }),
    });
    state = applyCommand(state, fixture.victim.id, {
      kind: "discard",
      resources: inventory({ wheat: 4 }),
    });

    const occupiedTiles = new Set(
      state.board.buildings.flatMap(
        (building) => DEFAULT_TOPOLOGY.vertexTileIds[building.vertexKey] ?? [],
      ),
    );
    const emptyTile = state.board.tiles.find(
      (tile) => tile.id !== state.board.robberTileId && !occupiedTiles.has(tile.id),
    );

    expect(emptyTile).toBeDefined();
    const moved = applyCommand(state, fixture.roller.id, {
      kind: "move_robber",
      tileId: emptyTile!.id,
    });
    expect(moved.phase.kind).toBe("build_and_trade");
  });
});
