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
/*

*/
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
    if (!Number.isInteger(level) || level < 1) {
        throw new Error("Level must be a positive integer");
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

    const logs = [c - 1, c, c + 1];

    // Shuffle correct answer and too short/long answers randomly each time
    for (let i = logs.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i+1));
        [logs[i], logs[j]] = [logs[j], logs[i]];
    }

    
    return {a, b, c, logs, correct: logs.indexOf(c),};
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
