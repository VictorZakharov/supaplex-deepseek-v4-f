/** Fixed-timestep game loop driven by requestAnimationFrame. */
export class GameLoop {
  private rafId: number | null = null;
  private lastTime = 0;
  private accumulator = 0;
  private running = false;

  constructor(
    private readonly tickMs: number,
    private readonly step: () => void,
    private readonly render: () => void,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  private readonly frame = (now: number): void => {
    if (!this.running) return;
    const dt = Math.min(now - this.lastTime, 250); // clamp big jumps (tab switch)
    this.lastTime = now;
    this.accumulator += dt;
    while (this.accumulator >= this.tickMs) {
      this.step();
      this.accumulator -= this.tickMs;
    }
    this.render();
    this.rafId = requestAnimationFrame(this.frame);
  };
}
