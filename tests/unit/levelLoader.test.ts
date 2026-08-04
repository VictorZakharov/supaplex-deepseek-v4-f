import { describe, expect, it } from "vitest";
import { parseLevel } from "../../src/core/level/LevelLoader";
import { validateLevel } from "../../src/core/level/LevelValidator";

const GOOD = `##########\n#..I..B..#\n#....M...#\n#........#\n##########`;

describe("LevelLoader", () => {
  it("parses a simple level with correct dimensions", () => {
    const level = parseLevel("t", GOOD);
    expect(level.width).toBe(10);
    expect(level.height).toBe(5);
    expect(level.infotronCount).toBe(1);
    expect(level.murphySpawn).toEqual({ x: 5, y: 2 });
  });

  it("rejects unknown characters", () => {
    expect(() => parseLevel("t", "#####\n#@M.#\n#..I#\n#####")).toThrow(/unknown tile character/);
  });

  it("rejects rows of unequal width", () => {
    expect(() => parseLevel("t", "####\n#...#\n###")).toThrow(/same width/);
  });

  it("requires a Murphy", () => {
    expect(() => parseLevel("t", "#####\n#..I#\n#####")).toThrow(/missing Murphy/);
  });

  it("requires at least one Infotron", () => {
    expect(() => parseLevel("t", "#####\n#.M.#\n#####")).toThrow(/at least one Infotron/);
  });

  it("requires portals in pairs", () => {
    // Three portals = odd count → error.
    expect(() => parseLevel("t", "######\n#O.MO#\n#.O.I#\n######\n#..M.#\n######")).toThrow(/pairs/);
  });

  it("builds portal pairs in order of appearance", () => {
    const level = parseLevel("t", `##########\n#O.....IB#\n##########\n#O.....M.#\n##########`);
    expect(level.portalPairs).toHaveLength(1);
    expect(level.portalPairs[0]).toEqual([
      { x: 1, y: 1 },
      { x: 1, y: 3 },
    ]);
  });

  it("ignores comments and blank lines", () => {
    const level = parseLevel("t", "// comment\n\n#####\n#MIB#\n#####");
    expect(level.height).toBe(3);
  });
});

describe("LevelValidator", () => {
  it("accepts a valid level", () => {
    const level = parseLevel("t", GOOD);
    expect(() => validateLevel(level, "t")).not.toThrow();
  });

  it("rejects multiple Murphies", () => {
    const level = parseLevel("t", "#####\n#M.M#\n#..I#\n#####");
    expect(() => validateLevel(level, "t")).toThrow(/exactly one Murphy/);
  });

  it("rejects missing Base", () => {
    const level = parseLevel("t", "#####\n#.M.#\n#..I#\n#####");
    expect(() => validateLevel(level, "t")).toThrow(/exactly one Base/);
  });

  it("rejects tile buffer size mismatch", () => {
    const level = parseLevel("t", GOOD);
    level.tiles = new Uint8Array(3);
    expect(() => validateLevel(level, "t")).toThrow(/buffer size/);
  });
});
