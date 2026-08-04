import { describe, expect, it } from "vitest";
import { getLevelCount, getLevelData, getLevelName } from "../../src/levels";

describe("Sample levels", () => {
  it("has exactly 8 levels", () => {
    expect(getLevelCount()).toBe(8);
  });

  it("all levels parse and validate with a unique name", () => {
    const names = new Set<string>();
    for (let i = 0; i < getLevelCount(); i++) {
      const level = getLevelData(i);
      const name = getLevelName(i);
      expect(level.width).toBeGreaterThan(0);
      expect(level.height).toBeGreaterThan(0);
      expect(level.infotronCount).toBeGreaterThan(0);
      expect(level.murphySpawn).toBeDefined();
      expect(names.has(name)).toBe(false);
      names.add(name);
    }
  });
});
