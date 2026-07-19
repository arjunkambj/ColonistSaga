export const DEFAULT_MUSIC_VOLUME = 35;

const MUSIC_VOLUME_STORAGE_KEY = "colonistsaga:music-volume";

export function normalizeMusicVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_MUSIC_VOLUME;
  }

  return Math.round(Math.min(100, Math.max(0, value)));
}

export function readMusicVolume(storage: Pick<Storage, "getItem">): number {
  try {
    const storedVolume = storage.getItem(MUSIC_VOLUME_STORAGE_KEY);
    if (storedVolume === null) {
      return DEFAULT_MUSIC_VOLUME;
    }

    return normalizeMusicVolume(Number(storedVolume));
  } catch {
    return DEFAULT_MUSIC_VOLUME;
  }
}

export function writeMusicVolume(storage: Pick<Storage, "setItem">, volume: number): void {
  try {
    storage.setItem(MUSIC_VOLUME_STORAGE_KEY, String(normalizeMusicVolume(volume)));
  } catch {
    // The selected volume still applies for this visit when storage is unavailable.
  }
}
