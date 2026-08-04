/**
 * Procedural WebAudio sound effects. Small, dependency-free blips for
 * collect, deposit, death, explosion, and level-complete. All functions
 * are no-ops if AudioContext is unavailable.
 */
export class Sound {
  private readonly ctx: AudioContext | null;
  private enabled = true;

  constructor() {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    this.ctx = Ctor ? new Ctor() : null;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  collect(): void {
    this.blip(880, 0.08, "square", 0.08);
  }

  deposit(): void {
    this.blip(1320, 0.12, "square", 0.1);
  }

  death(): void {
    this.blip(220, 0.25, "sawtooth", 0.15);
  }

  explosion(): void {
    this.blip(60, 0.3, "sawtooth", 0.2);
  }

  levelComplete(): void {
    this.blip(660, 0.15, "square", 0.1);
    setTimeout(() => this.blip(880, 0.15, "square", 0.1), 120);
    setTimeout(() => this.blip(1320, 0.25, "square", 0.12), 240);
  }

  private blip(freq: number, duration: number, type: OscillatorType, gain: number): void {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  }
}
