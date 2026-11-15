import Konva from 'konva';
import { STAGE_HEIGHT, STAGE_WIDTH } from './stage';
import { colors, text } from './theme';

/** What showLoadingScreen gives back: a way to fill the bar, and a way to take the screen down. */
export interface LoadingScreen {
  /** Fills the bar to show that `loaded` of `total` files have finished. */
  progress(loaded: number, total: number): void;
  /** Removes everything the loading screen drew. */
  remove(): void;
}

// The images aren't loaded yet, so the screen is built only from theme colors, shapes and
// text: the title screen's day sky, the game's name, and a bar that fills as files arrive.
const TITLE = 'The Math Mountaineer';
const BAR = { width: 400, height: 20, y: 270 };
const BAR_X = (STAGE_WIDTH - BAR.width) / 2;

/**
 * Draws the loading screen on `layer`, with an empty bar, for `main.ts` to show while
 * images and sounds load. It covers the whole stage, so nothing behind it shows through.
 */
export function showLoadingScreen(layer: Konva.Layer): LoadingScreen {
  const fill = new Konva.Rect({ x: BAR_X, y: BAR.y, width: 0, height: BAR.height, fill: colors.teal, cornerRadius: BAR.height / 2 });
  const group = new Konva.Group();
  group.add(
    new Konva.Rect({ width: STAGE_WIDTH, height: STAGE_HEIGHT, fill: colors.skyDay }),
    new Konva.Text({ ...text.title, text: TITLE, y: 190, width: STAGE_WIDTH, align: 'center' }),
    new Konva.Rect({ x: BAR_X, y: BAR.y, width: BAR.width, height: BAR.height, fill: colors.white, cornerRadius: BAR.height / 2 }),
    fill,
    // The border goes on top of the fill, so the fill's ends never cover it.
    new Konva.Rect({ x: BAR_X, y: BAR.y, width: BAR.width, height: BAR.height, stroke: colors.ink, strokeWidth: 2, cornerRadius: BAR.height / 2 }),
    new Konva.Text({ ...text.body, text: 'Loading…', y: BAR.y + BAR.height + 14, width: STAGE_WIDTH, align: 'center' }),
  );
  layer.add(group);

  return {
    progress: (loaded, total) => fill.width((BAR.width * loaded) / total),
    remove: () => group.destroy(),
  };
}
// Optional documentation
// - cornerRadius: BAR.height / 2: rounds the corners by half the bar's height, so each end is a full half circle.
// - { ...text.title, text: TITLE, ... }: the spread `...` copies every property of text.title into the new object; the properties after it add to or override them.
// - align: 'center' with a width: the text is centered inside that width, here the whole stage.
// - fill.width(...): sets the rectangle's width, and Konva redraws the layer on its own.
// - group.destroy(): removes the group and everything inside it from the layer.
