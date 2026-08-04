import type { TileKind } from "../core/types";
import { renderSprite, SPRITE_MAPS } from "./sprites/pixelArt";

/**
 * Pre-renders every sprite to an offscreen canvas at render scale, keyed
 * by tile/entity kind, so the main render loop only does drawImage calls.
 */
export class SpriteAtlas {
  readonly tileSize: number;
  private readonly sprites = new Map<string, HTMLCanvasElement>();

  constructor(tileSize: number) {
    this.tileSize = tileSize;
    for (const [kind, map] of Object.entries(SPRITE_MAPS)) {
      this.sprites.set(kind, renderSprite(map, Math.round(tileSize / 8)));
    }
  }

  get(kind: string): HTMLCanvasElement {
    const sprite = this.sprites.get(kind);
    if (!sprite) {
      throw new Error(`No sprite for kind "${kind}"`);
    }
    return sprite;
  }

  has(kind: string): boolean {
    return this.sprites.has(kind);
  }
}

/** Map an engine tile id (number) to its TileKind sprite key. */
export function tileKindToKey(kind: TileKind): string {
  return kind;
}
