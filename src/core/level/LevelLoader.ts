import { TileKind } from "../types";
import type { LevelData, Vec2 } from "../types";

/**
 * Character legend for level maps. Rows must all be the same length.
 * Lines starting with `//` are comments. Lines are trimmed of
 * surrounding whitespace; interior spaces are not allowed.
 */
const CHAR_TO_TILE: Record<string, TileKind> = {
  ".": TileKind.EMPTY,
  "#": TileKind.WALL,
  "~": TileKind.DESTRUCTIBLE_WALL,
  "M": TileKind.MURPHY,
  "I": TileKind.INFOTRON,
  "Z": TileKind.ZONK,
  "S": TileKind.SNIK_SNAK,
  "B": TileKind.BASE,
  "T": TileKind.TERMINAL,
  "E": TileKind.ELECTRON,
  "X": TileKind.EXPLOSION_GENERATOR,
  "O": TileKind.PORTAL,
  "^": TileKind.ONE_WAY_UP,
  "v": TileKind.ONE_WAY_DOWN,
  "<": TileKind.ONE_WAY_LEFT,
  ">": TileKind.ONE_WAY_RIGHT,
};

/** Parse a text level map into a LevelData. Throws descriptive errors. */
export function parseLevel(name: string, source: string): LevelData {
  const rows = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("//"));

  if (rows.length === 0) {
    throw new Error(`Level "${name}" is empty`);
  }

  const width = rows[0]!.length;
  if (rows.some((row) => row.length !== width)) {
    throw new Error(`Level "${name}": all rows must have the same width (${width})`);
  }
  if (width === 0) {
    throw new Error(`Level "${name}": empty rows`);
  }

  const tiles = new Uint8Array(width * rows.length);
  let murphySpawn: Vec2 | null = null;
  let infotronCount = 0;
  const portalPositions: Vec2[] = [];

  for (let y = 0; y < rows.length; y++) {
    const row = rows[y]!;
    for (let x = 0; x < width; x++) {
      const ch = row[x]!;
      const tile = CHAR_TO_TILE[ch];
      if (tile === undefined) {
        throw new Error(`Level "${name}" at (${x},${y}): unknown tile character '${ch}'`);
      }
      tiles[y * width + x] = TILE_ID[tile];
      if (tile === TileKind.MURPHY) murphySpawn = { x, y };
      if (tile === TileKind.INFOTRON) infotronCount++;
      if (tile === TileKind.PORTAL) portalPositions.push({ x, y });
    }
  }

  if (murphySpawn === null) {
    throw new Error(`Level "${name}": missing Murphy (M)`);
  }
  if (infotronCount === 0) {
    throw new Error(`Level "${name}": must contain at least one Infotron (I)`);
  }
  if (portalPositions.length % 2 !== 0) {
    throw new Error(`Level "${name}": portals must come in pairs`);
  }

  const portalPairs: Array<[Vec2, Vec2]> = [];
  for (let i = 0; i < portalPositions.length; i += 2) {
    portalPairs.push([portalPositions[i]!, portalPositions[i + 1]!]);
  }

  return {
    width,
    height: rows.length,
    tiles,
    murphySpawn,
    infotronCount,
    portalPairs,
  };
}

/** Numeric ids for tiles, used in the Uint8Array. */
export const TILE_ID: Record<TileKind, number> = Object.fromEntries(
  Object.values(TileKind).map((kind, i) => [kind, i]),
) as Record<TileKind, number>;

export const TILE_FROM_ID: TileKind[] = Object.values(TileKind) as TileKind[];
