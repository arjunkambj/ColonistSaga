import assert from "node:assert/strict";
import test from "node:test";

import {
  SESSION_STORAGE_KEY,
  createPlayerSession,
  normalizeRoomCode,
  readPlayerSession,
  writePlayerSession,
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

test("persists only account-scoped player preferences", () => {
  const storage = createMemoryStorage();
  const session = createPlayerSession("hexclave-user-1", "Arjun");

  writePlayerSession(storage, { ...session, activeCode: "CATAN1" });

  assert.deepEqual(readPlayerSession(storage, "hexclave-user-1", "Arjun"), {
    activeCode: "CATAN1",
    displayName: "Arjun",
    userId: "hexclave-user-1",
    version: 2,
  });
});

test("does not restore another account's room or display name", () => {
  const storage = createMemoryStorage(
    '{"version":2,"userId":"hexclave-user-1","displayName":"Arjun","activeCode":"CATAN1"}',
  );

  assert.deepEqual(readPlayerSession(storage, "hexclave-user-2", "Mira"), {
    displayName: "Mira",
    userId: "hexclave-user-2",
    version: 2,
  });
});

test("replaces malformed or obsolete stored data", () => {
  const storage = createMemoryStorage('{"version":1,"sessionId":"old-value"}');

  assert.deepEqual(readPlayerSession(storage, "hexclave-user-1", "Arjun"), {
    displayName: "Arjun",
    userId: "hexclave-user-1",
    version: 2,
  });
});
