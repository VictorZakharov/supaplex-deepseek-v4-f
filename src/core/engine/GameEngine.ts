import { Grid } from "../grid";
import type { EventBus } from "./events";
import type { InputState } from "../input/InputState";
import {
  GENERATOR_PULSE_TICKS,
  MURPHY_STEP_TICKS,
  SNIK_SNAK_STEP_TICKS,
  ZONK_STEP_TICKS,
} from "../constants";
import { TileKind } from "../types";
import { EntityKind } from "../types";
import type { Direction, Direction8, LevelData, LevelState, Vec2 } from "../types";
import {
  directionDelta,
  direction8Delta,
  ALL_DIRECTIONS8,
  opposite,
  fromDir8,
} from "../direction";
import { isPassableTile, isDestructible, isSolidTile } from "../tiles/tiles";
import { TILE_ID } from "../level/LevelLoader";

const MURPHY_ENTITY = EntityKind.MURPHY;

/** Runtime state for a Zonk or Snik Snak. */
interface Mover {
  kind: "ZONK" | "SNIK_SNAK";
  x: number;
  y: number;
  /** Horizontal travel direction for Zonks. */
  dir: Direction;
  /** While set, Zonk is in a vertical fall/bounce phase. */
  fallDir: Direction | null;
}

interface GeneratorState {
  x: number;
  y: number;
  /** Current blast reach in each cardinal direction (cells). */
  reach: Record<Direction, number>;
  pulseTick: number;
}

/** Burning explosion cell keyed by cell key -> expiry tick. */
type ExplosionMap = Map<number, number>;

const EXPLOSION_LIFETIME_TICKS = 15;

/**
 * The deterministic game engine. Pure: no DOM, no timers, no randomness.
 * Drive it with {@link step} at a fixed rate and observe results via the
 * event bus and {@link buildSnapshot}.
 */
export class GameEngine {
  readonly width: number;
  readonly height: number;
  private readonly grid: Grid;
  private readonly bus: EventBus;
  private readonly input: InputState;

  private movers: Mover[] = [];
  private generators: GeneratorState[] = [];
  private explosions: ExplosionMap = new Map();

  private murphyX: number;
  private murphyY: number;
  private murphyCarrying = false;
  private murphyDead = false;
  private infotronsRemaining: number;
  private electronsRemaining: number;
  private baseOpen = false;
  private levelComplete = false;
  private readonly portalPairs: Array<[Vec2, Vec2]>;
  private tickCount = 0;

