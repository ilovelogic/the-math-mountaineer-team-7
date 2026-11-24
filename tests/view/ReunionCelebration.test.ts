import Konva from 'konva';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeRng } from '../../src/model/problems';
import {
  CLOSE_UP_GROUND,
  CONFETTI_BOTTOM,
  CONFETTI_TOP,
  fallenY,
  HEART_CYCLE_MS,
  heartProgress,
  HOP,
  hopHeight,
  ReunionCelebration,
} from '../../src/view/ReunionCelebration';
import { standInLoadedImages } from '../standInImage';

/**
 * Checks the reunion's celebration (#204): the friend hops, two hearts float up, and confetti
 * falls in two sizes, until the scene ends. The hop, the hearts and the confetti are placed by
 * plain functions of the elapsed time, so most tests call those with chosen times, including
 * both edges of the hop and the point where confetti wraps back to the top. The rest draw the
 * celebration on a bare layer behind a stand-in mountaineer, with Konva's frame clock faked as
 * in tests/view/OwnerProgress.test.ts, and read where each shape is after time passes.
 * Limits: Konva's frames land every 16 ms or so, so timed checks avoid the exact edges, and
 * the stand-in pictures can't show whether the scene looks like its mockup, which needs a
 * look with `npm run dev`.
 */

const FRIEND_HEIGHT = 130;

let layer: Konva.Layer;
let mountaineer: Konva.Image;
let celebration: ReunionCelebration | null;

beforeEach(() => {
  // Konva reads the frame time from performance.now, which Vitest doesn't fake by default.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance', 'requestAnimationFrame', 'cancelAnimationFrame'] });
  standInLoadedImages();
  layer = new Konva.Layer();
  mountaineer = new Konva.Image({ image: new Image() });
  layer.add(mountaineer);
  celebration = null;
});

