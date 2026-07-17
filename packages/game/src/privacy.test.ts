import { describe, expect, it } from "vitest";

import { toPlayerView } from "./views";
import { createTestGame, inventory, transferFromBank } from "./test-helpers";

describe("player view", () => {
  it("shows the viewer's hand and only opponent card counts", () => {
    let state = createTestGame();
    const [viewer, opponent] = state.players;

    if (!viewer || !opponent) {
      throw new Error("Privacy fixture requires two players");
    }

    state = transferFromBank(state, viewer.id, inventory({ brick: 2, tree: 1 }));
    state = transferFromBank(state, opponent.id, inventory({ stone: 4 }));
    const view = toPlayerView(state, viewer.id);
    const viewerState = view.players.find((player) => player.id === viewer.id)!;
    const opponentState = view.players.find((player) => player.id === opponent.id)!;

    expect(viewerState.isViewer).toBe(true);
    expect("resources" in viewerState).toBe(true);
    expect(viewerState.resourceCount).toBe(3);
    expect(opponentState.isViewer).toBe(false);
    expect("resources" in opponentState).toBe(false);
    expect(opponentState.resourceCount).toBe(4);
    expect("bank" in view).toBe(false);
    expect("seed" in view).toBe(false);
    expect("randomIndex" in view).toBe(false);
  });

  it("keeps the canonical state JSON serializable", () => {
    const state = createTestGame("json-round-trip");
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
});
