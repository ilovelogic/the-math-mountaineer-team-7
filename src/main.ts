// Entry point and the only place that wires the game together: it builds the stage,
// views and controllers and starts GameFlow. Until those land, it draws a placeholder.
import Konva from 'konva';
import { loadAssets } from './view/assets';
import { loadFonts } from './view/fonts';
import { createStage, STAGE_HEIGHT, STAGE_WIDTH } from './view/stage';
import { text } from './view/theme';

// Every image, sound and font is loaded before anything is drawn, so no screen waits
// on a file and Konva never draws text in the fallback font and then has to redraw it.
await Promise.all([loadAssets(), loadFonts()]);

const layers = createStage('game').layers;

layers.ui.add(
  new Konva.Text({
    ...text.title,
    text: 'The Math Mountaineer',
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
    align: 'center',
    verticalAlign: 'middle',
  }),
);
// Optional documentation
// - await at the top level of a module: the rest of this file waits for the promise; it's allowed in ES modules, which Vite builds.
// - Promise.all([...]): waits for every promise in the array, so the images and the fonts load at the same time instead of one after the other.
// - ...text.title: copies every setting from the theme's title style (font, size, weight, colour) into this object; settings written after it are added alongside.
// - Konva.Text align: 'center' / verticalAlign: 'middle': centres the text within the box set by `width` and `height`.
