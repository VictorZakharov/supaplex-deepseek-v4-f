import { TileKind } from "./types";
import type { EntityKind, Vec2 } from "./types";
import { TILE_FROM_ID, TILE_ID } from "./level/LevelLoader";
import type { LevelData } from "./types";

/**
 * The live game grid. Holds the mutable tile array plus a per-cell entity
 * slot for dynamic objects (movers and items). Each cell holds at most one
 * entity; collectibles are stored as tiles and "collected" when a mover
 * enters their cell.
 */
export class Grid {
  readonly width: number;
  readonly height: number;
  private readonly tiles: Uint8Array;
  /** Entity kind per cell, or null. */
  private readonly entity: (EntityKind | null)[];

  constructor(level: LevelData) {
    this.width = level.width;
    this.height = level.height;
    this.tiles = new Uint8Array(level.tiles);
    this.entity = new Array<EntityKind | null>(level.tiles.length).fill(null);

    // Promote static spawn tiles into entity slots and clear them from the tile layer.
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tileAt(x, y);
        if (tile === TileKind.MURPHY || tile === TileKind.ZONK || tile === TileKind.SNIK_SNAK) {
          this.setTile(x, y, TileKind.EMPTY);
          this.entity[y * this.width + x] = toEntityKind(tile);
        }
      }
    }
  }

  idx(x: number, y: number): number {
    return y * this.width + x;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  tileAt(x: number, y: number): TileKind {
    if (!this.inBounds(x, y)) return TileKind.WALL;
    return TILE_FROM_ID[this.tiles[this.idx(x, y)]!]!;
  }

  setTile(x: number, y: number, kind: TileKind): void {
    if (this.inBounds(x, y)) {
      this.tiles[this.idx(x, y)] = TILE_ID[kind];
    }
  }

  entityAt(x: number, y: number): EntityKind | null {
    if (!this.inBounds(x, y)) return null;
    return this.entity[this.idx(x, y)] ?? null;
  }

  /** Read-only view of the live tile buffer. */
  get tileBuffer(): Uint8Array {
    return this.tiles;
  }

  setEntity(x: number, y: number, kind: EntityKind | null): void {
    if (this.inBounds(x, y)) {
      this.entity[this.idx(x, y)] = kind;
    }
  }

  /** Move an entity from one cell to another (no validation). */
  moveEntity(fromX: number, fromY: number, toX: number, toY: number): void {
    const kind = this.entityAt(fromX, fromY);
    this.setEntity(fromX, fromY, null);
    this.setEntity(toX, toY, kind);
  }

  /** Count live entities of a kind. */
  countEntities(kind: EntityKind): number {
    let count = 0;
    for (const e of this.entity) {
      if (e === kind) count++;
    }
    return count;
  }

  /** Whether any entity of a kind exists. */
  hasEntity(kind: EntityKind): boolean {
    return this.entity.includes(kind);
  }

  /** First cell containing an entity kind, or null. */
  findEntity(kind: EntityKind): Vec2 | null {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.entityAt(x, y) === kind) return { x, y };
      }
    }
    return null;
  }
}

/** Map a spawn tile kind to its dynamic entity kind. */
function toEntityKind(tile: TileKind): EntityKind {
  switch (tile) {
    case TileKind.MURPHY:
      return "MURPHY";
    case TileKind.ZONK:
      return "ZONK";
    case TileKind.SNIK_SNAK:
      return "SNIK_SNAK";
    default:
      throw new Error(`Tile ${tile} is not a spawnable entity`);
  }
}
