import { makeRng } from './problems';

/**
 * The zipline shop's problem: a box-shaped store whose zipline runs along its
 * space diagonal, from the top corner by the office to the exit at the opposite
 * bottom corner. The player picks the diagonal from three guesses.
 */
export interface ZiplineProblem {
  /** The longest side, drawn left to right. */
  length: number;
  /** The shortest side, drawn going back into the box. */
  width: number;
  height: number;
  /** The zipline's length, √(length² + width² + height²), always a whole number. */
  diagonal: number;
  /** The engineers' three guesses, in the order the shop shows them; one is `diagonal`. */
  options: number[];
  /** The position of `diagonal` in `options`. */
  correct: number;
}

/**
 * Boxes whose space diagonal is a whole number, as [width, height, length, diagonal],
 * so width² + height² + length² = diagonal². Sides of 1, and boxes far longer
 * than they are wide, are left out so each one looks like a store.
 */
export const ziplineBoxes = [
  [2, 3, 6, 7],
  [2, 6, 9, 11],
  [4, 4, 7, 9],
  [3, 4, 12, 13],
  [8, 9, 12, 17],
  [6, 10, 15, 19],
  [4, 13, 16, 21],
  [8, 11, 16, 21],
  [9, 12, 20, 25],
  [12, 15, 16, 25],
  [12, 16, 21, 29],
] as const;

/** How far each wrong guess can be from the diagonal. */
const MAX_MISS = 3;

/**
 * Makes the zipline problem for a game. The same seed always gives the same box
 * and the same guesses, so a loaded save shows the same problem. One guess is
 * the diagonal, one is 1 to 3 shorter and one is 1 to 3 longer, shuffled.
 */
export function makeZiplineProblem(seed: number): ZiplineProblem {
  if (!Number.isInteger(seed) || seed < 0) {
    throw new Error('Seed must be 0 or a positive integer');
  }
  const rng = makeRng(seed);
  const miss = () => 1 + Math.floor(rng() * MAX_MISS);

  const [width, height, length, diagonal] = ziplineBoxes[Math.floor(rng() * ziplineBoxes.length)];
  const options = [diagonal - miss(), diagonal, diagonal + miss()];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return { length, width, height, diagonal, options, correct: options.indexOf(diagonal) };
}

/** Whether the guess at `index` in `problem.options` is the zipline's length. */
export function checkZiplineAnswer(problem: ZiplineProblem, index: number): boolean {
  if (!Number.isInteger(index) || index < 0 || index >= problem.options.length) {
    throw new Error('Invalid answer index');
  }
  return problem.options[index] === problem.diagonal;
}

/**
 * Puts the problem's numbers into a zipline page's text from content/ziplineText, where
 * it says {length}, {width}, {height}, {floor} (length² + width²), {squared} (the
 * diagonal²) or {diagonal}. Anything else in braces is left as it is.
 */
export function fillZiplineText(text: string, problem: ZiplineProblem): string {
  const { length, width, height, diagonal } = problem;
  const values: Record<string, number> = {
    length,
    width,
    height,
    floor: length ** 2 + width ** 2,
    squared: diagonal ** 2,
    diagonal,
  };
  return text.replace(/\{(\w+)\}/g, (marker, name: string) => (Object.hasOwn(values, name) ? String(values[name]) : marker));
}
// Optional documentation
// - x ** 2: x squared.
// - text.replace(/\{(\w+)\}/g, fn): finds every word in braces, like {floor}, and swaps each for what fn returns; `name` is the word without its braces.
// - Object.hasOwn(values, name): true only for the names listed in values, so a word like {toString} isn't mistaken for one.
