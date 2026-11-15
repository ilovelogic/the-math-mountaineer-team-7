import Konva from 'konva';
import { beforeEach, describe, expect, it } from 'vitest';
import { showLoadingScreen } from '../../src/view/loadingScreen';
import { STAGE_HEIGHT, STAGE_WIDTH } from '../../src/view/stage';
import { colors } from '../../src/view/theme';

/**
 * Checks what main.ts relies on from the loading screen: it covers the stage with the
 * day sky and shows the game's name and "Loading…", its bar starts empty and fills in
 * proportion to the files finished, and remove() takes everything down. It draws real
 * Konva nodes into a bare layer and finds the bar's fill by its teal color.
 * Limit: whether it looks right still needs a look with `npm run dev`.
 */

let layer: Konva.Layer;

beforeEach(() => {
  layer = new Konva.Layer();
});

const texts = () => layer.find<Konva.Text>('Text').map((node) => node.text());
const barFill = () => layer.find<Konva.Rect>('Rect').find((rect) => rect.fill() === colors.teal)!;
/** The width of the whole bar, from its border, which is the rectangle with an ink outline. */
const barWidth = () => layer.find<Konva.Rect>('Rect').find((rect) => rect.stroke() === colors.ink)!.width();

describe('showLoadingScreen', () => {
  it('covers the stage with the day sky and shows the name and "Loading…"', () => {
    showLoadingScreen(layer);
    const sky = layer.find<Konva.Rect>('Rect')[0];
    expect([sky.width(), sky.height(), sky.fill()]).toEqual([STAGE_WIDTH, STAGE_HEIGHT, colors.skyDay]);
    expect(texts()).toEqual(['The Math Mountaineer', 'Loading…']);
  });

  it('starts with an empty bar', () => {
    showLoadingScreen(layer);
    expect(barFill().width()).toBe(0);
  });

  it('fills the bar in proportion to the files finished, up to full', () => {
    const screen = showLoadingScreen(layer);
    screen.progress(3, 12);
    expect(barFill().width()).toBe(barWidth() / 4);
    screen.progress(12, 12);
    expect(barFill().width()).toBe(barWidth());
  });

  it('removes everything it drew', () => {
    showLoadingScreen(layer).remove();
    expect(layer.getChildren()).toHaveLength(0);
  });
});

// Optional documentation
// - beforeEach(fn): runs fn before every test in the file, so each starts with an empty layer.
// - layer.find<Konva.Rect>('Rect'): every rectangle inside the layer, at any depth; `<Konva.Rect>` tells TypeScript what kind of node they are.
// - .map((node) => node.text()): makes a new array holding each node's text, in the same order.
// - .find((rect) => ...) on an array: the first item the check is true for; the `!` tells TypeScript it's there, since the screen always draws it.
// - rect.fill() / rect.stroke() / rect.width(): with no argument, a Konva getter gives back the current value.
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
// - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws.
// - expect(value).toEqual(expected): passes when the two values have the same contents, even if they're different arrays.
// - expect(value).toBe(expected): throws, failing the test, unless the two values are exactly equal.
// - expect(list).toHaveLength(n): passes when the array has exactly n items.
