import assert from "node:assert/strict";
import test from "node:test";

import type { LobbySeatMember } from "./lobby-settings-model.ts";
import {
  createLobbySeatPreview,
  getBotCapacity,
  getMinimumPlayerCount,
} from "./lobby-settings-model.ts";

const HOST: LobbySeatMember = {
  controller: "player",
  displayName: "Arjun",
  id: "host",
  playerColor: "red",
  ready: true,
  role: "host",
  seatIndex: 0,
};

test("recalculates bot capacity when a two-human lobby shrinks", () => {
  assert.equal(getBotCapacity(4, 2), 2);
  assert.equal(getBotCapacity(3, 2), 1);
});

test("prevents a table from being smaller than its human membership", () => {
  assert.equal(getMinimumPlayerCount("base", 3), 3);
  assert.equal(getMinimumPlayerCount("base", 4), 4);
  assert.equal(getMinimumPlayerCount("base", 8), 8);
});

test("supports seven bots at an eight-player table", () => {
  assert.equal(getBotCapacity(8, 1), 7);
});

test("previews a changed player limit in the sidebar", () => {
  const seats = createLobbySeatPreview({
    botCount: 0,
    maxPlayers: 7,
    members: [HOST],
    savedMaxPlayers: 4,
  });

  assert.equal(seats.length, 7);
  assert.equal(seats.filter(Boolean).length, 1);
});

test("previews newly added bots before the lobby settings are saved", () => {
  const seats = createLobbySeatPreview({
    botCount: 2,
    maxPlayers: 4,
    members: [HOST],
    savedMaxPlayers: 4,
  });

  assert.deepEqual(
    seats.map((member) => member?.displayName),
    ["Arjun", "Bot 2", "Bot 3", undefined],
  );
});
