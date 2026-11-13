import { describe, expect, it } from 'vitest';
import type { Outcome, Screen } from '../../src/controller/Screen';
import { startGame } from '../../src/controller/startGame';
import { CONTINUE, NEW_GAME } from '../../src/controller/TitleController';
import type { PlayerProgress, SavedProgress } from '../../src/model/PlayerProgress';

/**
 * Checks how the game starts (#70, with #71's no-save case): Continue is offered only for a
 * save that hasn't reached the last step, Continue plays the saved game, New game plays a
 * fresh one even when a save exists, and the title is stopped before the game begins. A
 * stand-in title records whether it was offered Continue and reports whatever the test
 * picks, and `play` just records the progress it's handed, so no Konva or GameFlow is needed.
 * SaveStore already turns a missing or broken save into null, so null covers both here.
 */

const LAST_STEP = 20;
const SAVE: SavedProgress = { version: 1, seed: 7, level: 2, step: 12, points: 60, topic: 'Pythagorean theorem in 3D', answers: [{ step: 3, result: 'fits' }] };

/** Starts the game with this save, and gives back the stand-in title and what `play` was handed. */
function start(saved: SavedProgress | null) {
  let offeredContinue: boolean | null = null;
  let report: (outcome: Outcome) => void = () => {};
  const title: Screen & { stopped: boolean } = {
    stopped: false,
    start: (onDone) => (report = onDone),
    stop: () => (title.stopped = true),
  };
  const played: PlayerProgress[] = [];
  startGame(saved, LAST_STEP, (canContinue) => {
    offeredContinue = canContinue;
    return title;
  }, (progress) => {
    // The title must already be gone when the game's first screen is drawn.
    expect(title.stopped).toBe(true);
    played.push(progress);
  });
  const pick = (index: number) => report({ kind: 'choice', index });
  return { offeredContinue, pick, played };
}

describe('startGame', () => {
  it('offers only New game when there is no save, and starts a new game', () => {
    const { offeredContinue, pick, played } = start(null);
    expect(offeredContinue).toBe(false);
    pick(NEW_GAME);
    expect(played.map((progress) => [progress.step, progress.points])).toEqual([[0, 0]]);
  });

  it('offers Continue for a save one step before the last, but not for one at the last step', () => {
    expect(start({ ...SAVE, step: LAST_STEP - 1 }).offeredContinue).toBe(true);
    expect(start({ ...SAVE, step: LAST_STEP }).offeredContinue).toBe(false);
  });

  it('plays the saved game on Continue', () => {
    const { pick, played } = start(SAVE);
    pick(CONTINUE);
    expect(played.map((progress) => progress.toJSON())).toEqual([SAVE]);
  });

  it('plays a new game on New game, even when a save exists', () => {
    const { pick, played } = start(SAVE);
    pick(NEW_GAME);
    expect(played).toHaveLength(1);
    expect([played[0].step, played[0].points, played[0].answers]).toEqual([0, 0, []]);
  });

  it('starts a new game for a finished save, since Continue was never offered', () => {
    const { pick, played } = start({ ...SAVE, step: LAST_STEP });
    pick(CONTINUE);
    expect(played[0].step).toBe(0);
  });
});

// Optional documentation
// - Screen & { stopped: boolean }: a type that has everything Screen has plus a `stopped` field, so the test can check it.
// - start: (onDone) => (report = onDone): saves the function startGame passes in, so the test can call it later to "click" a button.
// - { ...SAVE, step: LAST_STEP }: a copy of SAVE with only `step` changed.
// - played.map((progress) => progress.toJSON()): turns each progress into the plain data a save holds, so it can be compared with SAVE.
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
// - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws.
// - expect(value).toBe(expected): throws, failing the test, unless the two values are exactly equal.
// - expect(value).toEqual(expected): passes when the two values have the same contents, even if they're different arrays or objects.
// - expect(list).toHaveLength(n): passes when the array has exactly n items.
