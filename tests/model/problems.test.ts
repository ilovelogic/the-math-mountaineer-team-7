import { describe, it, expect } from 'vitest';
import { makeChasm } from '../../src/model/problems';
import { checkPick } from '../../src/model/problems';
import { triplesByLevel } from '../../src/model/problems';

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
        const seed = 42
        const level = 1
        const seen = new Set<string>();

        for (let index = 0; index < triplesByLevel[level - 1].length; index++) {
            const chasm = makeChasm(seed, level, index);
            const tripleKey =  `${chasm.a},${chasm.b},${chasm.c}`; 

            expect(seen.has(tripleKey)).toBe(false);
            seen.add(tripleKey);
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