/** Static world tiles. */
export const TileKind = {
  EMPTY: "EMPTY",
  WALL: "WALL",
  DESTRUCTIBLE_WALL: "DESTRUCTIBLE_WALL",
  MURPHY: "MURPHY",
  INFOTRON: "INFOTRON",
  ZONK: "ZONK",
  SNIK_SNAK: "SNIK_SNAK",
  BASE: "BASE",
  TERMINAL: "TERMINAL",
  ELECTRON: "ELECTRON",
  EXPLOSION_GENERATOR: "EXPLOSION_GENERATOR",
  PORTAL: "PORTAL",
  ONE_WAY_UP: "ONE_WAY_UP",
  ONE_WAY_DOWN: "ONE_WAY_DOWN",
  ONE_WAY_LEFT: "ONE_WAY_LEFT",
  ONE_WAY_RIGHT: "ONE_WAY_RIGHT",
} as const;
export type TileKind = (typeof TileKind)[keyof typeof TileKind];

/** Dynamic entities that exist per-cell in the spatial index. */
export const EntityKind = {
  MURPHY: "MURPHY",
  ZONK: "ZONK",
  SNIK_SNAK: "SNIK_SNAK",
  EXPLOSION: "EXPLOSION",
  EXPLOSION_GENERATOR: "EXPLOSION_GENERATOR",
  INFOTRON: "INFOTRON",
  ELECTRON: "ELECTRON",
} as const;
export type EntityKind = (typeof EntityKind)[keyof typeof EntityKind];

export const Direction = {
  UP: "UP",
  DOWN: "DOWN",
  LEFT: "LEFT",
  RIGHT: "RIGHT",
} as const;
export type Direction = (typeof Direction)[keyof typeof Direction];

/** Orthogonal + diagonal, used by Snik Snak pursuit. */
export const Direction8 = {
  UP: "UP",
  DOWN: "DOWN",
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  UP_LEFT: "UP_LEFT",
  UP_RIGHT: "UP_RIGHT",
  DOWN_LEFT: "DOWN_LEFT",
  DOWN_RIGHT: "DOWN_RIGHT",
} as const;
export type Direction8 = (typeof Direction8)[keyof typeof Direction8];

export interface Vec2 {
  x: number;
  y: number;
}

/** Result of a single fixed engine tick: events the app layer may react to. */
export type GameEvent =
  | { type: "score"; amount: number; total: number }
  | { type: "infotronCollected"; remaining: number }
  | { type: "electronDeposited"; remaining: number }
  | { type: "murphyDied" }
  | { type: "baseOpened" }
  | { type: "levelComplete"; score: number; levelIndex: number }
  | { type: "gameOver"; score: number };

/** Snapshot of everything the renderer needs. */
export interface LevelState {
  tiles: Uint8Array; // TileKind ids, row-major
  width: number;
  height: number;
  murphyPos: Vec2;
  murphyVisible: boolean;
  zonkPositions: Vec2[];
  snikSnakPositions: Vec2[];
  explosionPositions: Vec2[];
  infotronCount: number;
  terminalFilled: boolean;
  baseOpen: boolean;
  tick: number;
}

/** Parsed, validated level definition (static layout + spawns). */
export interface LevelData {
  width: number;
  height: number;
  /** Row-major TileKind ids. */
  tiles: Uint8Array;
  murphySpawn: Vec2;
  infotronCount: number;
  portalPairs: Array<[Vec2, Vec2]>;
}
