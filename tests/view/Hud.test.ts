import Konva from 'konva';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PlayerProgress } from '../../src/model/PlayerProgress';
import { Hud } from '../../src/view/Hud';
import type { Layers } from '../../src/view/stage';

/**
 * Checks what the Hud shows from the progress GameFlow hands it: the topic,
 * level and points in the top bar, the "Level 1 of 3 · Chasm 2 of 5" line, and
 * the "+ points" tag after a correct pick. Also checks that redrawing never
 * changes the progress. The Hud draws into bare layers, and fake timers let the
 * tag's fade finish without waiting. Limit: it can't tell whether the fade looks
 * smooth, which still needs a look in the browser.
 */

const TOPIC = 'Pythagorean theorem in 2D';

let layers: Layers;
let hud: Hud;
let progress: PlayerProgress;

beforeEach(() => {
  vi.useFakeTimers();
  layers = { background: new Konva.Layer(), sprites: new Konva.Layer(), ui: new Konva.Layer() };
  hud = new Hud(layers);
  progress = new PlayerProgress(42, { level: 1, topic: TOPIC });
});

afterEach(() => {
  hud.destroy();
  vi.useRealTimers();
});

const texts = () => layers.ui.find<Konva.Text>('Text').map((node) => node.text());
const progressLine = () => layers.ui.findOne<Konva.Group>('.hud-progress')!.findOne<Konva.Text>('Text')!.text();
const tag = () => layers.ui.findOne<Konva.Group>('.hud-points-gained')!;

describe('view/Hud', () => {
  it('shows the topic, level and points from the progress', () => {
    progress.addPoints(20);
    hud.update(progress, 1);
    expect(texts()).toEqual(expect.arrayContaining([`Topic: ${TOPIC}`, 'Level 1', 'Points: 20']));
  });

  it('shows the level and chasm out of their totals', () => {
    hud.update(progress, 2);
    expect(progressLine()).toBe('Level 1 of 3 · Chasm 2 of 5');
  });

  it('shows just the level between chasms', () => {
    hud.update(progress);
    expect(progressLine()).toBe('Level 1 of 3');
  });

  it('shows the new values each time it is updated', () => {
    hud.update(progress, 1);
    progress.addPoints(10);
    progress.moveTo(6, { level: 2, topic: 'Pythagorean theorem in 3D' });
    hud.update(progress, 1);
    expect(texts()).toEqual(expect.arrayContaining(['Topic: Pythagorean theorem in 3D', 'Level 2', 'Points: 10']));
    expect(progressLine()).toBe('Level 2 of 3 · Chasm 1 of 5');
  });

  it('never changes the progress it is given', () => {
    progress.addPoints(10);
    progress.recordAnswer('fits');
    const before = progress.toJSON();
    hud.update(progress, 3);
    hud.showPointsGained(10);
    expect(progress.toJSON()).toEqual(before);
  });

  it('shows a "+ points" tag after a correct pick, then fades it out', () => {
    hud.update(progress, 1);
    expect(tag().visible()).toBe(false);

    hud.showPointsGained(10);
    expect(tag().visible()).toBe(true);
    expect(tag().findOne<Konva.Text>('Text')!.text()).toBe('+10 points');
    expect(tag().x() + tag().width()).toBeCloseTo(936);

    vi.advanceTimersByTime(2000);
    expect(tag().visible()).toBe(false);
  });

  it('shows no tag for a wrong pick, which earns 0 points', () => {
    hud.showPointsGained(0);
    expect(tag().visible()).toBe(false);
  });

  it('stays in front of screens drawn after it', () => {
    layers.ui.add(new Konva.Group({ name: 'screen' }));
    hud.update(progress, 1);
    expect(layers.ui.children.at(-1)?.name()).toBe('hud');
  });

  it('removes everything it drew when destroyed', () => {
    hud.update(progress, 1);
    hud.destroy();
    expect(layers.ui.find('.hud')).toHaveLength(0);
  });
});

// Optional documentation
// - vi.useFakeTimers(): replaces setTimeout and the clock with fakes, so vi.advanceTimersByTime(ms) runs the tag's fade instantly.
// - layers.ui.find('.hud-progress'): a leading dot finds nodes by `name`, not by type.
// - findOne(...)!: the `!` tells TypeScript the node is there; the test fails anyway if it isn't.
// - expect.arrayContaining([...]): passes when the array has every listed item, in any order, along with anything else.
// - layers.ui.children.at(-1): the last child, which Konva draws on top of the others.
