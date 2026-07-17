export const SESSION_STORAGE_KEY = "catansaga.session.v1";
export const SESSION_VERSION = 1;

export interface GuestSession {
  activeCode?: string;
  displayName: string;
  sessionId: string;
  version: typeof SESSION_VERSION;
}

interface StorageReader {
  getItem(key: string): string | null;
}

interface StorageWriter extends StorageReader {
  setItem(key: string, value: string): void;
}

const ROOM_CODE_PATTERN = /^[A-Z0-9]{6}$/;

export function normalizeRoomCode(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

export function isRoomCode(value: string): boolean {
  return ROOM_CODE_PATTERN.test(value);
}

export function createGuestSession(
  createId: () => string = () => globalThis.crypto.randomUUID(),
): GuestSession {
  return {
    displayName: "Explorer",
    sessionId: createId(),
    version: SESSION_VERSION,
  };
}

export function readGuestSession(storage: StorageReader, createId?: () => string): GuestSession {
  const stored = storage.getItem(SESSION_STORAGE_KEY);
  if (!stored) {
    return createGuestSession(createId);
  }

  try {
    const value: unknown = JSON.parse(stored);
    if (!isGuestSession(value)) {
      return createGuestSession(createId);
    }
    return value;
  } catch {
    return createGuestSession(createId);
  }
}

export function writeGuestSession(storage: StorageWriter, session: GuestSession): void {
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function isGuestSession(value: unknown): value is GuestSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<GuestSession>;
  const hasValidCode = session.activeCode === undefined || isRoomCode(session.activeCode);

  return (
    session.version === SESSION_VERSION &&
    typeof session.sessionId === "string" &&
    session.sessionId.length >= 8 &&
    typeof session.displayName === "string" &&
    session.displayName.length > 0 &&
    hasValidCode
  );
}
