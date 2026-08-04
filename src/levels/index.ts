import type { LevelData } from "../core/types";
import { loadLevel } from "../core/level/LevelRegistry";

interface LevelSource {
  name: string;
  source: string;
}

const LEVEL_SOURCES: readonly LevelSource[] = [
  {
    name: "First Steps",
    source: `// Level 1 - First Steps
##########
#........#
#..I..I..#
#........#
#..M...B.#
#........#
#..I..I..#
#........#
##########`,
  },
  {
    name: "Terminal",
    source: `// Level 2 - Terminal
##############
#....E.......#
#...T........#
#.......I....#
#..M.......B.#
#....I.......#
#...........I#
##############`,
  },
  {
    name: "One Way",
    source: `// Level 3 - One Way
####################
#....^..........I..#
#....^.............#
#...<^>............#
#....^.............#
#....^.............#
#...M..........B...#
#....^.............#
#....^.............#
####################`,
  },
  {
    name: "Zonk",
    source: `// Level 4 - Zonk
########################
#........Z.............#
#......................#
#..........I...........#
#....M...............B.#
#..........I...........#
#......................#
#........Z.............#
########################`,
  },
  {
    name: "Snik Snak",
    source: `// Level 5 - Snik Snak
#########################
#..........S............#
#......................I#
#........I..............#
#....M.................B#
#........I..............#
#......................I#
#..........S............#
#########################`,
  },
  {
    name: "Portals",
    source: `// Level 6 - Portals
####################
#..O...........O...#
#.................I#
#..................#
#....I.............#
#..M..............B#
#..................#
#..................#
####################`,
  },
  {
    name: "Explosion",
    source: `// Level 7 - Explosion
####################
#..X..............I#
#....~.............#
#.....~............#
#......~...........#
#..M..............B#
#...I..............#
#..................#
####################`,
  },
  {
    name: "Gauntlet",
    source: `// Level 8 - Gauntlet
######################################
#...S.........I..........Z..........B#
#.......~..................~.........#
#..O........I.........I......O.......#
#...M.........E.......T....Z.........#
#....~..................~..........I.#
######################################`,
  },
];

/** Load the level at the given index (0-based). Throws if out of range. */
export function getLevelData(index: number): LevelData {
  if (index < 0 || index >= LEVEL_SOURCES.length) {
    throw new Error(`Level index ${index} out of range (0..${LEVEL_SOURCES.length - 1})`);
  }
  const { name, source } = LEVEL_SOURCES[index]!;
  return loadLevel(name, source);
}

/** Total number of levels. */
export function getLevelCount(): number {
  return LEVEL_SOURCES.length;
}

/** Human-readable level name. */
export function getLevelName(index: number): string {
  return LEVEL_SOURCES[index]!.name;
}

