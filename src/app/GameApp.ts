import { GameEngine } from "../core/engine/GameEngine";
import { EventBus } from "../core/engine/events";
import { InputState } from "../core/input/InputState";
import { GameSession } from "../core/game/GameSession";
import { TICK_MS } from "../core/constants";
import { getLevelData, getLevelCount, getLevelName } from "../levels";
import type { GameEvent } from "../core/types";
import { GameLoop } from "./GameLoop";
import { KeyboardInput } from "./input/KeyboardInput";
import { Renderer } from "../render/Renderer";
import { Camera } from "../render/Camera";
import { Sound } from "./sound";
import { loadProgress, saveProgress } from "./persistence";

export type Screen =
  | { name: "menu" }
  | { name: "levelSelect" }
  | { name: "playing" }
  | { name: "paused" }
  | { name: "levelComplete" }
  | { name: "gameOver" };

const TILE_SIZE = 32;

/**
 * Top-level application: owns the engine, renderer, loop, HUD, and screen
 * state machine. Bridges engine events to score/lives/sound/progression.
 */
export class GameApp {
  private readonly root: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: Renderer;
  private readonly sound = new Sound();
  private readonly input = new InputState();
  private readonly keyboard: KeyboardInput;

  private bus = new EventBus();
  private engine: GameEngine | null = null;
  private session = new GameSession();
  private camera: Camera | null = null;
  private loop: GameLoop | null = null;
  private screen: Screen = { name: "menu" };
  private levelIndex = 0;
  private unlockedLevel = 1;
  private highScore = 0;
  private readonly hud: Hud;

