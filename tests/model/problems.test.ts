import { describe, it, expect } from 'vitest';
import { makeChasm, solutionSteps } from '../../src/model/problems';
import { checkPick } from '../../src/model/problems';
import { triplesByLevel } from '../../src/model/problems';
import { answerChoices, makeDuelQuestion, makeRng } from '../../src/model/problems';

/**
 * Checks the chasms, the shared answer choices and the duel question. The
 * generated ones are checked over many seeds, since a seed fixes every random
 * number. The answer-choice checks (issue #168) count how often the right answer
 * is the smallest, middle and largest of the three, which catches the old
 * pattern where it was always the middle. Limit: they run a fixed set of seeds,
 * so they show how the answers spread over those seeds, not over every game.
 */

describe('makeChasm', () => {
    it('should always have exactly one fitting log', () => {
    for (let level = 1; level <= 3; level++) {
        for (let seed = 0; seed < 100; seed++) {
            const chasm = makeChasm(seed, level, 0);

            const fittingLogs = chasm.logs.filter(
                log => log === chasm.c
            );

            expect(fittingLogs.length).toBe(1);
            expect(chasm.logs[chasm.correct]).toBe(chasm.c);
            console.log(chasm.logs, 'C:', chasm.c, 'Level:', level)
        }
    }

    });

    it('should return same chasm for the same inputs', () => {
        const first = makeChasm(42, 1, 0);
        const second = makeChasm(42, 1, 0);

        expect(first).toEqual(second);
    })

    it('should not repeat triples in the same level', () => {
        const seeds = Array.from({ length: 2000 }, (_, i) => i);
        
        for (const seed of seeds) {
            for (let level = 1; level <= 3; level++) {
                const seen = new Set<string>();

                for (let index = 0; index < triplesByLevel[level - 1].length; index++) {
                    const chasm = makeChasm(seed, level, index);
                    const tripleKey = `${chasm.a},${chasm.b},${chasm.c}`;

                    expect(seen.has(tripleKey)).toBe(false);
                    seen.add(tripleKey);
                }
            }
        }
    });

    it('should generate three different log lengths within a triple', () => {
        const chasm = makeChasm(42, 1, 0);
        const uniqueLogs = new Set(chasm.logs);

        expect(uniqueLogs.size).toBe(3);
    });

    it('should generate only positive log lengths within a triple', () => {
        const chasm = makeChasm(42, 1, 0);

        for(const log of chasm.logs) {
            expect(log).toBeGreaterThan(0);
        }
    });

    // #197: a wrong log shorter than the longer leg, or as long as both legs
    // together, can be ruled out without doing the math.
    it('makes every wrong log longer than the longer leg and shorter than a + b, over many seeds', () => {
        for (let seed = 0; seed < 1000; seed++) {
            for (let level = 1; level <= 3; level++) {
                for (let index = 0; index < triplesByLevel[level - 1].length; index++) {
                    const { a, b, c, logs } = makeChasm(seed, level, index);
                    const wrong = logs.filter((log) => log !== c);

                    expect(wrong).toHaveLength(2);
                    for (const log of wrong) {
                        expect(log).toBeGreaterThan(Math.max(a, b));
                        expect(log).toBeLessThan(a + b);
                    }
                }
            }
        }
    });

    it('uses a half-meter wrong log only when too few whole lengths fit, and at most one', () => {
        for (let seed = 0; seed < 1000; seed++) {
            for (let level = 1; level <= 3; level++) {
                for (let index = 0; index < triplesByLevel[level - 1].length; index++) {
                    const { a, b, logs } = makeChasm(seed, level, index);
                    const halves = logs.filter((log) => !Number.isInteger(log));
                    const wholeWrongsThatFit = a + b - Math.max(a, b) - 2; // whole numbers strictly between, minus c

                    expect(halves.length).toBe(wholeWrongsThatFit >= 2 ? 0 : 2 - wholeWrongsThatFit);
                    expect(halves.length).toBeLessThanOrEqual(1);
                    for (const log of halves) {
                        expect(Number.isInteger(log * 2)).toBe(true);
                    }
                }
            }
        }
    });

    it('offers 5 m, 6 m and a half-meter log for the 3-4-5 gap', () => {
        const index = (seed: number) => [0, 1, 2, 3, 4].find((i) => makeChasm(seed, 1, i).c === 5)!;
        const halfLogs = new Set<number>();
        for (let seed = 0; seed < 200; seed++) {
            const logs = [...makeChasm(seed, 1, index(seed)).logs].sort((x, y) => x - y);
            expect(logs).toContain(5);
            expect(logs).toContain(6);
            logs.filter((log) => !Number.isInteger(log)).forEach((log) => halfLogs.add(log));
        }
        expect(halfLogs).toEqual(new Set([4.5, 5.5, 6.5]));
    });

    it('should vary the correct log position across chasms and seeds', () => {
        let samePositionCount = 0;
    
        for (let seed = 0; seed < 200; seed++) {
            for (let level = 1; level <= 3; level++) {
                const positions = new Set<number>();

                for (let index = 0; index < triplesByLevel[level - 1].length; index++) {
                    const chasm = makeChasm(seed, level, index);
                    positions.add(chasm.correct);
                }

                if (positions.size === 1) {
                    samePositionCount++;
                }
            }
        }
        expect(samePositionCount).toBeLessThan(30);
    });

});

