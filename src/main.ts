// Entry point and the only place that wires the game together: it builds the stage,
// views and controllers and starts GameFlow. Until those land, it draws a placeholder.
import Konva from 'konva';
import { loadAssets } from './view/assets';
import { createStage, STAGE_HEIGHT, STAGE_WIDTH } from './view/stage';

// Every image and sound is loaded before anything is drawn, so no screen waits on a file.
await loadAssets();

const layers = createStage('game').layers;

layers.ui.add(
  new Konva.Text({
    text: 'The Math Mountaineer',
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
    align: 'center',
    verticalAlign: 'middle',
    fontSize: 40,
  }),
);
// Optional documentation
// - await at the top level of a module: the rest of this file waits for the promise; it's allowed in ES modules, which Vite builds.
// - Konva.Text align: 'center' / verticalAlign: 'middle': centres the text within the box set by `width` and `height`.
