import assert from "node:assert/strict";
import test from "node:test";

import {
  SESSION_STORAGE_KEY,
  createGuestSession,
  normalizeRoomCode,
  readGuestSession,
  writeGuestSession,
} from "./session.ts";

function createMemoryStorage(initialValue: string | null = null) {
  let value = initialValue;
  return {
    getItem(key: string) {
      return key === SESSION_STORAGE_KEY ? value : null;
    },
    setItem(key: string, nextValue: string) {
      if (key === SESSION_STORAGE_KEY) {
        value = nextValue;
      }
    },
  };
}

test("normalizes invite codes for URL and form use", () => {
  assert.equal(normalizeRoomCode(" ab-c 123! "), "ABC123");
});

test("creates and persists a versioned opaque guest session", () => {
  const storage = createMemoryStorage();
  const session = createGuestSession(() => "opaque-session-id");

  writeGuestSession(storage, { ...session, activeCode: "CATAN1" });

  assert.deepEqual(readGuestSession(storage), {
    activeCode: "CATAN1",
    displayName: "Explorer",
    sessionId: "opaque-session-id",
    version: 1,
  });
});

test("replaces malformed or obsolete stored data", () => {
  const storage = createMemoryStorage('{"version":0,"sessionId":"old-value"}');

  assert.equal(readGuestSession(storage, () => "replacement-id").sessionId, "replacement-id");
});
