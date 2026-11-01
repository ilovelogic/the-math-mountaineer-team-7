import Konva from 'konva';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeChasm } from '../../src/model/problems';
import { ChasmScreen } from '../../src/view/ChasmScreen';
import { STAGE_WIDTH, type Layers } from '../../src/view/stage';

const QUESTION = 'Which log fits across this gap?';

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
    expect(buttons().map((button) => button.opacity())).toEqual([1, 0.4, 1]);
  });

  it('lines up the log buttons on the stage, clear of each other and of the question, for every chasm', () => {
    for (let seed = 0; seed < 10; seed++) {
      for (const level of [1, 2, 3]) {
        for (let index = 0; index < 5; index++) {
          screen.destroy();
          screen = new ChasmScreen(layers, makeChasm(seed, level, index));
          screen.draw();
          const row = buttons().map((button) => button.getClientRect({ relativeTo: layers.ui }));
          const question = layers.ui.findOne((node: Konva.Node) => node instanceof Konva.Text && node.text() === QUESTION);
          const box = question!.getParent()!.getClientRect({ relativeTo: layers.ui });
          row.slice(1).forEach((rect, i) => expect(rect.x).toBeGreaterThan(row[i].x + row[i].width));
          expect(row[row.length - 1].x + row[row.length - 1].width).toBeLessThanOrEqual(STAGE_WIDTH);
          for (const rect of row) expect(rect.y + rect.height).toBeLessThan(box.y);
        }
      }
    }
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
// - getClientRect({ relativeTo: layers.ui }): where a node is drawn and how big it is, measured from what's inside it, in the layer's coordinates.
// - findOne((node) => ...): the first node inside the layer for which the function returns true.
// - question!: the `!` tells TypeScript the value isn't null here; the test would throw if it were.
