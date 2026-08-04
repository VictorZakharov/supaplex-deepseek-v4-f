import { TileKind } from "../../core/types";

/**
 * Procedural pixel-art sprite definitions. Each sprite is a grid of
 * single-character color keys drawn at 8x8 logical pixels and scaled up.
 * Keys are mapped to hex colors below. This keeps the game free of
 * binary assets and fully self-contained.
 */
type ColorKey =
  | " "
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  | "p"
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z"
  | "A"
  | "B"
  | "C";

export const PIXEL_SIZE = 8;

const COLORS: Record<ColorKey, string> = {
  " ": "transparent",
  a: "#1a2a4a",
  b: "#2d4a7a",
  c: "#4a6fa5",
  d: "#5a3a1a",
  e: "#7a5230",
  f: "#e8c837",
  g: "#f8e37a",
  h: "#c84a2a",
  i: "#e86a3a",
  j: "#2a8a3a",
  k: "#3aaa4a",
  l: "#ffffff",
  m: "#5a3a8a",
  n: "#7a5aaa",
  o: "#2ab8c8",
  p: "#4ad8e8",
  q: "#c84a9a",
  r: "#e86aba",
  s: "#f0f0f0",
  t: "#c0c0c0",
  u: "#4a3a8a",
  v: "#6a5aaa",
  w: "#8a8a8a",
  x: "#aaaaaa",
  y: "#e85a8a",
  z: "#f87aaa",
  A: "#f8a83a",
  B: "#f8c85a",
  C: "#ffd78a",
};

/** A pixel map: rows of color keys. */
export type PixelMap = string[];

const WALL: PixelMap = [
  "aaaaaaaa",
  "abcabcab",
  "aaaaaaaa",
  "abcabcab",
  "aaaaaaaa",
  "abcabcab",
  "aaaaaaaa",
  "abcabcab",
];

const DESTRUCTIBLE: PixelMap = [
  "dddddddd",
  "dedededd",
  "dddddddd",
  "dedededd",
  "dddddddd",
  "dedededd",
  "dddddddd",
  "dedededd",
];

const INFOTRON: PixelMap = [
  "........",
  "..ffff..",
  ".fgggff.",
  "fggggggf",
  "fggggggf",
  ".fgggff.",
  "..ffff..",
  "........",
];

const ZONK: PixelMap = [
  "..hhhh..",
  ".hiiii h",
  "hihhhhih",
  "hihhhhih",
  "hihhhhih",
  "hihhhhih",
  ".hiiii h",
  "..hhhh..",
];

const SNIK_SNAK: PixelMap = [
  "..yyyy..",
  ".yzzzzy.",
  "yzzlzzzy",
  "yzzlzzzy",
  "yzzzzzzy",
  "yzzzzzzy",
  ".yzzzzy.",
  "..yyyy..",
];

const MURPHY: PixelMap = [
  "..jjjj..",
  ".jkkkkj.",
  "jkllllkj",
  "jkllllkj",
  "jkjjjjkj",
  "jkjkkjkj",
  ".jjkkjj.",
  "..jjjj..",
];

const BASE: PixelMap = [
  "mmmmmmmm",
  "mnnnnnnm",
  "mnnnnnnm",
  "mnnnnnnm",
  "mnnnnnnm",
  "mnnnnnnm",
  "mnnnnnnm",
  "mmmmmmmm",
];

const TERMINAL: PixelMap = [
  "oooooooo",
  "oppppppo",
  "opoooooo",
  "oppppppo",
  "opoooooo",
  "oppppppo",
  "opoooooo",
  "oooooooo",
];

const ELECTRON: PixelMap = [
  "..qqqq..",
  ".qrrrrq.",
  "qrrrrrrq",
  "qrrrrrrq",
  "qrrrrrrq",
  "qrrrrrrq",
  ".qrrrrq.",
  "..qqqq..",
];

const GENERATOR: PixelMap = [
  "ssssssss",
  "stttttts",
  "stssssst",
  "ststttst",
  "ststttst",
  "stssssst",
  "stttttts",
  "ssssssss",
];

const PORTAL: PixelMap = [
  "..uuuu..",
  ".uvvvvu.",
  "uvuuuuvu",
  "uvuvuvvu",
  "uvuvuvvu",
  "uvuuuuvu",
  ".uvvvvu.",
  "..uuuu..",
];

const ONE_WAY_UP: PixelMap = [
  "wwwwwwww",
  "wxxxxxxw",
  "w.x..x.w",
  "w..xx..w",
  "w..xx..w",
  "w.x..x.w",
  "wxxxxxxw",
  "wwwwwwww",
];

const ONE_WAY_DOWN: PixelMap = [
  "wwwwwwww",
  "wxxxxxxw",
  "w.x..x.w",
  "w..xx..w",
  "w..xx..w",
  "w.x..x.w",
  "wxxxxxxw",
  "wwwwwwww",
];

const ONE_WAY_LEFT: PixelMap = [
  "wwwwwwww",
  "wxxxxxxw",
  "w.x...xw",
  "w.x...xw",
  "w.x...xw",
  "w.x...xw",
  "wxxxxxxw",
  "wwwwwwww",
];

const ONE_WAY_RIGHT: PixelMap = [
  "wwwwwwww",
  "wxxxxxxw",
  "wx...x.w",
  "wx...x.w",
  "wx...x.w",
  "wx...x.w",
  "wxxxxxxw",
  "wwwwwwww",
];

const EXPLOSION: PixelMap = [
  "..AAAA..",
  ".ABBBBA.",
  "ABCCCCBA",
  "ABCCCCBA",
  "ABCCCCBA",
  "ABCCCCBA",
  ".ABBBBA.",
  "..AAAA..",
];

/** Map each tile/entity kind to its pixel map. */
export const SPRITE_MAPS: Record<string, PixelMap> = {
  [TileKind.WALL]: WALL,
  [TileKind.DESTRUCTIBLE_WALL]: DESTRUCTIBLE,
  [TileKind.INFOTRON]: INFOTRON,
  [TileKind.ZONK]: ZONK,
  [TileKind.SNIK_SNAK]: SNIK_SNAK,
  [TileKind.BASE]: BASE,
  [TileKind.TERMINAL]: TERMINAL,
  [TileKind.ELECTRON]: ELECTRON,
  [TileKind.EXPLOSION_GENERATOR]: GENERATOR,
  [TileKind.PORTAL]: PORTAL,
  [TileKind.ONE_WAY_UP]: ONE_WAY_UP,
  [TileKind.ONE_WAY_DOWN]: ONE_WAY_DOWN,
  [TileKind.ONE_WAY_LEFT]: ONE_WAY_LEFT,
  [TileKind.ONE_WAY_RIGHT]: ONE_WAY_RIGHT,
  "MURPHY": MURPHY,
  "EXPLOSION": EXPLOSION,
};

/** Render a pixel map to a canvas at the given pixel scale. */
export function renderSprite(map: PixelMap, scale: number): HTMLCanvasElement {
  const size = PIXEL_SIZE * scale;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  for (let y = 0; y < PIXEL_SIZE; y++) {
    const row = map[y]!;
    for (let x = 0; x < PIXEL_SIZE; x++) {
      const key = row[x] as ColorKey;
      const color = COLORS[key] ?? "transparent";
      if (color === "transparent") continue;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  return canvas;
}
