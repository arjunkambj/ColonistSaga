import { describe, expect, test } from "bun:test";

import { getPlayerHudOrder } from "../src/lib/game/view";

describe("player HUD order", () => {
  test.each([
    {
      playerIds: ["viewer", "blue", "orange", "green"],
      viewerId: "viewer",
    },
    {
      playerIds: ["blue", "viewer", "orange", "green"],
      viewerId: "viewer",
    },
    {
      playerIds: ["blue", "orange", "green", "viewer"],
      viewerId: "viewer",
    },
  ])("places the viewer last when the original order is $playerIds", ({ playerIds, viewerId }) => {
    const players = playerIds.map((id) => ({ id, isViewer: id === viewerId }));

    expect(getPlayerHudOrder(players).map((player) => player.id)).toEqual([
      ...playerIds.filter((id) => id !== viewerId),
      viewerId,
    ]);
  });

  test("keeps opponent order stable", () => {
    const players = [
      { id: "orange", isViewer: false },
      { id: "viewer", isViewer: true },
      { id: "green", isViewer: false },
      { id: "blue", isViewer: false },
    ];

    expect(getPlayerHudOrder(players).map((player) => player.id)).toEqual([
      "orange",
      "green",
      "blue",
      "viewer",
    ]);
  });

  test("does not mutate the canonical player order", () => {
    const players = [
      { id: "viewer", isViewer: true },
      { id: "blue", isViewer: false },
    ];

    getPlayerHudOrder(players);

    expect(players.map((player) => player.id)).toEqual(["viewer", "blue"]);
  });
});
