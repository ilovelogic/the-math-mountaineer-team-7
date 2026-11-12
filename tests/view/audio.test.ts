import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sound } from '../../src/view/assets';
import { play } from '../../src/view/audio';

/**
 * Checks that play() plays the sound for the cue it's given, starting from the
 * beginning, and that a sound the browser refuses to play doesn't cause an
 * error. Node has no browser Audio, so view/assets is replaced by a fake whose
 * sound() hands back a stand-in with only currentTime and play(). Limits: it
 * can't tell whether anything is actually heard (that needs `npm run dev`),
 * and an unhandled refusal fails the whole run rather than this one test.
 */

vi.mock('../../src/view/assets', () => ({ sound: vi.fn() }));

// Makes sound() hand back a stand-in that starts partway through, so a rewind to 0 is visible.
function fakeSound(playOutcome: () => Promise<void>) {
  const fake = { currentTime: 3, play: vi.fn(playOutcome) };
  vi.mocked(sound).mockReturnValue(fake as unknown as HTMLAudioElement);
  return fake;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('play', () => {
  it('plays the sound named by the cue', () => {
    const fake = fakeSound(() => Promise.resolve());
    play('tooShort');
    expect(sound).toHaveBeenCalledWith('tooShort');
    expect(fake.play).toHaveBeenCalledOnce();
  });

  it('starts the sound over if it was already playing', () => {
    const fake = fakeSound(() => Promise.resolve());
    play('fits');
    expect(fake.currentTime).toBe(0);
  });

  it('carries on quietly when the browser refuses to play the sound', async () => {
    fakeSound(() => Promise.reject(new Error('NotAllowedError')));
    expect(() => play('medal')).not.toThrow();
    // Waiting one timer tick lets the refusal arrive during this test, so Vitest reports it if play() left it unhandled.
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});

// Optional documentation
// - describe(name, fn) / it(name, fn): describe groups related tests under one name, and each it is one test that Vitest runs and reports.
// - expect(value): starts a check on value, and the call after it (such as .toBe) says what must be true or the test fails.
// - vi.mock(path, factory): swaps the real module for what factory returns, in every file that imports it. Vitest moves this call above the imports, so audio.ts gets the fake too.
// - vi.fn(impl): a stand-in function that records every call and runs impl when it's called (if impl is given).
// - Promise.resolve() / Promise.reject(error): a promise that has already succeeded, or one that has already failed with error.
// - vi.mocked(sound).mockReturnValue(x): tells TypeScript that sound is the fake from vi.mock, then makes every call to it return x.
// - fake as unknown as HTMLAudioElement: TypeScript won't cast a small object straight to a much bigger type, so going through `unknown` first allows it. This is safe here because play() only touches the two properties the fake has.
// - beforeEach(fn): runs fn before every test, and vi.clearAllMocks() there erases the calls recorded by the previous test.
// - toHaveBeenCalledWith(...) / toHaveBeenCalledOnce(): passes if the fake was called with those arguments, or was called exactly once.
// - toBe(value): passes if the result is exactly value.
// - expect(() => ...).not.toThrow(): runs the function and passes if it doesn't throw.
// - await new Promise((resolve) => setTimeout(resolve, 0)): waits one timer tick so pending promise callbacks run before the test ends.