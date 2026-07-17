import assert from "node:assert/strict";
import test from "node:test";

import { getCurrentHexclaveUser } from "../convex/hexclave/auth.ts";

type AuthContext = Parameters<typeof getCurrentHexclaveUser>[0];

function authContext(identity: unknown): AuthContext {
  return {
    auth: {
      getUserIdentity: async () => identity,
    },
  } as AuthContext;
}

const FULL_ACCOUNT_IDENTITY = {
  email: "player@example.com",
  is_anonymous: false,
  is_restricted: false,
  name: "Player",
  role: "authenticated",
  subject: "hexclave-user-1",
};

test("accepts a full Hexclave account", async () => {
  const auth = await getCurrentHexclaveUser(authContext(FULL_ACCOUNT_IDENTITY));

  assert.equal(auth.authenticated, true);
  if (auth.authenticated) {
    assert.equal(auth.user.id, "hexclave-user-1");
  }
});

test("rejects unauthenticated access", async () => {
  const auth = await getCurrentHexclaveUser(authContext(null));

  assert.deepEqual(auth, { authenticated: false, error: "Unauthenticated." });
});

test("rejects anonymous Hexclave identities", async () => {
  const auth = await getCurrentHexclaveUser(
    authContext({ ...FULL_ACCOUNT_IDENTITY, is_anonymous: true }),
  );

  assert.deepEqual(auth, {
    authenticated: false,
    error: "A full Hexclave account is required.",
  });
});

test("rejects restricted Hexclave identities", async () => {
  const auth = await getCurrentHexclaveUser(
    authContext({ ...FULL_ACCOUNT_IDENTITY, is_restricted: true }),
  );

  assert.deepEqual(auth, {
    authenticated: false,
    error: "A full Hexclave account is required.",
  });
});
