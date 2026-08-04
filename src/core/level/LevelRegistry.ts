import type { LevelData } from "../types";
import { parseLevel } from "./LevelLoader";
import { validateLevel } from "./LevelValidator";

/** Parse and validate a level in one step. Throws descriptive errors. */
export function loadLevel(name: string, source: string): LevelData {
  const data = parseLevel(name, source);
  validateLevel(data, name);
  return data;
}
