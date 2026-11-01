import { describe, expect, it } from 'vitest';
import { fitScale, STAGE_HEIGHT, STAGE_WIDTH } from '../../src/view/stage';

/**
 * Checks two things about view/stage.
 *
 * First, that only `view/stage.ts` creates a Konva stage (issue #7: "nothing
 * else creates a stage"). Konva can't run outside a browser, so instead of
 * running the code, this reads every file in `src/` as text, removes the
 * comments, and lists the files that still contain `new Konva.Stage`. It passes
 * when that list is exactly `view/stage.ts`.
 *
 * Second, that `fitScale` picks the largest 16:9 box that fits the window
 * (issue #140). It's a pure function, so the tests call it with window sizes
 * and compare the scale it returns: a few sizes worked out by hand, then a grid
 * of many sizes checked against the rule itself (the box fits, and touches at
 * least one edge). Limits: `createStage` and the resize listener need a real
 * DOM, so these tests don't check that `fitToWindow` is called or that the
 * canvas changes size; that still needs a check in the browser.
 */

const sources = import.meta.glob<string>('../../src/**/*.ts', { query: '?raw', import: 'default', eager: true });
const COMMENTS = /\/\*[\s\S]*?\*\/|\/\/.*/g;

describe('view/stage', () => {
  it('is the only place that creates a Konva stage', () => {
    const createsStage = (path: string) => sources[path].replace(COMMENTS, '').includes('new Konva.Stage');
    expect(Object.keys(sources).filter(createsStage)).toEqual(['../../src/view/stage.ts']);
  });
});

describe('fitScale', () => {
  it('doubles the stage on a 1920×1080 window, which is exactly 16:9', () => {
    expect(fitScale(1920, 1080)).toBe(2);
  });

  it('leaves the stage at its own size on a 960×540 window', () => {
    expect(fitScale(960, 540)).toBe(1);
  });

  it('lets the height decide on a window wider than 16:9', () => {
    expect(fitScale(1920, 540)).toBe(1);
  });

  it('lets the width decide on a window taller than 16:9', () => {
    expect(fitScale(960, 1080)).toBe(1);
  });

  it('shrinks the stage on a window smaller than 960×540', () => {
    expect(fitScale(480, 270)).toBe(0.5);
  });

  it('handles a common laptop size that is almost, but not exactly, 16:9', () => {
    // 1366 / 960 is about 1.4229 and 768 / 540 is about 1.4222, so the height decides.
    expect(fitScale(1366, 768)).toBeCloseTo(768 / 540, 10);
  });

  it('always fits inside the window and touches at least one edge', () => {
    // A rounding allowance far smaller than a pixel, since the division isn't exact.
    const EPSILON = 1e-9;
    for (let width = 100; width <= 4000; width += 77) {
      for (let height = 100; height <= 4000; height += 83) {
        const scale = fitScale(width, height);
        const boxWidth = STAGE_WIDTH * scale;
        const boxHeight = STAGE_HEIGHT * scale;
        const size = `${width}×${height}`;
        expect(boxWidth <= width + EPSILON, `box too wide for ${size}`).toBe(true);
        expect(boxHeight <= height + EPSILON, `box too tall for ${size}`).toBe(true);
        const touchesEdge = Math.abs(boxWidth - width) < EPSILON || Math.abs(boxHeight - height) < EPSILON;
        expect(touchesEdge, `box touches no edge for ${size}`).toBe(true);
      }
    }
  });

  it('gives 0 for a window with no width, which the next resize corrects', () => {
    // A browser can report 0 for a moment, such as while a hidden tab is restored.
    // The stage briefly has no size, then the next resize event calls fitScale again.
    expect(fitScale(0, 1080)).toBe(0);
    expect(fitScale(1920, 1080)).toBe(2);
  });
});

// Optional documentation
// - import.meta.glob<string>(pattern, { query: '?raw', import: 'default', eager: true }): a Vite feature that returns an object mapping each matching file's path to its contents as a string; `<string>` tells TypeScript the value type.
// - /.../g: a regular expression (a text pattern). This one matches /* ... */ comments, even across lines, and // comments up to the end of the line; g means every match, not just the first.
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
// - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws.
// - .replace(COMMENTS, ''): returns a copy of the text with every comment removed.
// - .includes('new Konva.Stage'): true if the text contains those exact characters.
// - Object.keys(sources): the object's property names as an array, here the file paths.
// - .filter(createsStage): keeps the paths for which createsStage returns true.
// - expect(value).toEqual(expected): throws, failing the test, unless the arrays have the same contents (toBe would check they are the same array object and always fail here).
// - expect(value).toBe(expected): throws unless the two values are exactly equal; safe for these scales because each division comes out exact.
// - expect(value).toBeCloseTo(expected, 10): passes if the numbers match to 10 decimal places, for results a division can't give exactly.
// - 1e-9: 0.000000001, written in scientific notation.
// - expect(value, message): the message is shown if the check fails, here naming the window size that broke the rule.
// - `${width}×${height}`: a template string; the values inside ${ } are inserted into the text.
// - Math.abs(x): x without its sign, so the check works whichever of the two numbers is bigger.
