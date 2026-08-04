/** Win/lose evaluation helpers for a playthrough. */

export interface Progress {
  levelIndex: number;
  unlockedLevel: number;
  highScore: number;
}

/** Storage keys used by persistence. */
export const STORAGE_KEYS = {
  unlockedLevel: "supaplex.unlockedLevel",
  highScore: "supaplex.highScore",
} as const;

/** Read persisted progress; safe against unavailable/malformed storage. */
export function loadProgress(storage: Storage = globalThis.localStorage): Progress {
  const unlocked = Number(storage.getItem(STORAGE_KEYS.unlockedLevel));
  const highScore = Number(storage.getItem(STORAGE_KEYS.highScore));
  return {
    levelIndex: 0,
    unlockedLevel: Number.isFinite(unlocked) && unlocked >= 1 ? unlocked : 1,
    highScore: Number.isFinite(highScore) && highScore >= 0 ? highScore : 0,
  };
}

/** Persist progress. */
export function saveProgress(
  unlockedLevel: number,
  highScore: number,
  storage: Storage = globalThis.localStorage,
): void {
  storage.setItem(STORAGE_KEYS.unlockedLevel, String(unlockedLevel));
  storage.setItem(STORAGE_KEYS.highScore, String(highScore));
}
