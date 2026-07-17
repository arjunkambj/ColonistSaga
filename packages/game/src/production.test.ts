import { describe, expect, it } from "vitest";

import { distributeResourcesForRoll } from "./rules";
import { DEFAULT_TOPOLOGY } from "./topology";
import { createTestGame } from "./test-helpers";

function productionFixture() {
  const state = createTestGame();
  const tile = state.board.tiles.find(
    (candidate) => candidate.terrain === "fields" && candidate.numberToken === 8,
  );

  if (!tile) {
    throw new Error("Fixture requires an eight fields tile");
  }

  const [settlementVertex, cityVertex] = DEFAULT_TOPOLOGY.tileById[tile.id]?.vertexKeys ?? [];

  if (!settlementVertex || !cityVertex) {
    throw new Error("Fixture tile requires two vertices");
  }

  return {
    state: {
      ...state,
      board: {
        ...state.board,
        buildings: [
          {
            kind: "settlement" as const,
            playerId: state.players[0]!.id,
            vertexKey: settlementVertex,
          },
          {
            kind: "city" as const,
            playerId: state.players[1]!.id,
            vertexKey: cityVertex,
          },
        ],
      },
    },
    tile,
  };
}

describe("resource production", () => {
  it("pays one for a settlement and two for a city", () => {
    const { state } = productionFixture();
    const produced = distributeResourcesForRoll(state, 8);

    expect(produced.players[0]?.resources.wheat).toBe(1);
    expect(produced.players[1]?.resources.wheat).toBe(2);
    expect(produced.bank.wheat).toBe(16);
  });

  it("suppresses production on the robber tile", () => {
    const { state, tile } = productionFixture();
    const produced = distributeResourcesForRoll(
      { ...state, board: { ...state.board, robberTileId: tile.id } },
      8,
    );

    expect(produced.players[0]?.resources.wheat).toBe(0);
    expect(produced.players[1]?.resources.wheat).toBe(0);
    expect(produced.bank.wheat).toBe(19);
  });

  it("pays nobody when multiple claimants exceed the bank supply", () => {
    const { state } = productionFixture();
    const produced = distributeResourcesForRoll({ ...state, bank: { ...state.bank, wheat: 2 } }, 8);

    expect(produced.players[0]?.resources.wheat).toBe(0);
    expect(produced.players[1]?.resources.wheat).toBe(0);
    expect(produced.bank.wheat).toBe(2);
  });

  it("gives the remaining supply when only one player has a claim", () => {
    const { state } = productionFixture();
    const oneClaimant = {
      ...state,
      bank: { ...state.bank, wheat: 1 },
      board: {
        ...state.board,
        buildings: state.board.buildings.filter(
          (building) => building.playerId === state.players[1]?.id,
        ),
      },
    };
    const produced = distributeResourcesForRoll(oneClaimant, 8);

    expect(produced.players[1]?.resources.wheat).toBe(1);
    expect(produced.bank.wheat).toBe(0);
  });
});
