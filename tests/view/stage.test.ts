import { describe, expect, it } from 'vitest';

// Konva can't load without a browser, so this reads the source files as text.
const sources = import.meta.glob<string>('../../src/**/*.ts', { query: '?raw', import: 'default', eager: true });
// Appendix of relevant documentation
// - import.meta.glob<string>(pattern, { query: '?raw', import: 'default', eager: true }): a Vite feature that returns an object mapping each matching file's path to its contents as a string; `<string>` tells TypeScript the value type.

describe('view/stage', () => {
  it('is the only place that creates a Konva stage', () => {
    const creators = Object.keys(sources).filter((path) => sources[path].includes('new Konva.Stage'));
    expect(creators).toEqual(['../../src/view/stage.ts']);
  });
  // Appendix of relevant documentation
  // - Object.keys(sources): the object's property names as an array, here the file paths.
  // - toEqual: compares the arrays' contents; toBe would check they are the same array object and always fail here.
});
