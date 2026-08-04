import type { InputState } from "../../core/input/InputState";
import type { Direction } from "../../core/types";

const KEY_TO_DIR: Record<string, Direction> = {
  ArrowUp: "UP",
  ArrowDown: "DOWN",
  ArrowLeft: "LEFT",
  ArrowRight: "RIGHT",
  w: "UP",
  s: "DOWN",
  a: "LEFT",
  d: "RIGHT",
  W: "UP",
  S: "DOWN",
  A: "LEFT",
  D: "RIGHT",
};

/**
 * Bridges DOM keyboard events into the engine's InputState. Arrow keys and
 * WASD move Murphy. Ignores key repeat so holding a key yields steady motion.
 */
export class KeyboardInput {
  private readonly target: EventTarget;
  private readonly state: InputState;
  private readonly onKeyDown: (e: Event) => void;
  private readonly onKeyUp: (e: Event) => void;

  constructor(state: InputState, target: EventTarget = window) {
    this.state = state;
    this.target = target;
    this.onKeyDown = (e) => this.handleKeyDown(e as KeyboardEvent);
    this.onKeyUp = (e) => this.handleKeyUp(e as KeyboardEvent);
  }

  attach(): void {
    this.target.addEventListener("keydown", this.onKeyDown);
    this.target.addEventListener("keyup", this.onKeyUp);
  }

  detach(): void {
    this.target.removeEventListener("keydown", this.onKeyDown);
    this.target.removeEventListener("keyup", this.onKeyUp);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const dir = KEY_TO_DIR[e.key];
    if (dir && !e.repeat) {
      this.state.press(dir);
      e.preventDefault();
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const dir = KEY_TO_DIR[e.key];
    if (dir) {
      this.state.release(dir);
      e.preventDefault();
    }
  }
}
