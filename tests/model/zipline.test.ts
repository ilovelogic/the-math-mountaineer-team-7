import { describe, expect, it } from 'vitest';
import { checkZiplineAnswer, fillZiplineText, makeZiplineProblem, ziplineBoxes } from '../../src/model/zipline';

/**
 * Checks issue #62: the zipline problem is a box with a whole-number space
 * diagonal, the same seed always gives the same problem, and an answer is right
 * only when it's the diagonal. Most checks run over seeds 0 to 199, enough to
 * meet every box in `ziplineBoxes`.
 */

const seeds = Array.from({ length: 200 }, (_, seed) => seed);
const problems = seeds.map(makeZiplineProblem);

describe('ziplineBoxes', () => {
  it('only has boxes whose diagonal is a whole number that fits the sides', () => {
    for (const [width, height, length, diagonal] of ziplineBoxes) {
      expect(width ** 2 + height ** 2 + length ** 2).toBe(diagonal ** 2);
      expect(width).toBeLessThanOrEqual(height);
      expect(height).toBeLessThanOrEqual(length);
    }
  });
});

describe('makeZiplineProblem', () => {
  it('gives the same problem for the same seed', () => {
    expect(makeZiplineProblem(42)).toEqual(makeZiplineProblem(42));
  });

  it('uses every box, so different games get different stores', () => {
    const used = new Set(problems.map((p) => `${p.width},${p.height},${p.length}`));
    expect(used.size).toBe(ziplineBoxes.length);
  });

  it('makes the diagonal the square root of the sum of the sides squared', () => {
    for (const p of problems) {
      expect(Math.sqrt(p.length ** 2 + p.width ** 2 + p.height ** 2)).toBe(p.diagonal);
    }
  });

  it('offers the diagonal, one shorter guess and one longer guess, each within 3', () => {
    for (const p of problems) {
      expect(p.options[p.correct]).toBe(p.diagonal);
      const wrong = p.options.filter((option) => option !== p.diagonal).sort((x, y) => x - y);
      expect(wrong).toHaveLength(2);
      expect(p.diagonal - wrong[0]).toBeGreaterThanOrEqual(1);
      expect(p.diagonal - wrong[0]).toBeLessThanOrEqual(3);
      expect(wrong[1] - p.diagonal).toBeGreaterThanOrEqual(1);
      expect(wrong[1] - p.diagonal).toBeLessThanOrEqual(3);
    }
  });

  it('puts the right guess in each of the three places', () => {
    expect(new Set(problems.map((p) => p.correct))).toEqual(new Set([0, 1, 2]));
  });

  it.each([-1, 1.5, NaN])('rejects the seed %s', (seed) => {
    expect(() => makeZiplineProblem(seed)).toThrow('Seed must be 0 or a positive integer');
  });
});

describe('checkZiplineAnswer', () => {
  // The 3-4-12 store from the list, with its diagonal of 13 second.
  const problem = { length: 12, width: 3, height: 4, diagonal: 13, options: [11, 13, 15], correct: 1 };

  it('accepts only the diagonal', () => {
    expect([0, 1, 2].map((index) => checkZiplineAnswer(problem, index))).toEqual([false, true, false]);
  });

  it.each([-1, 3, 0.5])('rejects the answer index %s', (index) => {
    expect(() => checkZiplineAnswer(problem, index)).toThrow('Invalid answer index');
  });
});

describe('fillZiplineText', () => {
  const problem = { length: 12, width: 3, height: 4, diagonal: 13, options: [11, 13, 15], correct: 1 };

  it('puts in the sides, the floor’s diagonal squared, and the zip line squared and its length', () => {
    expect(fillZiplineText('{length} {width} {height} {floor} {squared} {diagonal}', problem)).toBe('12 3 4 153 169 13');
  });

  it('leaves text without a known name in braces as it is', () => {
    expect(fillZiplineText('x = {toString} or {nothing}, not {}', problem)).toBe('x = {toString} or {nothing}, not {}');
  });
});

// Optional documentation
// - Array.from({ length: 200 }, (_, seed) => seed): the list 0, 1, ..., 199; the `_` is the unused first argument.
// - seeds.map(makeZiplineProblem): one problem per seed, made once and shared by the tests.
// - x ** 2: x squared.
// - new Set(...): keeps one copy of each value, so its size counts the different ones.
// - it.each([...])('... %s', fn): runs the test once per value, putting the value into the test's name.
