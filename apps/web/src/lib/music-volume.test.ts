import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_MUSIC_VOLUME,
  normalizeMusicVolume,
  readMusicVolume,
  writeMusicVolume,
} from "./music-volume.ts";

test("normalizes music volume to a whole percentage", () => {
  assert.equal(normalizeMusicVolume(-1), 0);
  assert.equal(normalizeMusicVolume(42.6), 43);
  assert.equal(normalizeMusicVolume(101), 100);
  assert.equal(normalizeMusicVolume(Number.NaN), DEFAULT_MUSIC_VOLUME);
});

test("reads a saved volume and falls back when no value exists", () => {
  assert.equal(readMusicVolume({ getItem: () => "64" }), 64);
  assert.equal(readMusicVolume({ getItem: () => null }), DEFAULT_MUSIC_VOLUME);
});

test("writes a normalized volume", () => {
  let savedValue = "";

  writeMusicVolume(
    {
      setItem: (_key, value) => {
        savedValue = value;
      },
    },
    120,
  );

  assert.equal(savedValue, "100");
});
