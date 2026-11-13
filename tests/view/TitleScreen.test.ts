import Konva from 'konva';
import { beforeEach, describe, expect, it } from 'vitest';
import { CONTINUE, NEW_GAME } from '../../src/controller/TitleController';
import type { Layers } from '../../src/view/stage';
import { TitleScreen } from '../../src/view/TitleScreen';
import { standInLoadedImages } from '../standInImage';

/**
 * Checks what TitleController relies on from the title screen: it shows Continue only when
 * asked to, its buttons come in NEW_GAME then CONTINUE order, a click reports that
 * button's position, and destroy() removes everything it drew. It draws real Konva nodes
 * into three bare layers and clicks by firing the event on a button. Node has no browser
 * Image, so an already-loaded 1 × 1 picture stands in for the background and the sprites
 * (see tests/standInImage.ts).
 * Limit: whether the screen looks like the mockup still needs a look with `npm run dev`.
 */

let layers: Layers;

beforeEach(() => {
  standInLoadedImages();
  layers = { background: new Konva.Layer(), sprites: new Konva.Layer(), ui: new Konva.Layer() };
});

const texts = () => layers.ui.find<Konva.Text>('Text').map((node) => node.text());
/** The button showing `label`, which is the group holding that text. */
const buttonWith = (label: string) => layers.ui.find<Konva.Text>('Text').find((node) => node.text() === label)!.getParent()!;
const drawnCount = () => [layers.background, layers.sprites, layers.ui].reduce((sum, layer) => sum + layer.getChildren().length, 0);

function drawTitle(canContinue: boolean) {
  const screen = new TitleScreen(layers);
  const picks: number[] = [];
  screen.onChoice((index) => picks.push(index));
  screen.draw(canContinue);
  return { screen, picks };
}

describe('TitleScreen', () => {
  it('shows the game’s name, its pitch, and New game then Continue', () => {
    drawTitle(true);
    expect(texts()).toEqual([
      'The Math Mountaineer',
      'Cross the mountains with the Pythagorean theorem to find your friend.',
      'New game',
      'Continue',
    ]);
  });

  it('leaves out Continue when there is no game to continue', () => {
    drawTitle(false);
    expect(texts()).not.toContain('Continue');
    expect(texts()).toContain('New game');
  });

  it('reports NEW_GAME for New game and CONTINUE for Continue', () => {
    const { picks } = drawTitle(true);
    buttonWith('New game').fire('click');
    buttonWith('Continue').fire('click');
    expect(picks).toEqual([NEW_GAME, CONTINUE]);
  });

  it('draws the mountains on the background layer and both characters on the sprites layer', () => {
    drawTitle(true);
    expect(layers.background.find('Image')).toHaveLength(1);
    expect(layers.sprites.find('Image')).toHaveLength(2);
  });

  it('removes everything it drew, and reports no clicks afterwards', () => {
    const { screen, picks } = drawTitle(true);
    const newGame = buttonWith('New game');
    screen.destroy();
    newGame.fire('click');
    expect(drawnCount()).toBe(0);
    expect(picks).toEqual([]);
  });
});

// Optional documentation
// - beforeEach(fn): runs fn before every test in the file, so each starts with empty layers.
// - layers.ui.find<Konva.Text>('Text'): every Text node inside the layer, at any depth; `<Konva.Text>` tells TypeScript what kind of node they are.
// - .map((node) => node.text()): makes a new array holding each node's text, in the same order.
// - .find((node) => ...) on an array: the first item the check is true for.
// - getParent()!: the group the text sits in, which is the button; the `!` tells TypeScript it can't be missing, since every button's text is inside its button.
// - .reduce((sum, layer) => ..., 0): adds up each layer's number of children, starting from 0.
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
// - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws.
// - expect(value).toEqual(expected): passes when the two values have the same contents, even if they're different arrays.
// - expect(list).not.toContain(item): passes when the array doesn't hold that item; without `.not`, when it does.
// - button.fire('click'): triggers the button's click handlers directly, as if it had been clicked.
// - expect(list).toHaveLength(n): passes when the array has exactly n items.
// - expect(value).toBe(expected): throws, failing the test, unless the two values are exactly equal.
