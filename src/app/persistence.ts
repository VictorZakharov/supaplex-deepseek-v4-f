import { STORAGE_KEYS } from "../core/game/GameRules";

/** Persist progress to localStorage; safe against storage being unavailable. */
export function loadProgress(): { unlockedLevel: number; highScore: number } {
  try {
    const unlocked = Number(localStorage.getItem(STORAGE_KEYS.unlockedLevel));
    const highScore = Number(localStorage.getItem(STORAGE_KEYS.highScore));
    return {
      unlockedLevel: Number.isFinite(unlocked) && unlocked >= 1 ? unlocked : 1,
      highScore: Number.isFinite(highScore) && highScore >= 0 ? highScore : 0,
    };
  } catch {
    return { unlockedLevel: 1, highScore: 0 };
  }
}

export function saveProgress(unlockedLevel: number, highScore: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.unlockedLevel, String(unlockedLevel));
    localStorage.setItem(STORAGE_KEYS.highScore, String(highScore));
  } catch {
    // Storage unavailable (e.g. private mode); ignore.
  }
}
