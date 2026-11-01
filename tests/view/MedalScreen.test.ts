import Konva from 'konva';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Layers } from '../../src/view/stage';
import { colors } from '../../src/view/theme';
import { drawMedalScreen, type MedalScreenData } from '../../src/view/MedalScreen';

/**
 * Checks issue #42: the medal screen shows the medal and points it's given
 * without working them out, draws each kind of medal like the mockups, and
 * removes everything when it ends. The screen is drawn into three bare layers
 * instead of a real stage, and the button press is faked with `fire('click')`,
 * so no browser is needed. Limit: these tests read what was drawn, not how it
 * looks, so the layout still needs a check with `npm run dev`.
 */

let layers: Layers;

beforeEach(() => {
  layers = { background: new Konva.Layer(), sprites: new Konva.Layer(), ui: new Konva.Layer() };
});

const draw = (data: Partial<MedalScreenData>) =>
  drawMedalScreen(layers, { medal: 'gold', points: 320, onSeeResults: () => {}, ...data });
const texts = (layer: Konva.Layer) => layer.find<Konva.Text>('Text').map((node) => node.text());

describe('drawMedalScreen', () => {
  it('shows the medal and points it is given, without working them out', () => {
    // 1000 points with a bronze medal can't happen in the game, so this only
    // passes if the screen shows what it was given.
    draw({ medal: 'bronze', points: 1000 });
    expect(texts(layers.ui)).toContain(
      'You finished with 1000 points and earned a bronze medal. Points decide the medal: diamond, gold, silver or bronze.',
    );
  });

  it('says so when there is no medal', () => {
    draw({ medal: 'none', points: 12 });
    expect(texts(layers.ui)).toContain('You finished with 12 points and earned no medal.');
  });

  it('draws gold, silver and bronze as a circle in that color with two ribbons', () => {
    draw({ medal: 'silver' });
    const circles = layers.sprites.find<Konva.Circle>('Circle');
    expect(circles.map((circle) => circle.fill())).toEqual([colors.silver]);
    expect(layers.sprites.find('Rect')).toHaveLength(2);
  });

  it('draws diamond as a diamond shape with two ribbons', () => {
    draw({ medal: 'diamond' });
    expect(layers.sprites.find('RegularPolygon')).toHaveLength(1);
    expect(layers.sprites.find('Circle')).toHaveLength(0);
    expect(layers.sprites.find('Rect')).toHaveLength(2);
  });

  it('draws no medal as a dashed outline with no ribbons', () => {
    draw({ medal: 'none' });
    const circles = layers.sprites.find<Konva.Circle>('Circle');
    expect(circles).toHaveLength(1);
    expect(circles[0].dash().length).toBeGreaterThan(0);
    expect(layers.sprites.find('Rect')).toHaveLength(0);
  });

  it('calls onSeeResults when See Results is pressed', () => {
    const onSeeResults = vi.fn();
    draw({ onSeeResults });
    const caption = layers.ui.findOne<Konva.Text>((node: Konva.Node) => node instanceof Konva.Text && node.text() === 'See Results');
    caption!.getParent()!.fire('click');
    expect(onSeeResults).toHaveBeenCalledTimes(1);
  });

  it('leaves the top of the ui layer clear for the Hud’s top bar', () => {
    draw({});
    expect(layers.ui.getClientRect().y).toBeGreaterThanOrEqual(48);
  });

  it('removes everything it drew when the screen ends, and nothing else', () => {
    const hud = new Konva.Group();
    layers.ui.add(hud);
    const cleanUp = draw({});
    cleanUp();
    expect(layers.background.getChildren()).toHaveLength(0);
    expect(layers.sprites.getChildren()).toHaveLength(0);
    expect(layers.ui.getChildren()).toHaveLength(1);
    expect(layers.ui.getChildren()[0]).toBe(hud);
  });
});

// Optional documentation
// - import type { Layers }: imports only the type, for checking; nothing from stage.ts runs because of this line.
// - beforeEach(fn): runs fn before every it(...), so each test starts with three fresh, empty layers.
// - Partial<MedalScreenData>: the same fields as MedalScreenData, but every one is optional, so a test passes only the ones it cares about.
// - { medal: 'gold', ..., ...data }: the spread `...` copies data's fields in last, so they replace the defaults before it.
// - layer.find<Konva.Text>('Text'): every node of that type anywhere inside the layer, as a list.
// - describe(name, fn) / it(name, fn): describe groups the tests for one thing, and each it is one test, named after what it checks.
// - expect(x).toContain(y): passes when the list x has y in it.
// - expect(x).toEqual(y): passes when x and y hold the same values, even if they aren't the same object.
// - expect(x).toHaveLength(n): passes when the list x has exactly n items.
// - expect(x).toBeGreaterThan(n) / toBeGreaterThanOrEqual(n): passes when x is more than n, or at least n.
// - vi.fn(): a stand-in function that records every call, so the test can check how many times it ran.
// - findOne((node) => ...): the first node inside the layer for which the function returns true.
// - node instanceof Konva.Text: true when the node is a Konva.Text, which lets the test call text() on it.
// - caption!.getParent()!: the `!` tells TypeScript the value isn't null here, and getParent() is the group the caption sits in, which is the button.
// - fire('click'): runs the node's click handlers as if it had been clicked, without a real mouse.
// - expect(fn).toHaveBeenCalledTimes(n): passes when the vi.fn() stand-in ran exactly n times.
// - getClientRect(): where the layer's drawings are and how big they are together; y is the top of the highest one.
// - getChildren(): the nodes added straight to the layer, not the ones inside them.
// - expect(x).toBe(y): passes only when x and y are the very same object (or the same plain value).
