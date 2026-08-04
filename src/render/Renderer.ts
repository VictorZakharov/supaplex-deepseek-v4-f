import { TileKind } from "../core/types";
import { SpriteAtlas } from "./SpriteAtlas";
import type { LevelState } from "../core/types";
import { TILE_FROM_ID } from "../core/level/LevelLoader";

/**
 * Canvas renderer. Draws the tile layer, then dynamic entities (explosions,
 * Zonks, Snik Snaks, Murphy). Purely functional over a LevelState snapshot.
 */
export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly atlas: SpriteAtlas;

  constructor(private readonly canvas: HTMLCanvasElement, tileSize: number) {
    this.ctx = canvas.getContext("2d")!;
    this.atlas = new SpriteAtlas(tileSize);
  }

  /** Canvas backing size in device pixels; keeps pixel-art crisp. */
  resize(width: number, height: number, dpr: number): void {
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }

  /** Device-pixel ratio, guarded for environments where it's undefined. */
  static dpr(): number {
    return typeof window !== "undefined" && window.devicePixelRatio ? window.devicePixelRatio : 1;
  }

  /** Draw the current state. */
  render(state: LevelState, cameraX: number, cameraY: number): void {
    const { width, height, tiles } = state;
    const ts = this.atlas.tileSize;
    const ctx = this.ctx;
    const dpr = Renderer.dpr();

    ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);

    const offX = -cameraX;
    const offY = -cameraY;

    // Tile layer.
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tileId = tiles[y * width + x]!;
        const kind = TILE_FROM_ID[tileId]!;
        if (kind === TileKind.EMPTY) continue;
        // Base only draws when open.
        if (kind === TileKind.BASE && !state.baseOpen) continue;
        // Murphy and items drawn in their own passes.
        if (kind === TileKind.MURPHY) continue;
        const sprite = this.atlas.get(kind);
        ctx.drawImage(sprite, offX + x * ts, offY + y * ts, ts, ts);
      }
    }

    // Explosions (behind movers).
    for (const p of state.explosionPositions) {
      const sprite = this.atlas.get("EXPLOSION");
      ctx.drawImage(sprite, offX + p.x * ts, offY + p.y * ts, ts, ts);
    }

    // Zonks.
    for (const p of state.zonkPositions) {
      ctx.drawImage(this.atlas.get(TileKind.ZONK), offX + p.x * ts, offY + p.y * ts, ts, ts);
    }

    // Snik Snaks.
    for (const p of state.snikSnakPositions) {
      ctx.drawImage(this.atlas.get(TileKind.SNIK_SNAK), offX + p.x * ts, offY + p.y * ts, ts, ts);
    }

    // Murphy.
    if (state.murphyVisible) {
      ctx.drawImage(
        this.atlas.get("MURPHY"),
        offX + state.murphyPos.x * ts,
        offY + state.murphyPos.y * ts,
        ts,
        ts,
      );
    }
  }
}
