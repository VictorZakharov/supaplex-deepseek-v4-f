/** Fixed simulation timestep in milliseconds. */
export const TICK_MS = 50;

/** Murphy advances one cell every N ticks while a direction is held. */
export const MURPHY_STEP_TICKS = 2;

/** Zonk changes axis/turns every N ticks (classic bounce cadence). */
export const ZONK_STEP_TICKS = 2;

/** Snik Snak advances one cell every N ticks. */
export const SNIK_SNAK_STEP_TICKS = 2;

/** Explosion generator pulses a new blast every N ticks. */
export const GENERATOR_PULSE_TICKS = 6;

/** Blast front advances one cell every N ticks. */
export const EXPLOSION_STEP_TICKS = 2;

/** Starting lives. */
export const START_LIVES = 3;

/** Points for collecting an Infotron. */
export const SCORE_INFOTRON = 100;

/** Points for depositing an Electron in a Terminal. */
export const SCORE_ELECTRON = 250;

/** Points for completing a level. */
export const SCORE_LEVEL_COMPLETE = 1000;

/** Extra life every N points. */
export const EXTRA_LIFE_EVERY = 10000;

/** Number of sample levels. */
export const LEVEL_COUNT = 8;
