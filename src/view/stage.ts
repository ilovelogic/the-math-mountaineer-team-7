import Konva from 'konva';

/** Views always draw in this 960×540 space, and the stage scales it up or down to fit the window. */
export const STAGE_WIDTH = 960;
export const STAGE_HEIGHT = 540;

/** The layers every view draws into, listed back to front, which views receive instead of making their own. */
export interface Layers {
  /**
   * For scenery that rarely changes. Each layer is its own canvas, so drawing on
   * the other layers never redraws this one, and it ignores clicks.
   */
  background: Konva.Layer;
  sprites: Konva.Layer;
  ui: Konva.Layer;
}

/** Creates the game's only stage, which `main.ts` calls once at startup. */
export function createStage(containerId: string): { stage: Konva.Stage; layers: Layers } {
  const stage = new Konva.Stage({ container: containerId, width: STAGE_WIDTH, height: STAGE_HEIGHT });
  const layers: Layers = {
    background: new Konva.Layer({ listening: false }),
    sprites: new Konva.Layer(),
    ui: new Konva.Layer(),
  };
  stage.add(layers.background, layers.sprites, layers.ui);
  fitToWindow(stage);
  window.addEventListener('resize', () => fitToWindow(stage));
  return { stage, layers };
}
// Optional documentation
// - new Konva.Layer({ listening: false }): Konva skips this layer when working out what was clicked or hovered; its shapes still draw.
// - stage.add(a, b, c): adds several layers in one call; later arguments draw on top of earlier ones.
// - window.addEventListener('resize', handler): runs the handler every time the browser window changes size, for as long as the page is open.
// - { stage, layers }: shorthand for { stage: stage, layers: layers }.

/**
 * How much to scale the 960×540 stage so it becomes the largest 16:9 box that
 * fits a window of this size. The tighter side decides, so the box touches that
 * side and leaves space on the other. It's a pure function, kept apart from
 * `fitToWindow`, so tests can check the math without a browser.
 */
export function fitScale(windowWidth: number, windowHeight: number): number {
  return Math.min(windowWidth / STAGE_WIDTH, windowHeight / STAGE_HEIGHT);
}
// Optional documentation
// - Math.min(a, b): the smaller of the two numbers.

/**
 * Sizes the canvas to the largest 16:9 box that fits the window, and scales
 * everything on it by the same factor. Views keep using 960×540 coordinates,
 * and Konva maps clicks back through the scale.
 */
function fitToWindow(stage: Konva.Stage): void {
  const scale = fitScale(window.innerWidth, window.innerHeight);
  stage.size({ width: STAGE_WIDTH * scale, height: STAGE_HEIGHT * scale });
  stage.scale({ x: scale, y: scale });
}
// Optional documentation
// - window.innerWidth / window.innerHeight: the visible page area in CSS pixels, without the browser's toolbars.
// - stage.size({ width, height }): sets both dimensions at once and resizes every layer's canvas to match; Konva redraws at the new size, so nothing blurs.
