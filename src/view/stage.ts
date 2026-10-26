import Konva from 'konva';

/** The size views draw in. On screen, the stage scales to fit the window. */
export const STAGE_WIDTH = 960;
export const STAGE_HEIGHT = 540;

/** The layers every view draws into, back to front. Views get these passed in. */
export interface Layers {
  /**
   * Scenery that rarely changes. Each layer is its own canvas, so drawing on the
   * other layers never redraws this one. It ignores clicks.
   */
  background: Konva.Layer;
  sprites: Konva.Layer;
  ui: Konva.Layer;
}

/** Creates the game's only stage. Called once, from `main.ts`. */
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
 * Sizes the canvas to the largest 16:9 box that fits the window, and scales
 * everything on it by the same factor. Views keep using 960×540 coordinates,
 * and Konva maps clicks back through the scale.
 */
function fitToWindow(stage: Konva.Stage): void {
  const scale = Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
  stage.size({ width: STAGE_WIDTH * scale, height: STAGE_HEIGHT * scale });
  stage.scale({ x: scale, y: scale });
}
// Optional documentation
// - window.innerWidth / window.innerHeight: the visible page area in CSS pixels, without the browser's toolbars.
// - stage.size({ width, height }): sets both dimensions at once and resizes every layer's canvas to match; Konva redraws at the new size, so nothing blurs.
