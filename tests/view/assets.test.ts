import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Checks what screens rely on from view/assets: every listed file exists, a
 * loaded image or sound comes back by name, a file that fails, hangs or
 * was never listed gives a placeholder instead of crashing, and the loading
 * screen hears about every file as it finishes, including ones that fail or
 * hang, so its bar always reaches the end. Node has no
 * browser Image or Audio, so fake ones stand in: they "load" any file except
 * those in `failing`, and never answer for those in `hanging`.
 */

let failing: string[] = [];
let hanging: string[] = [];

class FakeMedia {
  onload: (() => void) | null = null;
  oncanplaythrough: (() => void) | null = null;
  onerror: (() => void) | null = null;
  preload = '';
  private source = '';
  get src() {
    return this.source;
  }
  set src(value: string) {
    this.source = value;
    if (hanging.some((file) => value.endsWith(file))) return;
    queueMicrotask(() => {
      if (failing.some((file) => value.endsWith(file))) this.onerror?.();
      else (this.onload ?? this.oncanplaythrough)?.();
    });
  }
}

// A fresh copy of the module for each test, so what one test loaded doesn't leak into the next.
const freshAssets = async () => {
  vi.resetModules();
  return import('../../src/view/assets');
};

const publicFiles = import.meta.glob('../../public/assets/**/*', { query: '?url' });

beforeEach(() => {
  failing = [];
  hanging = [];
  vi.stubGlobal('Image', FakeMedia);
  vi.stubGlobal('Audio', FakeMedia);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('view/assets', () => {
  it('lists only files that exist in public/assets', async () => {
    const { IMAGE_FILES, SOUND_FILES } = await freshAssets();
    for (const file of [...Object.values(IMAGE_FILES), ...Object.values(SOUND_FILES)]) {
      expect(Object.keys(publicFiles)).toContain(`../../public/assets/${file}`);
    }
  });

  it('gives back each loaded image by name', async () => {
    const { loadAssets, image } = await freshAssets();
    await loadAssets();
    expect(image('player').src).toMatch(/assets\/images\/player\.png$/);
    expect(image('friendWaving').src).toMatch(/assets\/images\/friend-waving\.png$/);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('has a loaded sound for every cue the game plays', async () => {
    const { loadAssets, sound } = await freshAssets();
    await loadAssets();
    const medalCues = ['medal-none', 'medal-bronze', 'medal-silver', 'medal-gold', 'medal-diamond'];
    for (const cue of ['fits', 'tooShort', 'tooLong', 'levelDone', 'medal', ...medalCues]) {
      expect(sound(cue).src).toMatch(/assets\/sounds\/[a-z-]+\.mp3$/);
    }
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('shows a placeholder when a file fails to load, and still loads the rest', async () => {
    failing = ['images/friend.png'];
    const { loadAssets, image } = await freshAssets();
    await expect(loadAssets()).resolves.toBeUndefined();
    expect(image('friend').src).toMatch(/^data:image\/svg\+xml/);
    expect(image('player').src).toMatch(/player\.png$/);
    expect(console.warn).toHaveBeenCalledOnce();
  });

  it('gives up on a file that never loads, so the game still starts', async () => {
    vi.useFakeTimers();
    hanging = ['images/player.png'];
    const { loadAssets, image } = await freshAssets();
    const loading = loadAssets();
    await vi.runAllTimersAsync();
    await loading;
    expect(image('player').src).toMatch(/^data:image\/svg\+xml/);
  });

  it('reports each file as it finishes, ending with every file counted', async () => {
    const { loadAssets, IMAGE_FILES, SOUND_FILES } = await freshAssets();
    const total = Object.keys(IMAGE_FILES).length + Object.keys(SOUND_FILES).length;
    const reports: [number, number][] = [];
    await loadAssets((loaded, total) => reports.push([loaded, total]));
    expect(reports.map(([loaded]) => loaded)).toEqual(Array.from({ length: total }, (_, i) => i + 1));
    expect(reports.every(([, reportedTotal]) => reportedTotal === total)).toBe(true);
  });

  it('counts a file that fails or hangs as finished, so the bar still reaches the end', async () => {
    vi.useFakeTimers();
    failing = ['images/friend.png'];
    hanging = ['images/player.png'];
    const { loadAssets, IMAGE_FILES, SOUND_FILES } = await freshAssets();
    const total = Object.keys(IMAGE_FILES).length + Object.keys(SOUND_FILES).length;
    const reports: [number, number][] = [];
    const loading = loadAssets((loaded, total) => reports.push([loaded, total]));
    await vi.advanceTimersByTimeAsync(0);
    // Everything but the hanging file has finished, the failed one included.
    expect(reports.at(-1)).toEqual([total - 1, total]);
    await vi.runAllTimersAsync();
    await loading;
    expect(reports.at(-1)).toEqual([total, total]);
  });

  it('gives a placeholder, not a crash, for a name that was never listed', async () => {
    const { loadAssets, image, sound } = await freshAssets();
    await loadAssets();
    expect(image('dragon').src).toMatch(/^data:image\/svg\+xml/);
    expect(sound('roar').src).toMatch(/^data:audio\/wav/);
    expect(console.warn).toHaveBeenCalledTimes(2);
  });

  it('never throws, even when asked before loading has finished', async () => {
    const { image, sound } = await freshAssets();
    expect(() => image('player')).not.toThrow();
    expect(() => sound('click')).not.toThrow();
  });
});

// Optional documentation
// - vi.stubGlobal('Image', FakeMedia): replaces the global `Image` for these tests; vi.unstubAllGlobals() puts it back.
// - get src / set src: a getter and setter, so assigning `img.src = ...` runs code, like a real browser starting a download.
// - queueMicrotask(fn): runs fn right after the current code finishes, so the fake answers asynchronously like a real file.
// - vi.resetModules() + import(...): loads a new copy of the module, with empty caches, instead of reusing the one already loaded.
// - import.meta.glob('...', { query: '?url' }): a Vite feature; its keys are the paths of every matching file, used here to check files exist.
// - vi.useFakeTimers() / vi.runAllTimersAsync(): makes setTimeout controllable, then jumps past the 10 second timeout instantly.
// - vi.advanceTimersByTimeAsync(0): lets every file that answers right away finish, without moving the fake clock, so the hanging one is still waiting.
// - Array.from({ length: total }, (_, i) => i + 1): the list 1, 2, … total; `_` is the unused first argument.
// - reports.every(...): true when the check holds for every item; `[, reportedTotal]` skips the first item of each pair.
// - reports.at(-1): the last report.