describe('checkPick', () =>  {
    const chasm = {
        a: 3,
        b: 4,
        c: 5,
        logs: [6,5,4],
        correct: 1,
    }; 
    it("should return tooLong", () => {
        const picked = checkPick(chasm, 0);
        expect(picked).toBe("tooLong");
    });
    it("should return tooShort", () => {
        const picked = checkPick(chasm, 2);
        expect(picked).toBe("tooShort");
    });
    it("should return fits", () => {
        const picked = checkPick(chasm, 1);
        expect(picked).toBe("fits");
    });
    it("should throw an error for an invalid log index", () => {
        expect(() => checkPick(chasm, 3)).toThrow("Invalid log index");
    });


});

describe('answerChoices', () => {
    const seeds = Array.from({ length: 3000 }, (_, seed) => seed);
    const choiceSets = seeds.map((seed) => answerChoices(makeRng(seed), 10, 3));
    // 0 means the right answer is the smallest, 1 the middle and 2 the largest.
    const placeOfRight = (options: number[]) => options.filter((option) => option < 10).length;

    it('gives the same answers for the same random numbers', () => {
        expect(answerChoices(makeRng(7), 10, 3)).toEqual(answerChoices(makeRng(7), 10, 3));
    });

    it('offers the right answer once and two different wrong answers, each within maxMiss', () => {
        for (const options of choiceSets) {
            expect(options.filter((option) => option === 10)).toHaveLength(1);
            expect(new Set(options).size).toBe(3);
            for (const option of options) {
                expect(Math.abs(option - 10)).toBeLessThanOrEqual(3);
            }
        }
    });

    it('makes the right answer the smallest, middle and largest about a third of the time each', () => {
        for (const place of [0, 1, 2]) {
            const share = choiceSets.filter((options) => placeOfRight(options) === place).length / seeds.length;
            expect(share).toBeGreaterThan(0.28);
            expect(share).toBeLessThan(0.39);
        }
    });

    describe('with bounds', () => {
        it('keeps every answer strictly between the bounds, over many seeds', () => {
            for (const seed of seeds) {
                const options = answerChoices(makeRng(seed), 10, 3, { above: 8, below: 14 });
                expect(options).toContain(10);
                expect(new Set(options).size).toBe(3);
                for (const option of options) {
                    expect(option).toBeGreaterThan(8);
                    expect(option).toBeLessThan(14);
                    expect(Math.abs(option - 10)).toBeLessThanOrEqual(3);
                }
            }
        });

        it('still spreads the right answer over every place the bounds leave room for', () => {
            // Only 9 fits below 10, so 10 can be the smallest or the middle, never the largest.
            const places = seeds.map((seed) => answerChoices(makeRng(seed), 10, 3, { above: 8, below: 14 }))
                .map((options) => options.filter((option) => option < 10).length);
            expect(new Set(places)).toEqual(new Set([0, 1]));
            for (const place of [0, 1]) {
                const share = places.filter((p) => p === place).length / seeds.length;
                expect(share).toBeGreaterThan(0.44);
                expect(share).toBeLessThan(0.56);
            }
        });

        it('makes up the rest with one half answer when only one whole wrong answer fits, as for 3-4-5', () => {
            for (const seed of seeds) {
                const options = answerChoices(makeRng(seed), 5, 3, { above: 4, below: 7 });
                expect(options).toContain(5);
                expect(options).toContain(6);
                expect(options.filter((option) => !Number.isInteger(option))).toHaveLength(1);
                for (const option of options) {
                    expect(option).toBeGreaterThan(4);
                    expect(option).toBeLessThan(7);
                }
            }
        });
    });
});

