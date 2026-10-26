import { describe, expect, it } from 'vitest';

/**
 * Checks that only `view/stage.ts` creates a Konva stage (issue #7: "nothing
 * else creates a stage"). Konva can't run outside a browser, so instead of
 * running the code, this reads every file in `src/` as text, removes the
 * comments, and lists the files that still contain `new Konva.Stage`. It passes
 * when that list is exactly `view/stage.ts`.
 */

const sources = import.meta.glob<string>('../../src/**/*.ts', { query: '?raw', import: 'default', eager: true });
// Appendix of relevant documentation
// - import.meta.glob<string>(pattern, { query: '?raw', import: 'default', eager: true }): a Vite feature that returns an object mapping each matching file's path to its contents as a string; `<string>` tells TypeScript the value type.

const COMMENTS = /\/\*[\s\S]*?\*\/|\/\/.*/g;
// Appendix of relevant documentation
// - /.../g: a regular expression (a text pattern). This one matches /* ... */ comments, even across lines, and // comments up to the end of the line; g means every match, not just the first.

describe('view/stage', () => {
  it('is the only place that creates a Konva stage', () => {
    const createsStage = (path: string) => sources[path].replace(COMMENTS, '').includes('new Konva.Stage');
    expect(Object.keys(sources).filter(createsStage)).toEqual(['../../src/view/stage.ts']);
  });
  // Appendix of relevant documentation
  // - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws.
  // - .replace(COMMENTS, ''): returns a copy of the text with every comment removed.
  // - .includes('new Konva.Stage'): true if the text contains those exact characters.
  // - Object.keys(sources): the object's property names as an array, here the file paths.
  // - .filter(createsStage): keeps the paths for which createsStage returns true.
  // - expect(value).toEqual(expected): throws, failing the test, unless the arrays have the same contents (toBe would check they are the same array object and always fail here).
});
// Appendix of relevant documentation
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
