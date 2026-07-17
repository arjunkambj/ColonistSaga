import type { BaseGameSettings } from "@catansaga/game";

import { ROOM_CODE_LENGTH } from "./constants";
import { fail } from "./errors";

export function normalizeDisplayName(value: string): string {
  const displayName = value.trim().replace(/\s+/g, " ");
  if (displayName.length < 1 || displayName.length > 24) {
    fail("INVALID_DISPLAY_NAME", "Display name must contain 1 to 24 characters.");
  }
  return displayName;
}

export function normalizeRoomCode(value: string): string {
  const code = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== ROOM_CODE_LENGTH) {
    fail("INVALID_ROOM_CODE", `Room code must contain ${ROOM_CODE_LENGTH} characters.`);
  }
  return code;
}

export function validateClientActionId(value: string): string {
  const clientActionId = value.trim();
  if (
    clientActionId.length < 1 ||
    clientActionId.length > 128 ||
    clientActionId.startsWith("system:")
  ) {
    fail(
      "INVALID_CLIENT_ACTION_ID",
      "Client action ID must contain 1 to 128 characters and cannot use the system prefix.",
    );
  }
  return clientActionId;
}

export function createPrivateGameSeed(): string {
  const randomParts = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36),
  );
  return `catansaga-mvp-v1:${randomParts.join(":")}`;
}

export function validateActionNumber(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    fail("INVALID_ACTION_NUMBER", "Expected action number must be a non-negative integer.");
  }
  return value;
}

export function normalizeSeatId(value: string): string {
  const seatId = value.trim();
  if (seatId.length < 1 || seatId.length > 128) {
    fail("INVALID_TARGET_SEAT", "Target seat ID must contain 1 to 128 characters.");
  }
  return seatId;
}

export function validateGameSettings(settings: BaseGameSettings): BaseGameSettings {
  if (
    !Number.isSafeInteger(settings.victoryPoints) ||
    settings.victoryPoints < 3 ||
    settings.victoryPoints > 13
  ) {
    fail("INVALID_SETTINGS", "Victory points must be an integer from 3 to 13.");
  }
  if (
    !Number.isSafeInteger(settings.discardLimit) ||
    settings.discardLimit < 5 ||
    settings.discardLimit > 20
  ) {
    fail("INVALID_SETTINGS", "Discard limit must be an integer from 5 to 20.");
  }
  if (![0, 30, 60, 90, 120].includes(settings.turnTimerSeconds)) {
    fail("INVALID_SETTINGS", "Turn timer must be 0, 30, 60, 90, or 120 seconds.");
  }
  if (settings.maxPlayers !== 3 && settings.maxPlayers !== 4) {
    fail("INVALID_SETTINGS", "Player count must be 3 or 4.");
  }
  return { ...settings };
}

export function validateBotCount(value: number, maxPlayers: number): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > maxPlayers - 1) {
    fail("INVALID_BOT_COUNT", `Bot count must be an integer from 0 to ${maxPlayers - 1}.`);
  }
  return value;
}