  constructor(root: HTMLElement) {
    this.root = root;
    this.canvas = document.createElement("canvas");
    this.canvas.id = "game-canvas";
    root.appendChild(this.canvas);
    this.renderer = new Renderer(this.canvas, TILE_SIZE);
    this.keyboard = new KeyboardInput(this.input);
    this.keyboard.attach();
    // Create the HUD after `root` is set (field initializers run before the
    // constructor body, so a field-initialized Hud would see `root` undefined).
    this.hud = new Hud(this);
    this.hud.attach();

    const progress = loadProgress();
    this.unlockedLevel = progress.unlockedLevel;
    this.highScore = progress.highScore;
    this.hud.updateProgress(this.unlockedLevel, this.highScore);

    window.addEventListener("resize", () => this.fit());
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.togglePause();
    });
    this.showMenu();
  }

  /** Start a playthrough of the given level (0-based). */
  startLevel(levelIndex: number): void {
    this.levelIndex = levelIndex;
    this.session = new GameSession();
    this.engine = this.createEngine(levelIndex);
    this.camera = new Camera(this.engine.width, this.engine.height);
    this.screen = { name: "playing" };
    this.hud.show("playing");
    this.fit();
    this.startLoop();
  }

  togglePause(): void {
    if (this.screen.name === "playing") {
      this.screen = { name: "paused" };
      this.hud.show("paused");
    } else if (this.screen.name === "paused") {
      this.screen = { name: "playing" };
      this.hud.show("playing");
    }
  }

  backToMenu(): void {
    this.stopLoop();
    this.screen = { name: "menu" };
    this.hud.show("menu");
  }

  showLevelSelect(): void {
    this.stopLoop();
    this.screen = { name: "levelSelect" };
    this.hud.show("levelSelect");
  }

  restartLevel(): void {
    this.engine = this.createEngine(this.levelIndex);
    this.camera = new Camera(this.engine.width, this.engine.height);
    this.screen = { name: "playing" };
    this.hud.show("playing");
    this.startLoop();
  }

  private createEngine(levelIndex: number): GameEngine {
    this.bus = new EventBus();
    this.bus.on((e) => this.handleEvent(e));
    return new GameEngine(getLevelData(levelIndex), this.bus, this.input);
  }

  private handleEvent(event: GameEvent): void {
    switch (event.type) {
      case "score":
        this.session.addScore(event.amount);
        break;
      case "infotronCollected":
        this.session.addInfotron();
        this.sound.collect();
        break;
      case "electronDeposited":
        this.session.addElectron();
        this.sound.deposit();
        break;
      case "murphyDied":
        this.sound.death();
        this.handleMurphyDeath();
        break;
      case "baseOpened":
        break;
      case "levelComplete":
        this.sound.levelComplete();
        this.handleLevelComplete();
        break;
      default:
        break;
    }
    this.hud.updateHud(
      this.session.getScore(),
      this.session.getLives(),
      this.engine?.infotronsLeft ?? 0,
      this.engine?.electronsLeft ?? 0,
    );
  }

  private handleMurphyDeath(): void {
    const gameOver = this.session.loseLife();
    this.hud.updateHud(
      this.session.getScore(),
      this.session.getLives(),
      this.engine?.infotronsLeft ?? 0,
      this.engine?.electronsLeft ?? 0,
    );
    if (gameOver) {
      this.stopLoop();
      this.screen = { name: "gameOver" };
      this.hud.show("gameOver");
      this.commitHighScore();
    } else {
      this.restartLevel();
    }
  }

  private handleLevelComplete(): void {
    this.session.addLevelComplete();
    this.hud.updateHud(
      this.session.getScore(),
      this.session.getLives(),
      this.engine?.infotronsLeft ?? 0,
      this.engine?.electronsLeft ?? 0,
    );
    this.stopLoop();
    if (this.levelIndex + 1 < getLevelCount()) {
      this.unlockedLevel = Math.max(this.unlockedLevel, this.levelIndex + 2);
      saveProgress(this.unlockedLevel, this.highScore);
      this.screen = { name: "levelComplete" };
      this.hud.show("levelComplete");
    } else {
      this.screen = { name: "gameOver" }; // "You beat the game!" via gameOver screen variant
      this.hud.show("gameOver");
    }
    this.commitHighScore();
  }

  private commitHighScore(): void {
    const score = this.session.getScore();
    if (score > this.highScore) {
      this.highScore = score;
      saveProgress(this.unlockedLevel, this.highScore);
    }
    this.hud.updateProgress(this.unlockedLevel, this.highScore);
  }

  private startLoop(): void {
    this.stopLoop();
    this.loop = new GameLoop(TICK_MS, () => this.engine?.step(), () => this.draw());
    this.loop.start();
  }

  private stopLoop(): void {
    this.loop?.stop();
    this.loop = null;
  }

  private draw(): void {
    if (!this.engine || !this.camera) return;
    const state = this.engine.buildSnapshot();
    const viewTilesW = this.canvas.clientWidth / TILE_SIZE;
    const viewTilesH = this.canvas.clientHeight / TILE_SIZE;
    this.camera.centerOn(state.murphyPos.x, state.murphyPos.y, viewTilesW, viewTilesH);
    const origin = this.camera.origin;
    this.renderer.render(state, origin.x * TILE_SIZE, origin.y * TILE_SIZE);
  }

  private fit(): void {
    const width = this.root.clientWidth;
    const height = this.root.clientHeight;
    this.renderer.resize(width, height, Renderer.dpr());
  }

  private showMenu(): void {
    this.hud.show("menu");
  }
}

/**
 * Minimal DOM-based HUD + overlay screens. Renders status text, lives, and
 * the menu/select/pause/game-over overlays.
 */
class Hud {
  private el: HTMLElement;
  private overlay: HTMLElement;
  private hudBar: HTMLElement;
  private readonly app: GameApp;

  constructor(app: GameApp) {
    this.app = app;
    this.el = app["root"];
    this.hudBar = document.createElement("div");
    this.hudBar.id = "hud-bar";
    this.overlay = document.createElement("div");
    this.overlay.id = "overlay";
    this.el.append(this.hudBar, this.overlay);
  }

  attach(): void {}

