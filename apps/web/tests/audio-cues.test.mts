import { describe, expect, test } from "bun:test";

import { getEventSound, getViewerEventSound, shouldPlayVictory } from "../src/lib/game/audio-cues";

describe("game audio cues", () => {
  test("maps every audible command family to its generated effect", () => {
    expect(getEventSound("roll", 0)).toBe("dice");
    expect(getEventSound("roll", 1)).toBe("dice");
    expect(getEventSound("place_road")).toBe("road");
    expect(getEventSound("place_settlement")).toBe("settlement");
    expect(getEventSound("build_city")).toBe("city");
    expect(getEventSound("move_robber")).toBe("robber");
    expect(getEventSound("move_robber_and_steal")).toBe("robber");
    expect(getEventSound("discard")).toBe("resource");
    expect(getEventSound("steal")).toBe("resource");
    expect(getEventSound("trade_bank")).toBe("trade");
    expect(getEventSound("respond_trade")).toBe("trade");
    expect(getEventSound("propose_trade")).toBe("action");
  });

  test("ignores commands without a dedicated result cue", () => {
    expect(getEventSound("end_turn")).toBeNull();
    expect(getEventSound("unknown")).toBeNull();
  });

  test("plays one placement cue for the combined setup settlement and road", () => {
    expect(getEventSound("place_settlement", 0, "setup_road")).toBeNull();
    expect(getEventSound("place_road", 0, "setup_settlement")).toBe("road");
  });

  test("reserves detailed cues for the viewer's own actions", () => {
    expect(getViewerEventSound("roll", 1, "rolling", "me", "me")).toBe("dice");
    expect(getViewerEventSound("roll", 1, "rolling", "other", "me")).toBe("action");
    expect(getViewerEventSound("place_road", 2, "main", "other", "me")).toBe("action");
    expect(getViewerEventSound("end_turn", 3, "main", "other", "me")).toBeNull();
  });

  test("plays victory only when a live game gains a winner", () => {
    expect(shouldPlayVictory(null, "winner")).toBe(true);
    expect(shouldPlayVictory("winner", "winner")).toBe(false);
    expect(shouldPlayVictory(null, null)).toBe(false);
  });
});
