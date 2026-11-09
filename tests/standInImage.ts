import { createCanvas, Image } from 'canvas';
import { vi } from 'vitest';

// A 1 × 1 PNG, so every stand-in picture has finished loading before Konva draws it.
// Konva draws layers a moment later, and node-canvas throws on a picture that hasn't loaded.
const PIXEL = createCanvas(1, 1).toBuffer('image/png');

class LoadedImage extends Image {
  constructor() {
    super();
    this.src = PIXEL;
  }
}

/**
 * Gives the code under test a browser-like `Image`, which Node doesn't have. view/assets
 * makes one when no file has been loaded, as in tests, and each one comes back already
 * holding a 1 × 1 picture.
 */
export function standInLoadedImages(): void {
  vi.stubGlobal('Image', LoadedImage);
}
// Optional documentation
// - import { createCanvas, Image } from 'canvas': node-canvas's versions of the browser's canvas and Image, which Konva uses in tests.
// - createCanvas(1, 1).toBuffer('image/png'): draws an empty 1 × 1 canvas and gives back its PNG file's bytes.
// - class LoadedImage extends Image: a kind of Image that runs the extra constructor code; super() runs Image's own first.
// - this.src = PIXEL: node-canvas loads a picture from bytes right away, so the image is ready as soon as it's made.
// - vi.stubGlobal('Image', LoadedImage): makes `Image` exist for the code under test, as it would in a browser.
