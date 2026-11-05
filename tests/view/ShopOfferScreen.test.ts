import { Image } from 'canvas';
import Konva from 'konva';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCEPT, DECLINE, shopOffers } from '../../src/content/shopText';
import { ShopOfferScreen } from '../../src/view/ShopOfferScreen';
import type { Layers } from '../../src/view/stage';

/**
 * Checks what ShopOfferController relies on from the shop offer screen: it shows the
 * shop's offer text from content, its buttons come in ACCEPT then DECLINE order, a click
 * reports that button's position, and destroy() removes everything it drew. It draws real
 * Konva nodes into three bare layers and clicks by firing the event on a button. Node has
 * no browser Image, so node-canvas's stands in for the background and player pictures.
 * Limit: whether the scene looks like the mockup still needs a look with `npm run dev`.
 */

let layers: Layers;

beforeEach(() => {
  vi.stubGlobal('Image', Image);
  layers = { background: new Konva.Layer(), sprites: new Konva.Layer(), ui: new Konva.Layer() };
});

const texts = () => layers.ui.find<Konva.Text>('Text').map((node) => node.text());
/** The button showing `label`, which is the group holding that text. */
const buttonWith = (label: string) => layers.ui.find<Konva.Text>('Text').find((node) => node.text() === label)!.getParent()!;
const drawnCount = () => [layers.background, layers.sprites, layers.ui].reduce((sum, layer) => sum + layer.getChildren().length, 0);

function drawOffer(shop: 'supplies' | 'clothing') {
  const screen = new ShopOfferScreen(layers, shop, shopOffers[shop]);
  const picks: number[] = [];
  screen.onChoice((index) => picks.push(index));
  screen.draw();
  return { screen, picks };
}

describe('ShopOfferScreen', () => {
  it.each(['supplies', 'clothing'] as const)('shows the %s shop’s offer and its two buttons, accept first', (shop) => {
    drawOffer(shop);
    const offer = shopOffers[shop];
    expect(texts()).toEqual([offer.text, offer.accept, offer.decline]);
  });

  it('reports ACCEPT for the accept button and DECLINE for the decline button', () => {
    const { picks } = drawOffer('supplies');
    buttonWith(shopOffers.supplies.accept).fire('click');
    buttonWith(shopOffers.supplies.decline).fire('click');
    expect(picks).toEqual([ACCEPT, DECLINE]);
  });

  it('draws the scene on the background layer and the player on the sprites layer', () => {
    drawOffer('clothing');
    expect(layers.background.find('Image')).toHaveLength(1);
    expect(layers.sprites.find('Image')).toHaveLength(1);
  });

  it('removes everything it drew, and reports no clicks afterwards', () => {
    const { screen, picks } = drawOffer('supplies');
    const accept = buttonWith(shopOffers.supplies.accept);
    screen.destroy();
    accept.fire('click');
    expect(drawnCount()).toBe(0);
    expect(picks).toEqual([]);
  });
});

// Optional documentation
// - import { Image } from 'canvas': node-canvas's version of the browser's Image, so Konva.Image has a picture to hold in Node.
// - vi.stubGlobal('Image', Image): makes `Image` exist for the code under test, as it would in a browser; view/assets uses it when no file has been loaded.
// - beforeEach(fn): runs fn before every test in the file, so each starts with empty layers.
// - layers.ui.find<Konva.Text>('Text'): every Text node inside the layer, at any depth; `<Konva.Text>` tells TypeScript what kind of node they are.
// - .map((node) => node.text()): makes a new array holding each node's text, in the same order.
// - .find((node) => ...) on an array: the first item the check is true for.
// - getParent()!: the group the text sits in, which is the button; the `!` tells TypeScript it can't be missing, since every button's text is inside its button.
// - .reduce((sum, layer) => ..., 0): adds up each layer's number of children, starting from 0.
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
// - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws.
// - it.each([...] as const)(name, fn): runs the same test once per shop; %s in the name is filled in with it, and `as const` keeps each one typed as a shop name.
// - expect(value).toEqual(expected): passes when the two values have the same contents, even if they're different arrays.
// - button.fire('click'): triggers the button's click handlers directly, as if it had been clicked.
// - expect(list).toHaveLength(n): passes when the array has exactly n items.
// - expect(value).toBe(expected): throws, failing the test, unless the two values are exactly equal.