  show(screen: string): void {
    this.overlay.innerHTML = "";
    switch (screen) {
      case "menu":
        this.overlay.innerHTML = menuHtml();
        this.overlay.querySelector("#btn-play")?.addEventListener("click", () => this.app.showLevelSelect());
        this.overlay.style.display = "";
        break;
      case "levelSelect":
        this.overlay.innerHTML = levelSelectHtml(this.app["unlockedLevel"], getLevelCount());
        this.overlay.querySelectorAll<HTMLButtonElement>(".level-btn").forEach((btn) => {
          btn.addEventListener("click", () => this.app.startLevel(Number(btn.dataset["level"])));
        });
        this.overlay.querySelector("#btn-menu")?.addEventListener("click", () => this.app.backToMenu());
        this.overlay.style.display = "";
        break;
      case "playing":
        this.overlay.style.display = "none";
        break;
      case "paused":
        this.overlay.innerHTML = pausedHtml();
        this.overlay.querySelector("#btn-resume")?.addEventListener("click", () => this.app.togglePause());
        this.overlay.querySelector("#btn-restart")?.addEventListener("click", () => this.app.restartLevel());
        this.overlay.querySelector("#btn-menu")?.addEventListener("click", () => this.app.backToMenu());
        this.overlay.style.display = "";
        break;
      case "levelComplete":
        this.overlay.innerHTML = levelCompleteHtml(getLevelName(this.app["levelIndex"]));
        this.overlay.querySelector("#btn-next")?.addEventListener("click", () => {
          this.app.startLevel(this.app["levelIndex"] + 1);
        });
        this.overlay.querySelector("#btn-menu")?.addEventListener("click", () => this.app.backToMenu());
        this.overlay.style.display = "";
        break;
      case "gameOver":
        this.overlay.innerHTML = gameOverHtml(this.app["session"].getScore());
        this.overlay.querySelector("#btn-restart")?.addEventListener("click", () => this.app.restartLevel());
        this.overlay.querySelector("#btn-menu")?.addEventListener("click", () => this.app.backToMenu());
        this.overlay.style.display = "";
        break;
      default:
        this.overlay.style.display = "none";
    }
    this.hudBar.style.display = screen === "playing" || screen === "paused" ? "flex" : "none";
  }

  updateHud(score: number, lives: number, infotrons: number, electrons: number): void {
    this.hudBar.innerHTML = `Score: ${score}  Lives: ${lives}  Infotrons: ${infotrons}  Electrons: ${electrons}`;
  }

  updateProgress(unlocked: number, highScore: number): void {
    this.el.dataset["unlocked"] = String(unlocked);
    this.el.dataset["highScore"] = String(highScore);
  }
}

function menuHtml(): string {
  return `<div class="overlay-inner">
    <h1>SUPAPLEX</h1>
    <p>Collect all Infotrons, then reach the Base!</p>
    <button id="btn-play">Play</button>
    <p class="hint">Arrows/WASD move &bull; Esc pause</p>
  </div>`;
}

function levelSelectHtml(unlocked: number, count: number): string {
  const buttons: string[] = [];
  for (let i = 0; i < count; i++) {
    const locked = i + 1 > unlocked;
    buttons.push(
      `<button class="level-btn" data-level="${i}" ${locked ? "disabled" : ""}>${i + 1}. ${getLevelName(i)}${locked ? " 🔒" : ""}</button>`,
    );
  }
  return `<div class="overlay-inner">
    <h2>Select Level</h2>
    <div class="level-grid">${buttons.join("")}</div>
    <button id="btn-menu">Menu</button>
  </div>`;
}

function pausedHtml(): string {
  return `<div class="overlay-inner">
    <h2>Paused</h2>
    <button id="btn-resume">Resume</button>
    <button id="btn-restart">Restart</button>
    <button id="btn-menu">Menu</button>
  </div>`;
}

function levelCompleteHtml(name: string): string {
  return `<div class="overlay-inner">
    <h2>Level Complete!</h2>
    <p>${name}</p>
    <button id="btn-next">Next Level</button>
    <button id="btn-menu">Menu</button>
  </div>`;
}

function gameOverHtml(score: number): string {
  return `<div class="overlay-inner">
    <h2>Game Over</h2>
    <p>Final score: ${score}</p>
    <button id="btn-restart">Restart</button>
    <button id="btn-menu">Menu</button>
  </div>`;
}
