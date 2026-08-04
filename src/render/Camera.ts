/**
 * Camera: centers the view on a target cell and clamps to the level bounds.
 * All values are in tile units.
 */
export class Camera {
  private x = 0;
  private y = 0;
  private readonly width: number;
  private readonly height: number;

  constructor(levelWidth: number, levelHeight: number) {
    this.width = levelWidth;
    this.height = levelHeight;
  }

  /** Current camera origin in tile units (top-left of the view). */
  get origin(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  /** Snap the camera to center on a cell. */
  centerOn(cellX: number, cellY: number, viewTilesW: number, viewTilesH: number): void {
    // Center the given cell in the view.
    this.x = cellX - viewTilesW / 2;
    this.y = cellY - viewTilesH / 2;
    this.clamp(viewTilesW, viewTilesH);
  }

  private clamp(viewTilesW: number, viewTilesH: number): void {
    this.x = Math.max(0, Math.min(this.x, Math.max(0, this.width - viewTilesW)));
    this.y = Math.max(0, Math.min(this.y, Math.max(0, this.height - viewTilesH)));
  }
}