  constructor(level: LevelData, bus: EventBus, input: InputState) {
    this.width = level.width;
    this.height = level.height;
    this.grid = new Grid(level);
    this.bus = bus;
    this.input = input;
    this.infotronsRemaining = level.infotronCount;
    this.electronsRemaining = countTiles(level, TileKind.ELECTRON);
    this.portalPairs = level.portalPairs;
    this.murphyX = level.murphySpawn.x;
    this.murphyY = level.murphySpawn.y;
    this.grid.setEntity(this.murphyX, this.murphyY, MURPHY_ENTITY);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const kind = this.grid.entityAt(x, y);
        if (kind === EntityKind.ZONK) {
          this.movers.push({ kind, x, y, dir: "RIGHT", fallDir: null });
        } else if (kind === EntityKind.SNIK_SNAK) {
          this.movers.push({ kind, x, y, dir: "UP", fallDir: null });
        }
      }
    }

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid.tileAt(x, y) === TileKind.EXPLOSION_GENERATOR) {
          this.generators.push({
            x,
            y,
            reach: { UP: 0, DOWN: 0, LEFT: 0, RIGHT: 0 },
            pulseTick: 0,
          });
        }
      }
    }
  }

  get tick(): number {
    return this.tickCount;
  }
  get murphyPosition(): Vec2 {
    return { x: this.murphyX, y: this.murphyY };
  }
  get murphyAlive(): boolean {
    return !this.murphyDead;
  }
  get infotronsLeft(): number {
    return this.infotronsRemaining;
  }
  get electronsLeft(): number {
    return this.electronsRemaining;
  }
  get isBaseOpen(): boolean {
    return this.baseOpen;
  }
  get murphyCarriesElectron(): boolean {
    return this.murphyCarrying;
  }
  get isLevelComplete(): boolean {
    return this.levelComplete;
  }

  /** Advance the simulation by one fixed tick. */
  step(): void {
    if (this.levelComplete) return;
    this.tickCount++;

    if (this.murphyAlive && this.tickCount % MURPHY_STEP_TICKS === 0) {
      const dir = this.input.poll();
      if (dir) this.tryMoveMurphy(dir);
    }

    if (this.tickCount % ZONK_STEP_TICKS === 0) {
      for (const mover of this.movers) {
        if (mover.kind === EntityKind.ZONK) this.stepZonk(mover);
      }
    }

    if (this.tickCount % SNIK_SNAK_STEP_TICKS === 0) {
      for (const mover of this.movers) {
        if (mover.kind === EntityKind.SNIK_SNAK) this.stepSnikSnak(mover);
      }
    }

    this.stepExplosions();

    // Death check after movement.
    if (this.murphyAlive) {
      const here = this.grid.entityAt(this.murphyX, this.murphyY);
      if (
        here === EntityKind.ZONK ||
        here === EntityKind.SNIK_SNAK ||
        this.explosions.has(cellKey(this.murphyX, this.murphyY))
      ) {
        this.killMurphy();
      }
    }
  }

  private tryMoveMurphy(dir: Direction): void {
    const d = directionDelta(dir);
    const nx = this.murphyX + d.x;
    const ny = this.murphyY + d.y;
    if (!this.grid.inBounds(nx, ny)) return;

    const tile = this.grid.tileAt(nx, ny);
    if (!isPassableTile(tile, dir)) return;

    const occupant = this.grid.entityAt(nx, ny);
    if (occupant === EntityKind.ZONK || occupant === EntityKind.SNIK_SNAK) {
      this.killMurphy();
      return;
    }
    if (occupant === MURPHY_ENTITY || occupant === EntityKind.EXPLOSION) return;

    // Commit the move.
    this.grid.setEntity(this.murphyX, this.murphyY, null);
    this.murphyX = nx;
    this.murphyY = ny;
    this.grid.setEntity(nx, ny, MURPHY_ENTITY);

    this.handleCellContents(nx, ny, tile);

    // Teleport through portals, preserving travel direction.
    if (tile === TileKind.PORTAL) {
      const target = this.portalExit(nx, ny);
      if (target) {
        const tx = target.x + d.x;
        const ty = target.y + d.y;
        if (this.grid.inBounds(tx, ty) && isPassableTile(this.grid.tileAt(tx, ty), dir)) {
          this.grid.setEntity(nx, ny, null);
          this.murphyX = tx;
          this.murphyY = ty;
          this.grid.setEntity(tx, ty, MURPHY_ENTITY);
          this.handleCellContents(tx, ty, this.grid.tileAt(tx, ty));
        }
      }
    }

    if (tile === TileKind.BASE && this.baseOpen) {
      this.levelComplete = true;
      this.bus.emit({ type: "levelComplete", score: 0, levelIndex: 0 });
    }
  }

  /** Handle collecting items and depositing electrons on a cell the player occupies. */
  private handleCellContents(x: number, y: number, tile: TileKind): void {
    if (tile === TileKind.INFOTRON) {
      this.grid.setTile(x, y, TileKind.EMPTY);
      this.infotronsRemaining--;
      this.bus.emit({ type: "infotronCollected", remaining: this.infotronsRemaining });
      if (this.infotronsRemaining === 0 && !this.baseOpen) {
        this.baseOpen = true;
        this.bus.emit({ type: "baseOpened" });
      }
    } else if (tile === TileKind.ELECTRON) {
      this.grid.setTile(x, y, TileKind.EMPTY);
      this.electronsRemaining--;
      this.murphyCarrying = true;
    } else if (tile === TileKind.TERMINAL && this.murphyCarrying) {
      this.murphyCarrying = false;
      this.bus.emit({ type: "electronDeposited", remaining: this.electronsRemaining });
    }
  }

  private portalExit(x: number, y: number): Vec2 | null {
    for (const [a, b] of this.portalPairs) {
      if (a.x === x && a.y === y) return b;
      if (b.x === x && b.y === y) return a;
    }
    return null;
  }

  private killMurphy(): void {
    if (this.murphyDead) return;
    this.murphyDead = true;
    this.grid.setEntity(this.murphyX, this.murphyY, null);
    this.bus.emit({ type: "murphyDied" });
  }

  // ---- Zonk physics ----

  private stepZonk(m: Mover): void {
    if (this.grid.entityAt(m.x, m.y) !== EntityKind.ZONK) return;

    // Fall: if the cell below is free (not solid, no blocking entity), fall one cell.
    if (this.canZonkEnter(m.x, m.y + 1, "DOWN")) {
      m.fallDir = "DOWN";
      this.grid.moveEntity(m.x, m.y, m.x, m.y + 1);
      m.y += 1;
      return;
    }

    // On the ground: if we were falling, flip to horizontal bounce.
    if (m.fallDir !== null) {
      m.fallDir = null;
      if (m.dir === null) m.dir = "RIGHT";
      return;
    }

    // Horizontal travel.
    const d = directionDelta(m.dir);
    const nx = m.x + d.x;
    const ny = m.y + d.y;
    if (this.canZonkEnter(nx, ny, m.dir)) {
      this.grid.moveEntity(m.x, m.y, nx, ny);
      m.x = nx;
      m.y = ny;
      // Rolled off the edge: start falling next tick.
    } else {
      m.dir = opposite(m.dir);
    }
  }

  /** Zonk can enter a cell if it's in bounds, passable, and free of blockers. */
  private canZonkEnter(x: number, y: number, dir: Direction): boolean {
    if (!this.grid.inBounds(x, y)) return false;
    if (isSolidTile(this.grid.tileAt(x, y), dir)) return false;
    const occupant = this.grid.entityAt(x, y);
    return occupant === null || occupant === EntityKind.ZONK;
  }

  // ---- Snik Snak AI ----

  private stepSnikSnak(m: Mover): void {
    if (this.grid.entityAt(m.x, m.y) !== EntityKind.SNIK_SNAK) return;
    if (this.murphyDead) return;

    // Greedy pursuit of Murphy on the 8-direction lattice, wall-avoiding.
    let best: Direction8 | null = null;
    let bestDist = Number.POSITIVE_INFINITY;

    for (const d8 of ALL_DIRECTIONS8) {
      const d = direction8Delta(d8);
      const nx = m.x + d.x;
      const ny = m.y + d.y;
      if (!this.grid.inBounds(nx, ny)) continue;
      if (isSolidTile(this.grid.tileAt(nx, ny), fromDir8(d8))) continue;
      const occupant = this.grid.entityAt(nx, ny);
      // Murphy's cell is a valid target; other movers and explosions block.
      if (
        occupant !== null &&
        occupant !== EntityKind.ZONK &&
        occupant !== EntityKind.SNIK_SNAK &&
        occupant !== MURPHY_ENTITY
      ) {
        continue;
      }
      const dist = Math.abs(nx - this.murphyX) + Math.abs(ny - this.murphyY);
      if (dist < bestDist) {
        bestDist = dist;
        best = d8;
      }
    }

    if (best === null) return;
    const d = direction8Delta(best);
    const nx = m.x + d.x;
    const ny = m.y + d.y;
    const occupant = this.grid.entityAt(nx, ny);
    if (occupant === MURPHY_ENTITY) {
      this.killMurphy();
      return;
    }
    if (occupant === EntityKind.ZONK || occupant === EntityKind.SNIK_SNAK) return;
    this.grid.moveEntity(m.x, m.y, nx, ny);
    m.x = nx;
    m.y = ny;
    if (nx === this.murphyX && ny === this.murphyY && !this.murphyDead) {
      this.killMurphy();
    }
  }

  // ---- Explosions ----

  private stepExplosions(): void {
    for (const gen of this.generators) {
      gen.pulseTick++;
      if (gen.pulseTick % GENERATOR_PULSE_TICKS === 0) {
        this.advanceReach(gen, "UP");
        this.advanceReach(gen, "DOWN");
        this.advanceReach(gen, "LEFT");
        this.advanceReach(gen, "RIGHT");
      }
    }

    for (const key of this.explosions.keys()) {
      const { x, y } = unkey(key);
      const expiry = this.explosions.get(key)!;
      if (expiry <= this.tickCount) {
        this.explosions.delete(key);
        continue;
      }
      const tile = this.grid.tileAt(x, y);
      if (isDestructible(tile)) this.grid.setTile(x, y, TileKind.EMPTY);
      const ent = this.grid.entityAt(x, y);
      if (
        ent === EntityKind.ZONK ||
        ent === EntityKind.SNIK_SNAK ||
        ent === EntityKind.INFOTRON ||
        ent === EntityKind.ELECTRON
      ) {
        this.grid.setEntity(x, y, null);
      }
    }
  }

  private advanceReach(gen: GeneratorState, dir: Direction): void {
    const next = gen.reach[dir] + 1;
    const d = directionDelta(dir);
    const x = gen.x + d.x * next;
    const y = gen.y + d.y * next;
    if (!this.grid.inBounds(x, y)) return;
    const tile = this.grid.tileAt(x, y);
    // Solid, non-destructible tiles block the blast; everything else burns.
    if (isSolidTile(tile, dir) && !isDestructible(tile)) return;
    gen.reach[dir] = next;
    this.explosions.set(cellKey(x, y), this.tickCount + EXPLOSION_LIFETIME_TICKS);
  }

  // ---- Snapshot ----

  /** Build a renderer-friendly snapshot of the current state. */
  buildSnapshot(): LevelState {
    const zonkPositions: Vec2[] = [];
    const snikSnakPositions: Vec2[] = [];
    for (const m of this.movers) {
      if (m.kind === EntityKind.ZONK) zonkPositions.push({ x: m.x, y: m.y });
      else snikSnakPositions.push({ x: m.x, y: m.y });
    }
    const explosionPositions: Vec2[] = [];
    for (const key of this.explosions.keys()) {
      explosionPositions.push(unkey(key));
    }
    return {
      tiles: this.grid.tileBuffer.slice(),
      width: this.width,
      height: this.height,
      murphyPos: { x: this.murphyX, y: this.murphyY },
      murphyVisible: !this.murphyDead,
      zonkPositions,
      snikSnakPositions,
      explosionPositions,
      infotronCount: this.infotronsRemaining,
      terminalFilled: !this.murphyCarrying,
      baseOpen: this.baseOpen,
      tick: this.tickCount,
    };
  }
}

function cellKey(x: number, y: number): number {
  return y * 100000 + x;
}

function unkey(key: number): Vec2 {
  return { x: key % 100000, y: Math.floor(key / 100000) };
}

function countTiles(level: LevelData, kind: TileKind): number {
  const id = TILE_ID[kind];
  let count = 0;
  for (let i = 0; i < level.tiles.length; i++) {
    if (level.tiles[i] === id) count++;
  }
  return count;
}
