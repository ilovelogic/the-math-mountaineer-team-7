import { describe, expect, it } from 'vitest';
import { makeChasm, makeDuelQuestion, triplesByLevel } from '../../src/model/problems';

/**
 * Checks issue #56: the duel question is one of Level 1's right triangles, the
 * same seed always gives the same question, and the two wrong answers are close
 * to the hypotenuse. Most checks run over seeds 0 to 199, enough to meet every
 * Level 1 triangle.
 */

const seeds = Array.from({ length: 200 }, (_, seed) => seed);
const questions = seeds.map(makeDuelQuestion);

describe('makeDuelQuestion', () => {
  it('gives the same question for the same seed', () => {
    expect(makeDuelQuestion(42)).toEqual(makeDuelQuestion(42));
  });

  it('only uses Level 1 triangles, and uses every one of them', () => {
    const level1 = new Set(triplesByLevel[0].map(([a, b, c]) => `${a},${b},${c}`));
    const used = new Set(questions.map((q) => `${q.a},${q.b},${q.c}`));
    expect(used).toEqual(level1);
  });

  it('makes c the hypotenuse of a and b', () => {
    for (const q of questions) {
      expect(q.a ** 2 + q.b ** 2).toBe(q.c ** 2);
    }
  });

  it('offers c, one shorter answer and one longer answer, each within 3', () => {
    for (const q of questions) {
      expect(q.options[q.correct]).toBe(q.c);
      const wrong = q.options.filter((option) => option !== q.c).sort((x, y) => x - y);
      expect(wrong).toHaveLength(2);
      expect(wrong[0]).toBeGreaterThan(0);
      expect(q.c - wrong[0]).toBeGreaterThanOrEqual(1);
      expect(q.c - wrong[0]).toBeLessThanOrEqual(3);
      expect(wrong[1] - q.c).toBeGreaterThanOrEqual(1);
      expect(wrong[1] - q.c).toBeLessThanOrEqual(3);
    }
  });

  it('puts the right answer in each of the three places', () => {
    expect(new Set(questions.map((q) => q.correct))).toEqual(new Set([0, 1, 2]));
  });

  it("doesn't copy the same Level 1 chasm every game", () => {
    // With the seed used as is, the duel would match Level 1's last chasm every
    // time. By chance alone it matches about 1 game in 5 (5 triangles).
    const matchesLast = seeds.filter((seed) => makeChasm(seed, 1, 4).c === makeDuelQuestion(seed).c);
    expect(matchesLast.length).toBeLessThan(seeds.length / 2);
  });

  it.each([-1, 1.5, NaN])('rejects the seed %s', (seed) => {
    expect(() => makeDuelQuestion(seed)).toThrow('Seed must be 0 or a positive integer');
  });
});

// Optional documentation
// - triplesByLevel[0]: Level 1's triangles, since the list starts at Level 1.
// - `${a},${b},${c}`: turns a triangle into text like "3,4,5", so a Set can compare triangles.
// - seeds.filter(...).length: how many seeds pass the check.
