import assert from "node:assert/strict";
import test from "node:test";

import {
  BOT_ACTION_DELAY_MS,
  earliestActionDeadlineAt,
  isActionDeadlineExpired,
  isScheduledActionDue,
  nextScheduledActionAt,
  nextTurnDeadlineAt,
} from "./mvp-scheduling.ts";

const NOW = 100_000;
const SETTINGS = {
  balancedDice: true,
  discardLimit: 7,
  friendlyRobber: true,
  hideBankCards: false,
  maxPlayers: 4,
  turnTimerSeconds: 60,
  victoryPoints: 10,
} as const;

test("paces every bot command as a separate scheduled step", () => {
  assert.equal(
    nextScheduledActionAt({ isBot: true, playerId: "bot" }, SETTINGS, NOW),
    NOW + BOT_ACTION_DELAY_MS,
  );
});

test("keeps one deadline across commands in the same human turn", () => {
  const deadline = NOW + 30_000;
  assert.equal(
    nextScheduledActionAt(
      { isBot: false, playerId: "human" },
      { ...SETTINGS, turnTimerSeconds: 30 },
      NOW + 5_000,
      { previousHumanDeadline: { actorPlayerId: "human", nextActionAt: deadline } },
    ),
    deadline,
  );
});

test("starts a fresh deadline when the required human changes", () => {
  assert.equal(
    nextScheduledActionAt({ isBot: false, playerId: "next-human" }, SETTINGS, NOW, {
      previousHumanDeadline: {
        actorPlayerId: "previous-human",
        nextActionAt: NOW + 10_000,
      },
    }),
    NOW + 60_000,
  );
});

test("keeps the active human turn deadline across bot responses", () => {
  const deadline = NOW + 30_000;
  assert.equal(
    nextTurnDeadlineAt(
      { isBot: false, playerId: "human" },
      { ...SETTINGS, turnTimerSeconds: 30 },
      NOW + BOT_ACTION_DELAY_MS,
      { actorPlayerId: "human", nextActionAt: deadline },
    ),
    deadline,
  );
  assert.equal(
    nextScheduledActionAt(
      { isBot: false, playerId: "human" },
      { ...SETTINGS, turnTimerSeconds: 30 },
      NOW + BOT_ACTION_DELAY_MS,
      { turnDeadlineAt: deadline },
    ),
    deadline,
  );
});

test("rejects stale callbacks and commands at or after their deadline", () => {
  const deadline = NOW + 1_000;
  assert.equal(isScheduledActionDue(deadline, deadline - 1, deadline), false);
  assert.equal(isScheduledActionDue(deadline, deadline, deadline - 1), false);
  assert.equal(isScheduledActionDue(deadline, deadline, deadline), true);
  assert.equal(isActionDeadlineExpired(deadline, deadline - 1), false);
  assert.equal(isActionDeadlineExpired(deadline, deadline), true);
});

test("uses the active turn deadline when it expires before a bot interstitial", () => {
  const humanTurnDeadline = NOW + 100;
  const botActionAt = NOW + BOT_ACTION_DELAY_MS;
  assert.equal(earliestActionDeadlineAt(botActionAt, humanTurnDeadline), humanTurnDeadline);
  assert.equal(earliestActionDeadlineAt(botActionAt, undefined), botActionAt);
  assert.equal(earliestActionDeadlineAt(undefined, humanTurnDeadline), humanTurnDeadline);
});

test("does not schedule human automation when the timer is off", () => {
  assert.equal(
    nextScheduledActionAt(
      { isBot: false, playerId: "human" },
      { ...SETTINGS, turnTimerSeconds: 0 },
      NOW,
    ),
    undefined,
  );
});
