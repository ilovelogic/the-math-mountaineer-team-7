import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { settings } from '../../src/content/settings';
import { showWhileSlow } from '../../src/controller/loading';
import type { LoadingScreen } from '../../src/view/loadingScreen';

/**
 * Checks the loading screen's timing (#129): a load that finishes before the delay never
 * shows it, a load still going at the delay shows it (both sides of that boundary), the bar
 * starts from the files already finished and follows the rest, the screen comes down once
 * loading ends, and nothing is drawn before the font is ready. The load, the screen and the
 * font are stand-ins the test finishes by hand, and fake timers move the clock, so no
 * browser, Konva or real waiting is needed. How the screen looks is tests/view/loadingScreen.test.ts.
 */

const DELAY = settings.loadingScreenDelayMs;

/** A load the test controls: `report` sends progress, and `finish` ends it. */
function standInLoad() {
  let onProgress: (loaded: number, total: number) => void = () => {};
  let finish: () => void = () => {};
  const load = (cb: (loaded: number, total: number) => void) => {
    onProgress = cb;
    return new Promise<void>((resolve) => (finish = resolve));
  };
  return { load, report: (loaded: number, total: number) => onProgress(loaded, total), finish: () => finish() };
}

/** A stand-in loading screen that records the bar's progress and whether it was removed. */
function standInScreen() {
  const screen = { shown: 0, bars: [] as [number, number][], removed: false };
  const show = (): LoadingScreen => {
    screen.shown++;
    return {
      progress: (loaded, total) => screen.bars.push([loaded, total]),
      remove: () => (screen.removed = true),
    };
  };
  return { screen, show };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('showWhileSlow', () => {
  it('never shows the screen for a load that finishes just before the delay', async () => {
    const { load, finish } = standInLoad();
    const { screen, show } = standInScreen();
    const done = showWhileSlow(load, show, DELAY, Promise.resolve());
    await vi.advanceTimersByTimeAsync(DELAY - 1);
    finish();
    await done;
    await vi.runAllTimersAsync();
    expect(screen.shown).toBe(0);
  });

  it('shows the screen for a load still going at the delay, and removes it when loading ends', async () => {
    const { load, finish } = standInLoad();
    const { screen, show } = standInScreen();
    const done = showWhileSlow(load, show, DELAY, Promise.resolve());
    await vi.advanceTimersByTimeAsync(DELAY);
    expect(screen.shown).toBe(1);
    expect(screen.removed).toBe(false);
    finish();
    await done;
    expect(screen.removed).toBe(true);
  });

  it('starts the bar at the files already finished, then follows the rest', async () => {
    const { load, report, finish } = standInLoad();
    const { screen, show } = standInScreen();
    const done = showWhileSlow(load, show, DELAY, Promise.resolve());
    report(1, 4);
    report(2, 4);
    await vi.advanceTimersByTimeAsync(DELAY);
    report(3, 4);
    report(4, 4);
    finish();
    await done;
    expect(screen.bars).toEqual([[2, 4], [3, 4], [4, 4]]);
  });

  it('waits for the font before drawing, and draws nothing if loading ends first', async () => {
    const { load, finish } = standInLoad();
    const { screen, show } = standInScreen();
    let fontArrives: () => void = () => {};
    const font = new Promise<void>((resolve) => (fontArrives = resolve));
    const done = showWhileSlow(load, show, DELAY, font);
    await vi.advanceTimersByTimeAsync(DELAY * 2);
    expect(screen.shown).toBe(0);
    finish();
    await done;
    fontArrives();
    await vi.runAllTimersAsync();
    expect(screen.shown).toBe(0);
  });

  it('draws once the font arrives, if loading is still going', async () => {
    const { load, finish } = standInLoad();
    const { screen, show } = standInScreen();
    let fontArrives: () => void = () => {};
    const font = new Promise<void>((resolve) => (fontArrives = resolve));
    const done = showWhileSlow(load, show, DELAY, font);
    await vi.advanceTimersByTimeAsync(DELAY);
    fontArrives();
    await vi.advanceTimersByTimeAsync(0);
    expect(screen.shown).toBe(1);
    finish();
    await done;
    expect(screen.removed).toBe(true);
  });
});

// Optional documentation
// - new Promise<void>((resolve) => (finish = resolve)): a promise the test finishes itself by calling finish(), standing in for files arriving.
// - [] as [number, number][]: tells TypeScript the empty list will hold pairs of numbers.
// - vi.useFakeTimers() / vi.useRealTimers(): swaps setTimeout for a fake clock the test moves by hand, then puts the real one back.
// - vi.advanceTimersByTimeAsync(ms): moves the fake clock forward by ms, running any timers that come due and letting promises settle.
// - vi.runAllTimersAsync(): runs every timer still waiting, so a test can check that a late one does nothing.
// - beforeEach(fn) / afterEach(fn): run fn before or after every test in the file.
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
// - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws.
// - expect(value).toBe(expected): throws, failing the test, unless the two values are exactly equal.
// - expect(value).toEqual(expected): passes when the two values have the same contents, even if they're different arrays.
