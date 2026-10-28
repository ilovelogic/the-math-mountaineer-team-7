import Konva from 'konva';
import { beforeEach, describe, expect, it } from 'vitest';
import { ChasmScreen } from '../../src/view/ChasmScreen';
import type { Layers } from '../../src/view/stage';

/**
 * Checks what the chasm screen shows and what it reports. The screen is drawn
 * into three bare layers instead of a real stage, and clicks are faked with
 * `fire('click')`, so no browser is needed. The chasm is the 5-12-13 one from
 * the "Pick a log" mockup.
 */

const chasm = { a: 5, b: 12, logs: [5, 13, 17] };

let layers: Layers;
let screen: ChasmScreen;
let picks: number[];

beforeEach(() => {
  layers = { background: new Konva.Layer(), sprites: new Konva.Layer(), ui: new Konva.Layer() };
  screen = new ChasmScreen(layers, chasm);
  picks = [];
  screen.onLogClicked((index) => picks.push(index));
  screen.draw();
});

const texts = (layer: Konva.Layer) => layer.find<Konva.Text>('Text').map((node) => node.text());
const buttons = () => layers.ui.find<Konva.Group>('.log-button');

describe('view/ChasmScreen', () => {
  it('labels the sides of the gap, leaving the log length as the question', () => {
    expect(texts(layers.sprites)).toEqual(expect.arrayContaining(['12 m', '5 m', 'c = ?']));
  });

  it('shows a button for each log in the chasm’s order, and piles them shortest on top', () => {
    screen.destroy();
    screen = new ChasmScreen(layers, { a: 7, b: 24, logs: [31, 20, 25] });
    screen.draw();
    expect(buttons().map((button) => button.findOne<Konva.Text>('Text')?.text())).toEqual(['31 m', '20 m', '25 m']);
    expect(texts(layers.sprites).filter((t) => ['20 m', '25 m', '31 m'].includes(t))).toEqual(['20 m', '25 m', '31 m']);
  });

  it('reports the position of each log that is clicked', () => {
    buttons()[2].fire('click');
    buttons()[0].fire('click');
    expect(picks).toEqual([2, 0]);
  });

  it('stops reporting clicks once locked, and greys out the picked log', () => {
    buttons()[1].fire('click');
    screen.lock();
    buttons()[0].fire('click');
    expect(picks).toEqual([1]);
    expect(buttons().map((button) => button.opacity())).toEqual([1, 0.5, 1]);
  });

  it('removes everything it drew, and reports nothing afterwards', () => {
    const button = buttons()[0];
    screen.destroy();
    button.fire('click');
    expect(picks).toEqual([]);
    for (const layer of Object.values(layers)) expect(layer.getChildren()).toHaveLength(0);
  });
});

// Optional documentation
// - beforeEach(fn): runs fn before every it(...), so each test starts with a freshly drawn screen.
// - layer.find<Konva.Text>('Text'): every node of that type anywhere inside the layer; '.log-button' instead finds nodes by their `name`.
// - node.fire('click'): runs the node's click handlers as if it had been clicked, without a real mouse.
// - expect.arrayContaining([...]): passes when the array holds all of these values, in any order and among others.
