import type { Direction } from "../types";

/**
 * Queue of direction intents. The engine drains the queue each tick; the
 * most recently pressed direction takes priority. Holding a key keeps a
 * single intent alive.
 */
export class InputState {
  private queue: Direction[] = [];

  /** Enqueue a direction (e.g. on keydown). Duplicates are not queued twice. */
  press(dir: Direction): void {
    if (this.queue.length > 0 && this.queue[this.queue.length - 1] === dir) return;
    this.queue.push(dir);
  }

  /** Remove a direction from the queue (e.g. on keyup). */
  release(dir: Direction): void {
    const idx = this.queue.indexOf(dir);
    if (idx >= 0) this.queue.splice(idx, 1);
  }

  /**
   * Pop the next intent (last-pressed wins). Returns null when the queue
   * is empty or the queue is dominated by releases.
   */
  poll(): Direction | null {
    if (this.queue.length === 0) return null;
    return this.queue[this.queue.length - 1]!;
  }

  clear(): void {
    this.queue.length = 0;
  }

  get size(): number {
    return this.queue.length;
  }
}
