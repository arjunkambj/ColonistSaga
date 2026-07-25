import { describe, expect, test } from "bun:test";

import { getEventSound, getViewerEventSound, shouldPlayVictory } from "../src/lib/game/audio-cues";

describe("game audio cues", () => {
  test("maps every audible command family to its generated effect", () => {
    expect(getEventSound("roll")).toBe("action");
    expect(getEventSound("place_road")).toBe("piece");
    expect(getEventSound("place_settlement")).toBe("piece");
    expect(getEventSound("build_city")).toBe("piece");
    expect(getEventSound("move_robber")).toBe("robber");
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

  test("uses detailed cues only for the viewer's own actions", () => {
    expect(getViewerEventSound("roll", "viewer", "viewer")).toBe("action");
    expect(getViewerEventSound("roll", "other-player", "viewer")).toBe("action");
    expect(getViewerEventSound("place_road", "other-player", "viewer")).toBe("action");
    expect(getViewerEventSound("end_turn", "other-player", "viewer")).toBeNull();
  });

  test("plays one placement cue for the combined setup settlement and road", () => {
    expect(getViewerEventSound("place_settlement", "viewer", "viewer", "setup_road")).toBeNull();
    expect(getViewerEventSound("place_road", "viewer", "viewer", "setup_settlement")).toBe("piece");
  });

  test("plays victory only when a live game gains a winner", () => {
    expect(shouldPlayVictory(null, "winner")).toBe(true);
    expect(shouldPlayVictory("winner", "winner")).toBe(false);
    expect(shouldPlayVictory(null, null)).toBe(false);
  });
});
