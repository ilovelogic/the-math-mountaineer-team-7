export interface Chasm { 
    a: number; 
    b: number; 
    c: number; 
    logs: number[]; // choices which includes c
    correct: number // Index based
}

export function makeRng(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6D2B79F5) >>> 0;

        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * The bounds any believable hypotenuse of legs `a` and `b` lies strictly between:
 * longer than the longer leg, and shorter than the two legs laid end to end.
 * A wrong answer outside them can be ruled out without doing the math.
 */
export function hypotenuseBounds(a: number, b: number): { above: number; below: number } {
    return { above: Math.max(a, b), below: a + b };
}

/** The numbers strictly between `above` and `below` that are multiples of `step`, smallest first. */
function valuesBetween(above: number, below: number, step: number): number[] {
    const values: number[] = [];
    for (let value = (Math.floor(above / step) + 1) * step; value < below; value += step) {
        values.push(value);
    }
    return values;
}

/** Removes and returns a random item of `pool`. */
function takeRandom(pool: number[], rng: () => number): number {
    return pool.splice(Math.floor(rng() * pool.length), 1)[0];
}

/**
 * Picks `count` different values: random whole ones while there are enough,
 * then random half ones (like 5.5) to make up the rest. Halves are a last
 * resort, since a lone x.5 next to whole numbers stands out.
 */
function pickPreferringWholes(rng: () => number, wholes: number[], halves: number[], count: number): number[] {
    const wholePool = [...wholes];
    const halfPool = [...halves];
    const picked: number[] = [];
    while (picked.length < count && wholePool.length > 0) picked.push(takeRandom(wholePool, rng));
    while (picked.length < count && halfPool.length > 0) picked.push(takeRandom(halfPool, rng));
    if (picked.length < count) {
        throw new Error("Not enough believable wrong answers");
    }
    return picked;
}

/**
 * The two wrong logs for a chasm with legs `a` and `b` and hypotenuse `c`. Both
 * are longer than the longer leg and shorter than a + b, so neither can be ruled
 * out at a glance (#197). Small triangles like 3-4-5 have only one whole number
 * in that range besides `c`, so the other wrong log is a half meter, like 5.5.
 */
function makeWrongLogs(a: number, b: number, c: number, rng: () => number): number[] {
    const { above, below } = hypotenuseBounds(a, b);
    const notC = (value: number) => value !== c;
    const wholes = valuesBetween(above, below, 1).filter(notC);
    const halves = valuesBetween(above, below, 0.5).filter((value) => !Number.isInteger(value));
    return pickPreferringWholes(rng, wholes, halves, 2);
}

export const triplesByLevel = [
    // Lvl 1
    [
      [3, 4, 5], // 3^2 + 4^2 = 5^2
      [5, 12, 13],
      [6, 8, 10],
      [8, 15, 17],
      [9, 12 ,15],
    ],
    // Lvl 2
    [
      [7, 24, 25],
      [20, 21, 29],
      [12, 35, 37],
      [14, 48, 50],
      [15, 20, 25],
    ],
    // Lvl 3
    [
      [15, 36, 39],
      [16, 30, 34],
      [18, 24, 30],
      [27, 36, 45],
      [30, 40, 50],
    ],
];

/* Changes the seed from chasm to chasm so that log options are always shuffled with new RNG on each chasm. */
function mixChasmSeed(seed: number, level: number, index: number): number {
    let mixed = seed >>> 0;

    mixed = Math.imul(mixed ^ level, 0x45d9f3b);
    mixed = Math.imul(mixed ^ index, 0x45d9f3b);

    mixed ^= mixed >>> 16;

    return mixed >>> 0;
}

export function makeChasm(seed: number, level: number, index: number): Chasm {
    if (!Number.isInteger(level) || level < 1 || level > 3) {
        throw new Error("Level must be a positive integer");
    }

    if (!Number.isInteger(seed) || seed < 0) {
        throw new Error("Seed must be 0 or a positive integer")
    }
    
    const levelTriples = triplesByLevel[level - 1];
    if (index < 0 || index >= levelTriples.length || !Number.isInteger(index)) {
        throw new Error("Invalid chasm index");
    }
    const tripleRng = makeRng(mixChasmSeed(seed, level, 0));
    const logRng = makeRng(mixChasmSeed(seed, level, index));
    const shuffledTriples = [...levelTriples];

    // Shuffle the triples in a given level
    for (let i = shuffledTriples.length - 1; i > 0; i--) {
        const j = Math.floor(tripleRng() * (i+1));
        [shuffledTriples[i], shuffledTriples[j]] = [shuffledTriples[j], shuffledTriples[i]];
    }

    const [a,b,c] = shuffledTriples[index];

    const [wrong1, wrong2] = makeWrongLogs(a, b, c, logRng);
    const logs = [wrong1, c, wrong2];

    // Shuffle correct answer and too short/long answers randomly each time
    for (let i = logs.length - 1; i > 0; i--) {
        const j = Math.floor(logRng() * (i+1));
        [logs[i], logs[j]] = [logs[j], logs[i]];
    }

    
    return {a, b, c, logs, correct: logs.indexOf(c),};
}

