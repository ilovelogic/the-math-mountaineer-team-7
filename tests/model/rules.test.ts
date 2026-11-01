import { describe, expect, it } from 'vitest';
import { settings } from '../../src/content/settings';
import { pointsFor } from '../../src/model/rules';

/**
 * Checks how many points each chasm pick earns (issue #37). `pointsFor` takes
 * the settings as an argument, so the first test passes in made-up settings:
 * if the points came from a hard-coded 10 instead of `settings`, it would fail.
 * The other tests check that both kinds of wrong pick earn nothing.
 */

describe('pointsFor', () => {
  it('awards the points in settings for the log that fits', () => {
    expect(pointsFor('fits', { pointsPerChasm: 7 })).toBe(7);
    expect(pointsFor('fits', settings)).toBe(settings.pointsPerChasm);
  });

  it('gives no points for a log that is too short', () => {
    expect(pointsFor('tooShort', settings)).toBe(0);
  });

  it('gives no points for a log that is too long', () => {
    expect(pointsFor('tooLong', settings)).toBe(0);
  });
});

// Optional documentation
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
// - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws.
// - expect(value).toBe(expected): throws, failing the test, unless the two values are exactly equal.
