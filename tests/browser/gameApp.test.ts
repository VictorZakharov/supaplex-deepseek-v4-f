import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameApp } from "../../src/app/GameApp";

/**
 * Boot test: exercises the full DOM wiring that unit tests never touch.
 * This catches runtime-only bugs like field-initializer ordering
 * (the Hud reading `root` before the constructor assigned it).
 */

// jsdom lacks these; stub them so Sound / renderer resize don't throw.
function stubCanvasContext(): void {
  const ctx = {
    fillStyle: "",
    fillRect: () => {},
    clearRect: () => {},
    setTransform: () => {},
    drawImage: () => {},
    imageSmoothingEnabled: false,
  };
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ctx) as never;
}

let pendingTimers: number[] = [];

beforeEach(() => {
  pendingTimers = [];
  stubCanvasContext();
  if (!("AudioContext" in window)) {
    vi.stubGlobal("AudioContext", class {});
  }
  // requestAnimationFrame is not driven in tests; stub it with a tracked timer
  // that we cancel in afterEach so no callback fires after teardown.
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    const id = window.setTimeout(() => cb(performance.now()), 16);
    pendingTimers.push(id);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    window.clearTimeout(id);
    pendingTimers = pendingTimers.filter((t) => t !== id);
  });
});

afterEach(() => {
  for (const id of pendingTimers) window.clearTimeout(id);
  pendingTimers = [];
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

function mount(): { app: GameApp; root: HTMLElement } {
  const root = document.createElement("div");
  root.id = "app";
  root.style.width = "800px";
  root.style.height = "600px";
  document.body.appendChild(root);
  const app = new GameApp(root);
  return { app, root };
}

describe("GameApp boot", () => {
  it("constructs without throwing and shows the menu", () => {
    const { root } = mount();
    // Menu overlay should exist and be visible.
    const overlay = root.querySelector<HTMLElement>("#overlay");
    expect(overlay).not.toBeNull();
    expect(overlay!.style.display).not.toBe("none");
    expect(root.querySelector("#btn-play")).not.toBeNull();
  });

  it("starts a level and renders the canvas", () => {
    const { app, root } = mount();
    expect(() => app.startLevel(0)).not.toThrow();
    const canvas = root.querySelector<HTMLCanvasElement>("#game-canvas");
    expect(canvas).not.toBeNull();
    // jsdom has no layout, so clientWidth is 0; just assert the canvas is mounted.
    expect(canvas!.parentElement).toBe(root);
  });

  it("navigates through screens without throwing", () => {
    const { app } = mount();
    expect(() => {
      app.showLevelSelect();
      app.startLevel(0);
      app.togglePause();
      app.togglePause();
      app.backToMenu();
    }).not.toThrow();
  });
});
