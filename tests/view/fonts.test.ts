import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadFonts } from '../../src/view/fonts';

/**
 * Checks what `main.ts` relies on from view/fonts: it asks for both weights of
 * Inter, doesn't finish until they've arrived, and still finishes (with a warning)
 * when a weight is missing or its download fails, so the game always starts.
 * Node has no `document.fonts`, so a fake one stands in. Its `load` answers each
 * request the way the test sets up. Limit: whether the text really looks like
 * the mockups still needs a check in the browser.
 */

type Answer = 'found' | 'missing' | 'fails';

let answers: Record<string, Answer> = {};

// Answers like the browser: the matching fonts, an empty list, or a failed download.
const load = vi.fn(async (face: string) => {
  const answer = answers[face] ?? 'found';
  if (answer === 'fails') throw new Error(`NetworkError loading ${face}`);
  return answer === 'found' ? [{ family: 'Inter' }] : [];
});

beforeEach(() => {
  answers = {};
  load.mockClear();
  vi.stubGlobal('document', { fonts: { load } });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('loadFonts', () => {
  it('asks for the regular and semi bold weights of Inter', async () => {
    await loadFonts();
    expect(load.mock.calls.map((call) => call[0])).toEqual(['400 16px Inter', '600 16px Inter']);
  });

  it('finishes quietly when both weights load', async () => {
    await loadFonts();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("doesn't finish until the fonts have arrived", async () => {
    let arrive = () => {};
    load.mockImplementationOnce(() => new Promise((resolve) => (arrive = () => resolve([{ family: 'Inter' }]))));
    let finished = false;
    const loading = loadFonts().then(() => (finished = true));

    await Promise.resolve();
    expect(finished).toBe(false);

    arrive();
    await loading;
    expect(finished).toBe(true);
  });

  it('warns about a weight the browser cannot find, and still finishes', async () => {
    answers['600 16px Inter'] = 'missing';
    await expect(loadFonts()).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('600 16px Inter'));
  });

  it('warns about a weight whose download fails, and still finishes', async () => {
    answers['400 16px Inter'] = 'fails';
    await expect(loadFonts()).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('400 16px Inter'));
  });

  it('warns once per weight when neither one loads', async () => {
    answers = { '400 16px Inter': 'fails', '600 16px Inter': 'missing' };
    await loadFonts();
    expect(console.warn).toHaveBeenCalledTimes(2);
  });
});

// Optional documentation
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
// - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws or its promise rejects.
// - Record<string, Answer>: an object whose keys are strings and whose values are Answers.
// - answers[face] ?? 'found': gives 'found' when the test set no answer for that face.
// - vi.fn(impl): a fake function that runs impl and records every call, so a test can check what it was called with.
// - beforeEach / afterEach (fn): run fn before and after every test, so each one starts from a clean fake and nothing leaks into the next.
// - load.mockClear(): forgets the calls recorded so far.
// - vi.stubGlobal('document', value): makes `document` mean value for the code under test; vi.unstubAllGlobals() puts the real one back (here, none).
// - vi.spyOn(console, 'warn').mockImplementation(() => {}): records calls to console.warn and keeps them out of the test output; vi.restoreAllMocks() undoes it.
// - load.mock.calls.map((call) => call[0]): every call's first argument, in order.
// - expect(value).toEqual(expected): throws, failing the test, unless the arrays have the same contents.
// - expect(fn).not.toHaveBeenCalled() / toHaveBeenCalledTimes(n): check how many times a fake or spied function was called.
// - load.mockImplementationOnce(impl): uses impl for the next call only, here a promise the test resolves by hand with arrive().
// - new Promise((resolve) => ...): a promise that stays pending until resolve is called.
// - await Promise.resolve(): lets every already-finished step run once, so the check sees how far loadFonts got without the font.
// - expect(value).toBe(expected): throws unless the two values are exactly equal.
// - await expect(promise).resolves.toBeUndefined(): passes only if the promise finishes (doesn't reject) with no value.
// - toHaveBeenCalledWith(expect.stringContaining(text)): passes if some call's argument was a string containing text.
