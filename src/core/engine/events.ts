import type { GameEvent } from "../types";

/** Minimal typed event bus for engine → app communication. */
export class EventBus {
  private listeners = new Set<(event: GameEvent) => void>();

  on(listener: (event: GameEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: GameEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
