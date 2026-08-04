import { TileKind } from "../types";
import type { Direction } from "../types";

/**
 * Static per-tile metadata. This table is the single source of truth for
 * passability, destructibility, and special behavior. Values marked
 * "verify against original" are isolated here so they can be corrected
 * in one place.
 */
export interface TileMeta {
  /** Tile cannot be occupied or passed by movers. */
  solid: boolean;
  /** Destroyed by an explosion blast. */
  destructible: boolean;
  /** Movers can pass through in this direction (one-way walls). */
  oneWayDir?: Direction;
  /** Direction the one-way wall blocks (for logic checks). */
  blockedDir?: Direction;
}

const WALL = "WALL";
const BASE = "BASE";

/** Everything that is not a solid, passable obstacle. */
const PASSABLE: TileMeta = { solid: false, destructible: false };

const TILE_META: Record<TileKind, TileMeta> = {
  [TileKind.EMPTY]: PASSABLE,
  [TileKind.WALL]: { solid: true, destructible: false },
  [TileKind.DESTRUCTIBLE_WALL]: { solid: true, destructible: true },
  [TileKind.MURPHY]: PASSABLE,
  [TileKind.INFOTRON]: PASSABLE,
  [TileKind.ZONK]: PASSABLE,
  [TileKind.SNIK_SNAK]: PASSABLE,
  [TileKind.BASE]: PASSABLE,
  [TileKind.TERMINAL]: PASSABLE,
  [TileKind.ELECTRON]: PASSABLE,
  [TileKind.EXPLOSION_GENERATOR]: { solid: true, destructible: false },
  [TileKind.PORTAL]: PASSABLE,
  [TileKind.ONE_WAY_UP]: { solid: false, destructible: false, oneWayDir: "UP", blockedDir: "DOWN" },
  [TileKind.ONE_WAY_DOWN]: { solid: false, destructible: false, oneWayDir: "DOWN", blockedDir: "UP" },
  [TileKind.ONE_WAY_LEFT]: { solid: false, destructible: false, oneWayDir: "LEFT", blockedDir: "RIGHT" },
  [TileKind.ONE_WAY_RIGHT]: { solid: false, destructible: false, oneWayDir: "RIGHT", blockedDir: "LEFT" },
};

/** Tiles that are solid to movers, including one-way walls approached from the blocked side. */
export function isSolidTile(tile: TileKind, fromDir?: Direction): boolean {
  const meta = TILE_META[tile];
  if (meta.solid) return true;
  if (meta.oneWayDir !== undefined && fromDir !== undefined) {
    // One-way: passable only when moving in `oneWayDir`.
    return fromDir !== meta.oneWayDir;
  }
  return false;
}

/** Whether a blast can pass through / destroy this tile. */
export function isDestructible(tile: TileKind): boolean {
  return TILE_META[tile].destructible;
}

/** Whether a mover can enter this cell given the direction it is coming from. */
export function isPassableTile(tile: TileKind, fromDir: Direction): boolean {
  return !isSolidTile(tile, fromDir);
}

export function isOneWay(tile: TileKind): boolean {
  return TILE_META[tile].oneWayDir !== undefined;
}

export { TILE_META, WALL, BASE };
