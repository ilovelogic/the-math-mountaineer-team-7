import Konva from 'konva';
import { beforeEach, describe, expect, it } from 'vitest';
import { settings } from '../../src/content/settings';
import { MedalController } from '../../src/controller/MedalController';
import type { Outcome } from '../../src/controller/Screen';
import { PlayerProgress } from '../../src/model/PlayerProgress';
import type { Layers } from '../../src/view/stage';

/**
 * Checks issue #43: the controller gets the medal from `model/medals`, passes it
 * to the real medal screen, and follows the `Screen` contract: `onDone` is called
 * exactly once, and never after `stop`. The screen is drawn into three bare layers
 * instead of a real stage, and the button press is faked with `fire('click')`, so
 * no browser is needed. The limits are made up, so tuning `settings` can't break these tests.
 */

const limits = { diamond: 40, gold: 30, silver: 20, bronze: 10 };

let layers: Layers;
let progress: PlayerProgress;
let outcomes: Outcome[];

beforeEach(() => {
  layers = { background: new Konva.Layer(), sprites: new Konva.Layer(), ui: new Konva.Layer() };
  progress = new PlayerProgress(1);
  outcomes = [];
});

const start = (controller = new MedalController(layers, progress, limits)) => {
  controller.start((outcome) => outcomes.push(outcome));
  return controller;
};
const message = () => layers.ui.find<Konva.Text>('Text').map((node) => node.text())[0];
const seeResults = () => {
  const label = layers.ui.findOne((node: Konva.Node) => node instanceof Konva.Text && node.text() === 'See Results');
  return label!.getParent()!;
};
const drawnNodes = () => Object.values(layers).flatMap((layer) => layer.getChildren());

describe('MedalController', () => {
  it('draws nothing until it starts', () => {
    new MedalController(layers, progress, limits);
    expect(drawnNodes()).toHaveLength(0);
  });

  it.each([
    [40, 'a diamond medal'],
    [30, 'a gold medal'],
    [29, 'a silver medal'],
    [10, 'a bronze medal'],
    [9, 'no medal'],
  ])('shows %i points as %s', (points, medal) => {
    progress.addPoints(points);
    start();
    expect(message()).toContain(`You finished with ${points} points and earned ${medal}.`);
  });

  it('uses the limits in settings when given none', () => {
    progress.addPoints(settings.medalLimits.gold);
    start(new MedalController(layers, progress));
    expect(message()).toContain('earned a gold medal');
  });

  it('reads the points when it starts, not when it is built', () => {
    const controller = new MedalController(layers, progress, limits);
    progress.addPoints(10);
    start(controller);
    expect(message()).toContain('You finished with 10 points and earned a bronze medal');
  });

  it('reports nothing until See Results is pressed, then done exactly once', () => {
    start();
    expect(outcomes).toEqual([]);
    seeResults().fire('click');
    seeResults().fire('click');
    expect(outcomes).toEqual([{ kind: 'done' }]);
  });

  it('leaves the screen up after reporting, for GameFlow to stop it', () => {
    const controller = start();
    seeResults().fire('click');
    expect(drawnNodes()).not.toHaveLength(0);
    controller.stop();
    expect(drawnNodes()).toHaveLength(0);
  });

  it('removes everything it drew when stopped, and never reports afterwards', () => {
    const controller = start();
    const button = seeResults();
    controller.stop();
    button.fire('click');
    expect(outcomes).toEqual([]);
    expect(drawnNodes()).toHaveLength(0);
  });

  it('can be stopped before it starts, and stopped twice', () => {
    const controller = new MedalController(layers, progress, limits);
    controller.stop();
    start(controller);
    controller.stop();
    controller.stop();
    expect(drawnNodes()).toHaveLength(0);
  });
});

// Optional documentation
// - beforeEach(fn): runs fn before every it(...), so each test starts with fresh layers and a new game.
// - it.each([...])('... %i ... %s', fn): runs the test once per row, putting the row's values into the name and passing them to fn.
// - start = (controller = new MedalController(...)) => ...: a default value, so a test can pass its own controller or leave it out.
// - findOne((node) => ...): the first node inside the layer for which the function returns true.
// - label!: the `!` tells TypeScript the value isn't null here; the test would throw if it were.
// - node.fire('click'): runs the node's click handlers as if it had been clicked, without a real mouse.
// - flatMap: runs the function on each item and joins the resulting lists into one.
