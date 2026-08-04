import { TileKind } from "../types";
import type { LevelData } from "../types";
import { TILE_FROM_ID } from "./LevelLoader";

/**
 * Structural validation for a parsed LevelData. Throws descriptive errors
 * for levels that cannot be played.
 */
export function validateLevel(level: LevelData, name: string): void {
  if (level.width <= 0 || level.height <= 0) {
    throw new Error(`Level "${name}": invalid dimensions`);
  }
  if (level.tiles.length !== level.width * level.height) {
    throw new Error(`Level "${name}": tile buffer size mismatch`);
  }

  let murphyCount = 0;
  let baseCount = 0;
  for (let i = 0; i < level.tiles.length; i++) {
    const tile = TILE_FROM_ID[level.tiles[i]!]!;
    if (tile === TileKind.MURPHY) murphyCount++;
    if (tile === TileKind.BASE) baseCount++;
  }

  if (murphyCount !== 1) {
    throw new Error(`Level "${name}": expected exactly one Murphy, found ${murphyCount}`);
  }
  if (baseCount !== 1) {
    throw new Error(`Level "${name}": expected exactly one Base (B), found ${baseCount}`);
  }
  if (level.infotronCount < 1) {
    throw new Error(`Level "${name}": must contain at least one Infotron (I)`);
  }
}
