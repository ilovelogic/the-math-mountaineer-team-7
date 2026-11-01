import { describe, expect, it } from 'vitest';
import { colors, text } from '../../src/view/theme';

/**
 * Checks the two rules a typo in `view/theme.ts` could quietly break: every
 * color is a full six-digit hex code, which is what Konva expects, and every
 * text style is at least 16 px, which Story 4 requires so text stays readable
 * on a school Chromebook. Each test goes through every entry, so a new color or
 * style is checked too.
 */

describe('view/theme', () => {
  it('uses six-digit hex codes for every color', () => {
    for (const [name, hex] of Object.entries(colors)) {
      expect(hex, name).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it('keeps every text style at 16 px or larger', () => {
    for (const [name, style] of Object.entries(text)) {
      expect(style.fontSize, name).toBeGreaterThanOrEqual(16);
    }
  });
});

// Optional documentation
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
// - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws.
// - for (const [name, hex] of Object.entries(colors)): loops over the object's properties; each turn gives one [property name, value] pair, split into two variables.
// - expect(value, name): wraps a value so a check can run on it; `name` is printed if the check fails, so you can see which color or style broke.
// - toMatch(/^#[0-9A-F]{6}$/): passes only if the whole string is # followed by exactly six digits or capital letters A to F.
// - toBeGreaterThanOrEqual(16): passes when the value is 16 or more.
