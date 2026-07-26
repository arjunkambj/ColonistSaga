import { describe, expect, test } from "bun:test";

import { createDefaultGame, type GameCommand, type GameState } from "@colonistsaga/game";

import { commandEventKind, commandText, parseCommandKind } from "../convex/model/commands";
import { commandValidator } from "../convex/model/validators";

describe("game command boundary", () => {
  test("does not accept the removed development-card purchase command", () => {
    expect(JSON.stringify(commandValidator)).not.toContain("buy_development_card");
  });

  test("reads the command kind used by presentation event cues", () => {
    expect(parseCommandKind('{"kind":"place_road","edgeKey":"1:2"}')).toBe("place_road");
    expect(parseCommandKind("invalid")).toBe("unknown");
    expect(parseCommandKind('{"kind":42}')).toBe("unknown");
  });

  test("reports an automatic robber theft as a compound event", () => {
    const state = createDefaultGame(
      Array.from({ length: 3 }, (_, index) => ({
        displayName: `Player ${index + 1}`,
        id: `player-${index + 1}`,
        isBot: true,
      })),
      "automatic-robber-event",
    );
    const command: GameCommand = { kind: "move_robber", tileId: "tile:0:0" };
    const nextState: GameState = { ...state, randomIndex: state.randomIndex + 1 };

    expect(commandEventKind(command, state, nextState)).toBe("move_robber_and_steal");
    expect(commandText(command, "Player 1", state, nextState)).toBe(
      "Player 1 moved the robber and stole a resource.",
    );
    expect(commandEventKind(command, state, state)).toBe("move_robber");
    expect(commandText(command, "Player 1", state, state)).toBe("Player 1 moved the robber.");
  });
});
