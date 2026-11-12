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

function makeWrongLog(c: number, rng: () => number): number {
    let value: number;

    do {
        value = 1 + Math.floor(rng() * (2*c));
    } while (value === c); // make sure our new value is not the same as c

    return value;
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

export function makeChasm(seed: number, level: number, index: number): Chasm {
    if (!Number.isInteger(level) || level < 1 || level > 3) {
        throw new Error("Level must be a positive integer");
    }

    if (!Number.isInteger(seed) || seed < 0) {
        throw new Error("Seed must be 0 or a positive integer")
    }
    const rng = makeRng(seed);

    const levelTriples = triplesByLevel[level - 1];
    if (index < 0 || index >= levelTriples.length || !Number.isInteger(index)) {
        throw new Error("Invalid chasm index");
    }
    const shuffledTriples = [...levelTriples];

    // Shuffle the triples in a given level
    for (let i = shuffledTriples.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i+1));
        [shuffledTriples[i], shuffledTriples[j]] = [shuffledTriples[j], shuffledTriples[i]];
    }

    const [a,b,c] = shuffledTriples[index];

    const wrong1 = makeWrongLog(c, rng);
    let wrong2  = makeWrongLog(c, rng);

    while (wrong2 === wrong1) {
        wrong2 = makeWrongLog(c, rng);
    }
    const logs = [wrong1, c, wrong2];

    // Shuffle correct answer and too short/long answers randomly each time
    for (let i = logs.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i+1));
        [logs[i], logs[j]] = [logs[j], logs[i]];
    }

    
    return {a, b, c, logs, correct: logs.indexOf(c),};
}

/**
 * Makes the three answers for a question whose right answer is `correct`, in a
 * shuffled order. Each wrong answer is 1 to `maxMiss` away from `correct`, and
 * the two are different. The right answer is equally likely to be the smallest,
 * the middle or the largest of the three, so a player can't win by always
 * picking the middle one. The wrong answers stay positive as long as `correct`
 * is bigger than `maxMiss`, and `maxMiss` has to be at least 2 so that two
 * different misses exist.
 */
export function answerChoices(rng: () => number, correct: number, maxMiss: number): number[] {
    const miss = () => 1 + Math.floor(rng() * maxMiss);
    const firstMiss = miss();
    let secondMiss = miss();
    while (secondMiss === firstMiss) {
        secondMiss = miss();
    }

    // How many wrong answers are smaller than the right one: 0, 1 or 2, each a third of the time.
    const smallerCount = Math.floor(rng() * 3);
    let options: number[];
    if (smallerCount === 0) {
        options = [correct, correct + firstMiss, correct + secondMiss];
    } else if (smallerCount === 1) {
        options = [correct, correct - firstMiss, correct + secondMiss];
    } else {
        options = [correct, correct - firstMiss, correct - secondMiss];
    }

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
 * within 3 of `c`, so the player has to work it out rather than rule out
 * answers that are far off.
 */
export function makeDuelQuestion(seed: number): DuelQuestion {
    if (!Number.isInteger(seed) || seed < 0) {
        throw new Error("Seed must be 0 or a positive integer");
    }
    const rng = makeRng(seed);

    const levelTriples = triplesByLevel[0];
    const [a, b, c] = levelTriples[Math.floor(rng() * levelTriples.length)];
    const options = answerChoices(rng, c, DUEL_MAX_MISS);

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
