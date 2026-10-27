import Konva from 'konva';
import { describe, expect, it } from 'vitest';

/**
 * Checks that Konva can draw in our tests, which view tests depend on. Konva
 * measures text with a canvas, so creating a text node and getting a real width
 * back shows the canvas from `tests/konva-setup.ts` is in place. Without it,
 * this fails before any component test gets a chance to.
 */

describe('Konva in tests', () => {
  it('measures text, so view tests can check what a component draws', () => {
    const label = new Konva.Text({ text: 'Start', fontSize: 16 });
    expect(label.width()).toBeGreaterThan(0);
  });
});

// Optional documentation
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
// - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws.
// - expect(value).toBeGreaterThan(0): throws, failing the test, unless the value is more than 0.
