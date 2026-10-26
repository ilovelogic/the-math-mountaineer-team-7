import { describe, expect, it } from 'vitest';

// Konva can't load without a browser, so this reads the source files as text.
const sources = import.meta.glob<string>('../../src/**/*.ts', { query: '?raw', import: 'default', eager: true });

describe('view/stage', () => {
  it('is the only place that creates a Konva stage', () => {
    const creators = Object.keys(sources).filter((path) => sources[path].includes('new Konva.Stage'));
    expect(creators).toEqual(['../../src/view/stage.ts']);
  });
});
