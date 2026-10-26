import { describe, expect, it } from 'vitest';

/**
 * Checks that only `view/stage.ts` creates a Konva stage (issue #7: "nothing
 * else creates a stage"). Konva can't run outside a browser, so instead of
 * running the code, this reads every file in `src/` as text and lists the ones
 * containing `new Konva.Stage`. It passes when that list is exactly
 * `view/stage.ts`. Limit: it matches text, so the phrase in a comment counts
 * too.
 */

const sources = import.meta.glob<string>('../../src/**/*.ts', { query: '?raw', import: 'default', eager: true });
// Appendix of relevant documentation
// - import.meta.glob<string>(pattern, { query: '?raw', import: 'default', eager: true }): a Vite feature that returns an object mapping each matching file's path to its contents as a string; `<string>` tells TypeScript the value type.

describe('view/stage', () => {
  it('is the only place that creates a Konva stage', () => {
    const creators = Object.keys(sources).filter((path) => sources[path].includes('new Konva.Stage'));
    expect(creators).toEqual(['../../src/view/stage.ts']);
  });
  // Appendix of relevant documentation
  // - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws.
  // - Object.keys(sources): the object's property names as an array, here the file paths.
  // - .filter((path) => ...): calls the function once per path and keeps the paths where it returns true.
  // - .includes('new Konva.Stage'): true if the file's text contains those exact characters.
  // - expect(value): wraps a value so a check can be run on it, such as toEqual below.
  // - toEqual: throws (failing the test) unless the arrays have the same contents; toBe would check they are the same array object and always fail here.
});
// Appendix of relevant documentation
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
