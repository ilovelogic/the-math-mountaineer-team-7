import Konva from 'konva';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ownerProgressText } from '../../src/content/duelText';
import { settings } from '../../src/content/settings';
import { OwnerProgress, progressAt } from '../../src/view/OwnerProgress';

/**
 * Checks the store owner's race (#57): the pie fills over the set time, reports once
 * when it's full, and stops and disappears when the duel page or screen ends. Fake
 * timers drive Konva's animation frames, which in Node run on setTimeout and
 * performance.now, so a 30 s race takes no real time. Limit: it can't tell whether the
 * fill looks smooth, which still needs a look in the browser.
 */

const DURATION = 1000;

let layer: Konva.Layer;
let progress: OwnerProgress;

beforeEach(() => {
  // Konva reads the frame time from performance.now, which Vitest doesn't fake by default.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance', 'requestAnimationFrame', 'cancelAnimationFrame'] });
  layer = new Konva.Layer();
  progress = new OwnerProgress(layer, DURATION);
});

afterEach(() => {
  progress.stop();
  // Konva shares one frame loop across all animations; letting its last frame run
  // shuts it down, so the next test's animation starts a fresh loop on its own fake timers.
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

const panel = () => layer.findOne<Konva.Group>('.owner-progress');
const fillAngle = () => panel()!.findOne<Konva.Wedge>('.owner-progress-fill')!.angle();

describe('view/OwnerProgress', () => {
  it('draws nothing until it starts', () => {
    expect(panel()).toBeUndefined();
  });

  it('starts with an empty pie and the store owner’s label', () => {
    progress.start(() => {});
    expect(fillAngle()).toBe(0);
    const texts = panel()!.find<Konva.Text>('Text').map((node) => node.text());
    expect(texts).toEqual([ownerProgressText.name, ownerProgressText.status]);
  });

  it('fills the pie as the frames go by', () => {
    progress.start(() => {});
    vi.advanceTimersByTime(DURATION / 2);
    expect(fillAngle()).toBeGreaterThan(150);
    expect(fillAngle()).toBeLessThan(210);
  });

  it('reports once, with a full pie, when the store owner finishes', () => {
    const onFinish = vi.fn();
    progress.start(onFinish);
    vi.advanceTimersByTime(DURATION - 100);
    expect(onFinish).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(fillAngle()).toBe(360);

    vi.advanceTimersByTime(DURATION);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('never reports after it is stopped, and removes the panel', () => {
    const onFinish = vi.fn();
    progress.start(onFinish);
    vi.advanceTimersByTime(DURATION / 2);
    progress.stop();
    expect(panel()).toBeUndefined();

    vi.advanceTimersByTime(DURATION * 2);
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('can be stopped from inside onFinish, as DuelShopController does', () => {
    progress.start(() => progress.stop());
    vi.advanceTimersByTime(DURATION * 2);
    expect(panel()).toBeUndefined();
  });

  it('is safe to stop before it starts, and twice', () => {
    expect(() => {
      progress.stop();
      progress.stop();
    }).not.toThrow();
  });

  it('restarts the race from empty when started again', () => {
    const first = vi.fn();
    const second = vi.fn();
    progress.start(first);
    vi.advanceTimersByTime(DURATION / 2);
    progress.start(second);
    expect(layer.find('.owner-progress')).toHaveLength(1);
    expect(fillAngle()).toBe(0);

    vi.advanceTimersByTime(DURATION * 2);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('takes the store owner’s time from settings by default', () => {
    const onFinish = vi.fn();
    const race = new OwnerProgress(layer);
    race.start(onFinish);
    vi.advanceTimersByTime(settings.ownerSolveMs - 100);
    expect(onFinish).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(onFinish).toHaveBeenCalledTimes(1);
    race.stop();
  });
});

describe('progressAt', () => {
  it('goes from 0 to 1 over the duration and stays within those bounds', () => {
    expect(progressAt(0, 1000)).toBe(0);
    expect(progressAt(250, 1000)).toBe(0.25);
    expect(progressAt(1000, 1000)).toBe(1);
    expect(progressAt(5000, 1000)).toBe(1);
    expect(progressAt(-10, 1000)).toBe(0);
  });

  it('is full right away when the duration is 0 or less', () => {
    expect(progressAt(0, 0)).toBe(1);
    expect(progressAt(0, -5)).toBe(1);
  });
});
// Optional documentation
// - vi.advanceTimersByTime(ms): moves the fake clock forward, running every timer that falls due, including Konva's frame timers.
// - vi.fn(): a stand-in function that records its calls, so a test can check how many times it ran.
