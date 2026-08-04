import {
  EXTRA_LIFE_EVERY,
  SCORE_ELECTRON,
  SCORE_INFOTRON,
  SCORE_LEVEL_COMPLETE,
  START_LIVES,
} from "../constants";

/** Score table. Single place to tune points. */
export const GameRules = {
  infotron: SCORE_INFOTRON,
  electron: SCORE_ELECTRON,
  levelComplete: SCORE_LEVEL_COMPLETE,
  extraLifeEvery: EXTRA_LIFE_EVERY,
} as const;

/**
 * Tracks score, lives, and extra-life milestones across a playthrough.
 * The app layer calls the add* methods in response to engine events.
 */
export class GameSession {
  private score = 0;
  private lives: number;
  private nextExtraLifeAt: number;

  constructor(lives = START_LIVES) {
    this.lives = lives;
    this.nextExtraLifeAt = GameRules.extraLifeEvery;
  }

  getScore(): number {
    return this.score;
  }

  getLives(): number {
    return this.lives;
  }

  addInfotron(): void {
    this.addScore(GameRules.infotron);
  }

  addElectron(): void {
    this.addScore(GameRules.electron);
  }

  addLevelComplete(): void {
    this.addScore(GameRules.levelComplete);
  }

  /** Add an arbitrary score amount (e.g. from a bonus). */
  addScore(amount: number): void {
    this.score += amount;
    while (this.score >= this.nextExtraLifeAt) {
      this.lives++;
      this.nextExtraLifeAt += GameRules.extraLifeEvery;
    }
  }

  loseLife(): boolean {
    this.lives--;
    return this.lives <= 0;
  }
}
