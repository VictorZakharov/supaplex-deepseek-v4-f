import type { Direction, Direction8, Vec2 } from "./types";

/** Delta for a single cell move in an orthogonal direction. */
export function directionDelta(dir: Direction): Vec2 {
  switch (dir) {
    case "UP":
      return { x: 0, y: -1 };
    case "DOWN":
      return { x: 0, y: 1 };
    case "LEFT":
      return { x: -1, y: 0 };
    case "RIGHT":
      return { x: 1, y: 0 };
  }
}

/** Delta for an 8-direction move (diagonals included). */
export function direction8Delta(dir: Direction8): Vec2 {
  switch (dir) {
    case "UP":
      return { x: 0, y: -1 };
    case "DOWN":
      return { x: 0, y: 1 };
    case "LEFT":
      return { x: -1, y: 0 };
    case "RIGHT":
      return { x: 1, y: 0 };
    case "UP_LEFT":
      return { x: -1, y: -1 };
    case "UP_RIGHT":
      return { x: 1, y: -1 };
    case "DOWN_LEFT":
      return { x: -1, y: 1 };
    case "DOWN_RIGHT":
      return { x: 1, y: 1 };
  }
}

/** Direction8 with a zero y component, or null for pure-diagonal inputs. */
export function verticalComponent(d8: Direction8): Direction | null {
  if (d8 === "UP" || d8 === "UP_LEFT" || d8 === "UP_RIGHT") return "UP";
  if (d8 === "DOWN" || d8 === "DOWN_LEFT" || d8 === "DOWN_RIGHT") return "DOWN";
  return null;
}

/** Direction8 with a zero x component, or null for pure-vertical inputs. */
export function horizontalComponent(d8: Direction8): Direction | null {
  if (d8 === "LEFT" || d8 === "UP_LEFT" || d8 === "DOWN_LEFT") return "LEFT";
  if (d8 === "RIGHT" || d8 === "UP_RIGHT" || d8 === "DOWN_RIGHT") return "RIGHT";
  return null;
}

/** The cardinal direction a vector primarily points along. */
export function dominantDirection(vec: Vec2): Direction {
  const ax = Math.abs(vec.x);
  const ay = Math.abs(vec.y);
  if (ax > ay) return vec.x >= 0 ? "RIGHT" : "LEFT";
  return vec.y >= 0 ? "DOWN" : "UP";
}

export const ALL_DIRECTIONS: readonly Direction[] = ["UP", "DOWN", "LEFT", "RIGHT"];

export const ALL_DIRECTIONS8: readonly Direction8[] = [
  "UP",
  "DOWN",
  "LEFT",
  "RIGHT",
  "UP_LEFT",
  "UP_RIGHT",
  "DOWN_LEFT",
  "DOWN_RIGHT",
];

/** The opposite cardinal direction. */
export function opposite(dir: Direction): Direction {
  switch (dir) {
    case "UP":
      return "DOWN";
    case "DOWN":
      return "UP";
    case "LEFT":
      return "RIGHT";
    case "RIGHT":
      return "LEFT";
  }
}

/** The cardinal direction an 8-direction movement is headed in (for one-way checks). */
export function fromDir8(d8: Direction8): Direction {
  switch (d8) {
    case "UP":
    case "UP_LEFT":
    case "UP_RIGHT":
      return "UP";
    case "DOWN":
    case "DOWN_LEFT":
    case "DOWN_RIGHT":
      return "DOWN";
    case "LEFT":
      return "LEFT";
    case "RIGHT":
      return "RIGHT";
  }
}