describe('makeDuelQuestion', () => {
    const seeds = Array.from({ length: 200 }, (_, seed) => seed);
    const questions = seeds.map(makeDuelQuestion);

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

    it('offers c and two different positive wrong answers, each within 3', () => {
        for (const q of questions) {
            expect(q.options[q.correct]).toBe(q.c);
            expect(new Set(q.options).size).toBe(3);
            for (const option of q.options) {
                expect(option).toBeGreaterThan(0);
                expect(Math.abs(option - q.c)).toBeLessThanOrEqual(3);
            }
        }
    });

    it('makes every answer longer than the longer leg and shorter than a + b, over many seeds (#197)', () => {
        for (let seed = 0; seed < 3000; seed++) {
            const q = makeDuelQuestion(seed);
            for (const option of q.options) {
                expect(option).toBeGreaterThan(Math.max(q.a, q.b));
                expect(option).toBeLessThan(q.a + q.b);
            }
        }
    });

    it('never offers 8 for 6-8-10, since 8 can\'t be the longest side', () => {
        const duels = Array.from({ length: 3000 }, (_, seed) => makeDuelQuestion(seed)).filter((q) => q.c === 10);
        expect(duels.length).toBeGreaterThan(0);
        for (const q of duels) {
            expect(q.options).not.toContain(8);
        }
    });

    it('puts the right answer in each of the three places', () => {
        expect(new Set(questions.map((q) => q.correct))).toEqual(new Set([0, 1, 2]));
    });

    it('sometimes makes c the smallest or the largest answer, not always the middle', () => {
        const places = questions.map((q) => q.options.filter((option) => option < q.c).length);
        expect(new Set(places)).toEqual(new Set([0, 1, 2]));
    });

    it.each([-1, 1.5, NaN])('rejects the seed %s', (seed) => {
        expect(() => makeDuelQuestion(seed)).toThrow('Seed must be 0 or a positive integer');
    });
});

// Optional documentation
// - describe('name', fn) / it('name', fn): describe groups related tests under a name; each it is one test, which passes if nothing in it fails.
// - expect(x).toBe(y): fails the test unless x is exactly y; toEqual(y) instead compares contents, so two arrays or Sets with the same items match.
// - toThrow(message): passes if calling the function throws an error containing that message.
// - toHaveLength(n) / toBeGreaterThan(n) / toBeLessThan(n) / toBeLessThanOrEqual(n): check an array's length, or how a number compares to n.
// - Array.from({ length: 3000 }, (_, seed) => seed): the list 0, 1, ..., 2999; the `_` is the unused first argument.
// - new Set(...): keeps one copy of each value, so its size counts the different ones.
// - options.filter((option) => option < 10).length: how many answers are smaller than the right one, which is the right answer's place from smallest to largest.
// - Math.abs(x): x without its sign, so it measures distance either way.
// - `${a},${b},${c}`: turns a triangle into text like "3,4,5", so a Set can compare triangles.
// - x ** 2: x squared.
// - it.each([...])('... %s', fn): runs the test once per value, putting the value into the test's name.
describe('solutionSteps', () => {
    it.each([1, 42, 123])('uses the chasm values for seed %i', (seed) => {
        const chasm = makeChasm(seed, 1, 0);
        const steps = solutionSteps(chasm);

        const { a, b, c } = chasm;
        const correctLog = chasm.logs[chasm.correct];

        expect(steps[0]).toBe('c² = a² + b²');

        expect(steps[1]).toBe(
            `c² = ${a}² + ${b}² = ${a ** 2} + ${b ** 2} = ${c ** 2}`
        );

        expect(steps[2]).toBe(
            `c = √${c ** 2} = ${correctLog} m. The ${correctLog} m log fits.`
        );
    });
});