afterEach(() => {
  celebration?.destroy();
  // Konva shares one frame loop across all animations; letting its last frame run
  // shuts it down, so the next test's animation starts a fresh loop on its own fake timers.
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const celebrate = () => (celebration = new ReunionCelebration(layer, makeRng(204)));
const friend = () => layer.findOne<Konva.Image>('.reunion-friend')!;
const confetti = () => layer.find<Konva.Rect>('.reunion-confetti');
const hearts = () => layer.find<Konva.Group>('.reunion-heart');

describe('hopHeight', () => {
  it('starts on the snow and lands back on it', () => {
    expect(hopHeight(0)).toBe(0);
    expect(hopHeight(HOP.airMs)).toBe(0);
  });

  it('reaches the full height halfway through the hop', () => {
    expect(hopHeight(HOP.airMs / 2)).toBeCloseTo(HOP.height);
  });

  it('rests on the snow between hops, then hops again the same way', () => {
    expect(hopHeight(HOP.airMs + 1)).toBe(0);
    expect(hopHeight(HOP.cycleMs - 1)).toBe(0);
    expect(hopHeight(3 * HOP.cycleMs + 120)).toBeCloseTo(hopHeight(120));
  });

  it('never goes below the snow or above the full height', () => {
    for (let ms = 0; ms < 5 * HOP.cycleMs; ms += 7) {
      expect(hopHeight(ms), `at ${ms} ms`).toBeGreaterThanOrEqual(0);
      expect(hopHeight(ms), `at ${ms} ms`).toBeLessThanOrEqual(HOP.height);
    }
  });
});

describe('heartProgress', () => {
  it('goes from 0 to just under 1 over one cycle, then starts again', () => {
    expect(heartProgress(0)).toBe(0);
    expect(heartProgress(HEART_CYCLE_MS / 2)).toBe(0.5);
    expect(heartProgress(HEART_CYCLE_MS - 1)).toBeLessThan(1);
    expect(heartProgress(HEART_CYCLE_MS)).toBe(0);
  });
});

describe('fallenY', () => {
  it('falls `speed` px every second', () => {
    expect(fallenY(100, 50, 1000)).toBe(150);
    expect(fallenY(100, 50, 0)).toBe(100);
  });

  it('comes back in at the top once it passes the snow', () => {
    expect(fallenY(CONFETTI_BOTTOM - 10, 20, 1000)).toBe(CONFETTI_TOP + 10);
  });

  it('always stays between the top bar and the snow', () => {
    const random = makeRng(7);
    for (let run = 0; run < 500; run++) {
      const startY = CONFETTI_TOP + random() * (CONFETTI_BOTTOM - CONFETTI_TOP);
      const y = fallenY(startY, 40 + random() * 100, random() * 600_000);
      expect(y).toBeGreaterThanOrEqual(CONFETTI_TOP);
      expect(y).toBeLessThan(CONFETTI_BOTTOM);
    }
  });
});

describe('ReunionCelebration', () => {
  it('draws the friend standing on the close-up’s snow, two hearts, and 80 small and 12 large pieces of confetti', () => {
    celebrate();
    expect(friend().y()).toBe(CLOSE_UP_GROUND - FRIEND_HEIGHT);
    expect(hearts()).toHaveLength(2);
    const sizes = confetti().map((piece) => piece.width());
    expect(sizes.filter((size) => size === 6)).toHaveLength(80);
    expect(sizes.filter((size) => size === 12)).toHaveLength(12);
  });

  it('only asks view/assets for pictures it has', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    celebrate();
    expect(warn).not.toHaveBeenCalled();
  });

  it('puts the small confetti behind the mountaineer, and the friend, hearts and large confetti in front', () => {
    celebrate();
    const behind = confetti().find((piece) => piece.width() === 6)!.getParent()!;
    const inFront = friend().getParent()!;
    expect(behind.zIndex()).toBeLessThan(mountaineer.zIndex());
    expect(mountaineer.zIndex()).toBeLessThan(inFront.zIndex());
    expect(hearts().every((heart) => heart.getParent() === inFront)).toBe(true);
  });

  it('hops the friend off the snow, then lands them again', () => {
    celebrate();
    vi.advanceTimersByTime(HOP.airMs / 2);
    expect(friend().y()).toBeLessThan(CLOSE_UP_GROUND - FRIEND_HEIGHT - HOP.height / 2);
    vi.advanceTimersByTime(HOP.airMs / 2 + 100);
    expect(friend().y()).toBe(CLOSE_UP_GROUND - FRIEND_HEIGHT);
  });

  it('floats the hearts up while they fade in', () => {
    celebrate();
    const startY = hearts()[0].y();
    vi.advanceTimersByTime(HEART_CYCLE_MS / 4);
    expect(hearts()[0].y()).toBeLessThan(startY);
    expect(hearts()[0].opacity()).toBeGreaterThan(0);
    expect(hearts()[0].opacity()).toBeLessThan(1);
  });

  it('keeps the confetti falling', () => {
    celebrate();
    const before = confetti().map((piece) => piece.y());
    vi.advanceTimersByTime(500);
    const after = confetti().map((piece) => piece.y());
    expect(after.filter((y, i) => y !== before[i])).toHaveLength(before.length);
  });

  it('removes everything it drew and stops redrawing the layer when destroyed', () => {
    celebrate().destroy();
    expect(layer.getChildren()).toEqual([mountaineer]);
    const redraw = vi.spyOn(layer, 'batchDraw');
    vi.advanceTimersByTime(500);
    expect(redraw).not.toHaveBeenCalled();
  });
});

// Optional documentation
// - describe(name, fn): groups related tests under a heading in the test output.
// - it(name, fn): registers one test, which fails if anything inside fn throws.
// - expect(value).toBe(expected): passes if the two are the same value.
// - beforeEach(fn) / afterEach(fn): run fn before and after every test, so each one starts with a fresh layer and fake clock.
// - vi.useFakeTimers({ toFake: [...] }): swaps the listed timers and clocks for fakes that only move when the test moves them; Konva's frames use requestAnimationFrame and performance.
// - standInLoadedImages(): Node has no browser Image, so this gives the code an already-loaded 1 × 1 picture to draw (see tests/standInImage.ts).
// - vi.runOnlyPendingTimers() / vi.useRealTimers(): runs the timers already waiting, then puts the real clock back.
// - vi.restoreAllMocks(): undoes every vi.spyOn, so console.warn and batchDraw work normally in the next test.
// - makeRng(204): the project's seeded random source from model/problems, so the confetti lands in the same places every run.
// - layer.findOne<Konva.Image>('.reunion-friend')!: the first node with that name; `!` tells TypeScript one is there.
// - layer.find<Konva.Rect>('.reunion-confetti'): every node with that name, in the order they were added.
// - expect(value).toBeCloseTo(expected): passes if the numbers match to about two decimal places, which allows for rounding in Math.sin.
// - expect(value, message): the message names the time that failed, so a failure points at it.
// - toBeGreaterThanOrEqual / toBeLessThanOrEqual / toBeLessThan / toBeGreaterThan: compare numbers.
// - 600_000: the underscore only makes the number easier to read; it's 600000 ms, ten minutes.
// - toHaveLength(n): passes if the list has exactly n items.
// - vi.spyOn(console, 'warn').mockImplementation(() => {}): records every call to console.warn and keeps it quiet; view/assets warns when asked for a name it doesn't list.
// - expect(spy).not.toHaveBeenCalled(): passes if the spied function was never called.
// - piece.getParent()!: the group the node was added to.
// - zIndex(): the node's position among its layer's children, where higher draws on top.
// - list.every((item) => ...): true only if the check is true for every item.
// - vi.advanceTimersByTime(ms): moves the fake clock forward, running every frame due in that time.
// - toEqual([mountaineer]): passes if the list has the same items, here just the stand-in mountaineer.
// - vi.spyOn(layer, 'batchDraw'): records each time the layer is asked to redraw, which a running Konva.Animation does every frame.
