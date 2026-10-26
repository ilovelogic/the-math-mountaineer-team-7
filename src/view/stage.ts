import Konva from 'konva';

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
  return { stage, layers };
}
