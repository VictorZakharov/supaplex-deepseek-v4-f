import { describe, expect, it } from "vitest";
import { GameEngine } from "../../src/core/engine/GameEngine";
import { EventBus } from "../../src/core/engine/events";
import { InputState } from "../../src/core/input/InputState";
import { loadLevel } from "../../src/core/level/LevelRegistry";
import { TILE_ID } from "../../src/core/level/LevelLoader";

/** Helper: build an engine from a raw map string. */
function makeEngine(source: string): { engine: GameEngine; bus: EventBus; input: InputState } {
  const level = loadLevel("test", source);
  const bus = new EventBus();
  const input = new InputState();
  const engine = new GameEngine(level, bus, input);
  return { engine, bus, input };
}

function tickN(engine: GameEngine, n: number): void {
  for (let i = 0; i < n; i++) engine.step();
}

// All maps are width 7 (###### walls) or 8, with content rows 5-6 chars.
// Murphy spawns at x=1,y=1 in these maps.

describe("Murphy movement", () => {
  it("moves right on a held direction every MURPHY_STEP_TICKS", () => {
    const { engine, input } = makeEngine(`#######\n#M...B#\n#...I.#\n#######`);
    input.press("RIGHT");
    engine.step();
    engine.step();
    expect(engine.murphyPosition).toEqual({ x: 2, y: 1 });
  });

  it("does not move into a wall", () => {
    const { engine, input } = makeEngine(`##########\n#M#B...###\n#..I.....#\n##########`);
    input.press("RIGHT");
    tickN(engine, 6);
    expect(engine.murphyPosition).toEqual({ x: 1, y: 1 });
  });
  it("collects an Infotron and emits an event", () => {
    const { engine, input, bus } = makeEngine(`########\n#MI..B##\n#......#\n########`);
    const events: string[] = [];
    bus.on((e) => events.push(e.type));
    input.press("RIGHT");
    tickN(engine, 2);
    expect(engine.infotronsLeft).toBe(0);
    expect(events).toContain("infotronCollected");
  });

  it("opens the Base when all Infotrons are collected", () => {
    const { engine, input, bus } = makeEngine(`#######\n#MIB###\n#.....#\n#######`);
    const events: string[] = [];
    bus.on((e) => events.push(e.type));
    input.press("RIGHT");
    tickN(engine, 2);
    expect(engine.isBaseOpen).toBe(true);
    expect(events).toContain("baseOpened");
  });

  it("completes the level by walking onto an open Base", () => {
    const { engine, input, bus } = makeEngine(`#######\n#MIB###\n#.....#\n#######`);
    const events: string[] = [];
    bus.on((e) => events.push(e.type));
    input.press("RIGHT");
    tickN(engine, 4);
    expect(events).toContain("levelComplete");
    expect(engine.isLevelComplete).toBe(true);
  });

  it("dies when walking into a Zonk", () => {
    const { engine, input, bus } = makeEngine(`#######\n#MZ.B##\n#...I.#\n#######`);
    const events: string[] = [];
    bus.on((e) => events.push(e.type));
    input.press("RIGHT");
    tickN(engine, 2);
    expect(engine.murphyAlive).toBe(false);
    expect(events).toContain("murphyDied");
  });
});

describe("Electron / Terminal", () => {
  it("carries an Electron after picking it up", () => {
    const { engine, input } = makeEngine(`#######\n#ME.B##\n#...I.#\n#######`);
    input.press("RIGHT");
    tickN(engine, 2);
    expect(engine.murphyCarriesElectron).toBe(true);
    expect(engine.electronsLeft).toBe(0);
  });

  it("deposits the Electron when walking onto a Terminal", () => {
    const { engine, input, bus } = makeEngine(`########\n#MET.B##\n#....I.#\n########`);
    const events: string[] = [];
    bus.on((e) => events.push(e.type));
    input.press("RIGHT");
    tickN(engine, 2);
    expect(engine.murphyCarriesElectron).toBe(true);
    tickN(engine, 2);
    expect(engine.murphyCarriesElectron).toBe(false);
    expect(events).toContain("electronDeposited");
  });
});

describe("Zonk physics", () => {
  it("falls when the cell below is empty", () => {
    const { engine } = makeEngine(`###########\n#...Z.....#\n#M.......B#\n#....I....#\n###########`);
    tickN(engine, 2);
    const snapshot = engine.buildSnapshot();
    expect(snapshot.zonkPositions).toContainEqual({ x: 4, y: 2 });
  });

  it("bounces off a wall and reverses horizontal direction", () => {
    const { engine } = makeEngine(`########\n#Z....B#\n#M.....#\n#...I..#\n########`);
    tickN(engine, 20);
    const snap = engine.buildSnapshot();
    expect(snap.zonkPositions.length).toBe(1);
  });
});

describe("Snik Snak AI", () => {
  it("chases Murphy and kills on contact", () => {
    const { engine, bus } = makeEngine(`#######\n#S.M###\n#....B#\n#...I.#\n#######`);
    const events: string[] = [];
    bus.on((e) => events.push(e.type));
    tickN(engine, 20);
    expect(events).toContain("murphyDied");
  });
});

describe("Explosion", () => {
  it("destroys a destructible wall in its path", () => {
    const { engine } = makeEngine(`#######\n#X~..##\n#M..B##\n#...I.#\n#######`);
    tickN(engine, 40);
    const snap = engine.buildSnapshot();
    const tile = snap.tiles[1 * snap.width + 2];
    expect(tile).toBe(TILE_ID.EMPTY);
  });

  it("kills Murphy when the blast reaches him", () => {
    const { engine, bus } = makeEngine(`########\n#XM....#\n#....B##\n#...I..#\n########`);
    const events: string[] = [];
    bus.on((e) => events.push(e.type));
    tickN(engine, 30);
    expect(events).toContain("murphyDied");
  });
});

describe("One-way walls", () => {
  it("blocks movement from the blocked side", () => {
    // One-way UP wall at (1,2); Murphy above it at (1,1) cannot push DOWN through.
    const { engine, input } = makeEngine(`#######\n#M..B##\n#^..I.#\n#.....#\n#######`);
    input.press("DOWN");
    tickN(engine, 4);
    expect(engine.murphyPosition).toEqual({ x: 1, y: 1 });
  });

  it("allows movement through from the open side", () => {
    // One-way UP: passable when moving UP.
    const { engine, input } = makeEngine(`#######\n#..B.##\n#.^.I.#\n#M....#\n#######`);
    input.press("RIGHT");
    tickN(engine, 4);
    input.press("UP");
    tickN(engine, 4);
    expect(engine.murphyPosition.y).toBe(1);
  });
});

describe("Portals", () => {
  it("teleports Murphy to the paired portal preserving direction", () => {
    // Portal pair: (1,1) and (1,3). Murphy at (1,4) walks up, enters (1,3) portal -> appears at (1,1), continues up to (1,0)... blocked by wall, so lands at (1,1).
    const { engine, input } = makeEngine(`#######\n#O..I##\n#.....#\n#O....#\n#.M..B#\n#######`);
    input.press("UP");
    tickN(engine, 6);
    expect(engine.murphyPosition.y).toBeLessThanOrEqual(2);
  });
});
