import type { BaseGameSettings } from "@colonistsaga/game";

export const BOT_ACTION_DELAY_MS = 950;

export interface AutomatedActor {
  isBot: boolean;
  playerId: string;
}

export interface PreviousHumanDeadline {
  actorPlayerId: string;
  nextActionAt: number;
}

export interface SchedulingContext {
  previousHumanDeadline?: PreviousHumanDeadline;
  turnDeadlineAt?: number;
}

export function nextTurnDeadlineAt(
  activePlayer: AutomatedActor | null,
  settings: BaseGameSettings,
  now: number,
  previous?: PreviousHumanDeadline,
): number | undefined {
  if (!activePlayer || activePlayer.isBot || settings.turnTimerSeconds === 0) {
    return undefined;
  }
  return previous?.actorPlayerId === activePlayer.playerId
    ? previous.nextActionAt
    : now + settings.turnTimerSeconds * 1_000;
}

export function nextScheduledActionAt(
  actor: AutomatedActor | null,
  settings: BaseGameSettings,
  now: number,
  context: SchedulingContext = {},
): number | undefined {
  if (!actor) {
    return undefined;
  }
  if (actor.isBot) {
    return now + BOT_ACTION_DELAY_MS;
  }
  if (settings.turnTimerSeconds === 0) {
    return undefined;
  }
  if (context.turnDeadlineAt !== undefined) {
    return context.turnDeadlineAt;
  }
  return context.previousHumanDeadline?.actorPlayerId === actor.playerId
    ? context.previousHumanDeadline.nextActionAt
    : now + settings.turnTimerSeconds * 1_000;
}

export function isActionDeadlineExpired(deadlineAt: number | undefined, now: number): boolean {
  return deadlineAt !== undefined && now >= deadlineAt;
}

export function earliestActionDeadlineAt(
  nextActionAt: number | undefined,
  turnDeadlineAt: number | undefined,
): number | undefined {
  if (nextActionAt === undefined) {
    return turnDeadlineAt;
  }
  if (turnDeadlineAt === undefined) {
    return nextActionAt;
  }
  return Math.min(nextActionAt, turnDeadlineAt);
}

export function isScheduledActionDue(
  currentActionAt: number | undefined,
  scheduledFor: number,
  now: number,
): boolean {
  return currentActionAt === scheduledFor && now >= scheduledFor;
}
