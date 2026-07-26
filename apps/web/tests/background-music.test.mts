import { describe, expect, test } from "bun:test";

import { syncBackgroundMusic } from "../src/lib/background-music";

describe("background music", () => {
  test("resumes a paused track when its volume becomes positive", () => {
    let pauseCount = 0;
    let playCount = 0;
    const audio = {
      pause() {
        pauseCount += 1;
        audio.paused = true;
      },
      paused: false,
      play() {
        playCount += 1;
        audio.paused = false;
        return Promise.resolve();
      },
      volume: 0.5,
    };

    syncBackgroundMusic(audio, 0);
    expect(audio.volume).toBe(0);
    expect(pauseCount).toBe(1);

    syncBackgroundMusic(audio, 35);
    expect(audio.volume).toBe(0.35);
    expect(playCount).toBe(1);
    expect(audio.paused).toBe(false);
  });
});