export function solutionSteps(chasm: Chasm): string[] {
    const { a, b, c } = chasm;

    return [
        `c² = a² + b²`,
        `c² = ${a}² + ${b}² = ${a ** 2} + ${b ** 2} = ${c ** 2}`,
        `c = √${c ** 2} = ${c} m. The ${c} m log fits.`
    ];
}

/**
 * Makes the three answers for a question whose right answer is `correct`, in a
 * shuffled order. Each wrong answer is 1 to `maxMiss` away from `correct`, and
 * the two are different. The right answer is equally likely to be the smallest,
 * the middle or the largest of the three, so a player can't win by always
 * picking the middle one. The wrong answers stay positive as long as `correct`
 * is bigger than `maxMiss`, and `maxMiss` has to be at least 2 so that two
 * different misses exist.
 *
 * With `bounds`, every answer also lies strictly between `bounds.above` and
 * `bounds.below` (for a hypotenuse, see `hypotenuseBounds`), so none can be
 * ruled out at a glance (#197). The right answer then takes only the places
 * the bounds leave room for: for 5-12-13, nothing whole fits between 12 and 13,
 * so 13 is always the smallest. If fewer than two whole wrong answers fit at
 * all, as for 3-4-5, half ones (like 5.5) make up the rest.
 */
export function answerChoices(
    rng: () => number,
    correct: number,
    maxMiss: number,
    bounds?: { above: number; below: number },
): number[] {
    const above = bounds?.above ?? -Infinity;
    const below = bounds?.below ?? Infinity;
    const fits = (value: number) => value > above && value < below;
    const misses = Array.from({ length: maxMiss }, (_, i) => i + 1);
    const smaller = misses.map((miss) => correct - miss).filter(fits);
    const larger = misses.map((miss) => correct + miss).filter(fits);

    let wrong: number[];
    if (smaller.length + larger.length >= 2) {
        // How many wrong answers are smaller than the right one: 0, 1 or 2, each
        // equally likely among the ones the bounds leave room for.
        const possibleCounts = [0, 1, 2].filter((count) => smaller.length >= count && larger.length >= 2 - count);
        const smallerCount = possibleCounts[Math.floor(rng() * possibleCounts.length)];
        const smallerPool = [...smaller];
        const largerPool = [...larger];
        wrong = [
            ...Array.from({ length: smallerCount }, () => takeRandom(smallerPool, rng)),
            ...Array.from({ length: 2 - smallerCount }, () => takeRandom(largerPool, rng)),
        ];
    } else {
        const halves = misses.flatMap((miss) => [correct - miss + 0.5, correct + miss - 0.5]).filter(fits);
        wrong = pickPreferringWholes(rng, [...smaller, ...larger], halves, 2);
    }
    const options = [correct, ...wrong];

    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    return options;
}
// Optional documentation
// - rng: () => number: a function that returns a random number from 0 up to (but not including) 1, like the ones makeRng makes.
// - [options[i], options[j]] = [options[j], options[i]]: swaps two answers in one step.

/**
 * The supply shop's duel: a right triangle with legs `a` and `b`, where the
 * player races the store owner to pick the hypotenuse `c` from three answers.
 */
export interface DuelQuestion {
    a: number;
    b: number;
    /** The hypotenuse, √(a² + b²), always a whole number. */
    c: number;
    /** The three answers, in the order the shop shows them; one is `c`. */
    options: number[];
    /** The position of `c` in `options`. */
    correct: number;
}

/** How far each wrong duel answer can be from `c`. */
const DUEL_MAX_MISS = 3;

/**
 * Makes the duel question for a game. The same seed always gives the same
 * question. Winning the duel skips Level 1, so the triangle is one of Level 1's,
 * small enough to solve in your head during a race. Both wrong answers are
 * within 3 of `c`, longer than the longer leg and shorter than a + b, so the
 * player has to work it out rather than rule out answers that can't be the
 * longest side (#197).
 */
export function makeDuelQuestion(seed: number): DuelQuestion {
    if (!Number.isInteger(seed) || seed < 0) {
        throw new Error("Seed must be 0 or a positive integer");
    }
    const rng = makeRng(seed);

    const levelTriples = triplesByLevel[0];
    const [a, b, c] = levelTriples[Math.floor(rng() * levelTriples.length)];
    const options = answerChoices(rng, c, DUEL_MAX_MISS, hypotenuseBounds(a, b));

    return { a, b, c, options, correct: options.indexOf(c) };
}

export function checkPick(chasm: Chasm, index: number): 'fits' | 'tooShort' | 'tooLong' {
    if (!Number.isInteger(index) || index < 0 || index >= chasm.logs.length) {
        throw new Error("Invalid log index");
    }

    const pickedLog = chasm.logs[index];
    if (pickedLog < chasm.c) {
        return 'tooShort';
    }

    if (pickedLog > chasm.c) {
        return 'tooLong';
    }

    return 'fits';
}
