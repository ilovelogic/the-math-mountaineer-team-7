import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { steps, type Step } from '../../src/content/levels';
import { GameFlow, newSeed, type ScreenRequest } from '../../src/controller/GameFlow';
import type { Outcome, Screen } from '../../src/controller/Screen';
import { PlayerProgress, type SavedProgress } from '../../src/model/PlayerProgress';
import { makeChasm, type Chasm } from '../../src/model/problems';
import type { PickResult } from '../../src/model/rules';
import type { Hud } from '../../src/view/Hud';

/**
 * Checks issue #6 with stand-in screens: GameFlow asks `makeScreen` for each step in
 * order, and each stand-in records what it was asked for and reports only when the test
 * says so. The Hud, saving and sounds are stand-ins too, so no Konva or browser is needed. The "crossing one
 * chasm" path in the C&C view is the spec for what happens after a pick.
 */

const SEED = 7;
const TOPIC = 'Pythagorean theorem in 2D';

interface StandIn extends Screen {
  request: ScreenRequest;
  stopped: boolean;
  report(outcome: Outcome): void;
}

let screens: StandIn[];
let hud: { update: Mock<Hud['update']>; showPointsGained: Mock<Hud['showPointsGained']> };
let progress: PlayerProgress;
let saves: SavedProgress[];
let cues: PickResult[];

beforeEach(() => {
  screens = [];
  hud = { update: vi.fn<Hud['update']>(), showPointsGained: vi.fn<Hud['showPointsGained']>() };
  progress = new PlayerProgress(SEED);
  saves = [];
  cues = [];
});

function makeScreen(request: ScreenRequest): Screen {
  let onDone: ((outcome: Outcome) => void) | null = null;
  const screen: StandIn = {
    request,
    stopped: false,
    start: (cb) => (onDone = cb),
    stop: () => (screen.stopped = true),
    report: (outcome) => onDone?.(outcome),
  };
  screens.push(screen);
  return screen;
}

function play(list: readonly Step[] = steps, from?: number): GameFlow {
  const flow = new GameFlow(list, progress, makeScreen, {
    hud,
    save: (saved) => saves.push(saved),
    playCue: (cue) => cues.push(cue),
  });
  flow.run(from);
  return flow;
}

const last = () => screens[screens.length - 1];
const done = () => last().report({ kind: 'done' });
const kinds = () => screens.map((screen) => screen.request.kind);
const shownChasm = () => (last().request as { kind: 'chasm'; chasm: Chasm }).chasm;
/** Picks the log that fits, or one that doesn't, on the chasm being shown. */
const pickRight = () => last().report({ kind: 'choice', index: shownChasm().correct });
const pickWrong = () => last().report({ kind: 'choice', index: (shownChasm().correct + 1) % shownChasm().logs.length });

describe('controller/GameFlow', () => {
  it('plays the steps in order, one screen at a time', () => {
    play();
    done();
    done();
    done();
    expect(screens.map((screen) => screen.request)).toEqual([
      { kind: 'title' },
      { kind: 'dialogue', script: 'intro' },
      { kind: 'dialogue', script: 'howCrossingWorks' },
      { kind: 'chasm', chasm: makeChasm(SEED, 1, 0) },
    ]);
  });

  it('stops each screen before starting the next', () => {
    play();
    done();
    expect(screens.map((screen) => screen.stopped)).toEqual([true, false]);
  });

  it('makes each chasm from the game’s seed, level and index', () => {
    play(steps, 3);
    last().report({ kind: 'choice', index: 0 });
    expect(last().request).toEqual({ kind: 'chasm', chasm: makeChasm(SEED, 1, 1) });
  });

  it('moves to the next level with its level and topic, and tells the Hud the chasm number', () => {
    const list: Step[] = [
      { kind: 'chasm', level: 1, topic: TOPIC, index: 0 },
      { kind: 'levelDone', level: 1 },
      { kind: 'chasm', level: 2, topic: 'Pythagorean theorem in 3D', index: 0 },
    ];
    play(list);
    last().report({ kind: 'choice', index: 0 });
    expect(hud.update).toHaveBeenLastCalledWith(progress, undefined);
    done();
    expect([progress.step, progress.level, progress.topic]).toEqual([2, 2, 'Pythagorean theorem in 3D']);
    expect(hud.update).toHaveBeenLastCalledWith(progress, 1);
  });

  it('awards points for the log that fits, and shows and plays how it went', () => {
    play(steps, 3);
    pickRight();
    expect(progress.points).toBe(10);
    expect(progress.answers).toEqual([{ step: 3, result: 'fits' }]);
    expect(hud.update).toHaveBeenCalledWith(progress, 1);
    expect(hud.showPointsGained).toHaveBeenCalledWith(10);
    expect(cues).toEqual(['fits']);
  });

  it('records a wrong pick as too short or too long, with no points', () => {
    play(steps, 3);
    const chasm = shownChasm();
    pickWrong();
    const result = chasm.logs[(chasm.correct + 1) % chasm.logs.length] < chasm.c ? 'tooShort' : 'tooLong';
    expect(progress.points).toBe(0);
    expect(progress.answers).toEqual([{ step: 3, result }]);
    expect(cues).toEqual([result]);
  });

  it('saves a checkpoint after every step, pointing at the step to play next', () => {
    play();
    done();
    done();
    done();
    pickRight();
    expect(saves.map((saved) => saved.step)).toEqual([1, 2, 3, 4]);
    expect(saves.at(-1)).toEqual(progress.toJSON());
    expect(saves.at(-1)?.points).toBe(10);
  });

  it('plays the whole game through to the medal', () => {
    play();
    while (last().request.kind !== 'medal') {
      if (last().request.kind === 'chasm') pickRight();
      else done();
    }
    expect(last().request).toEqual({ kind: 'medal', points: 150 });
    expect(kinds().filter((kind) => kind === 'chasm')).toHaveLength(15);
    expect(kinds().filter((kind) => kind === 'levelDone')).toHaveLength(2);
  });

  /** Plays Level 1's five chasms from its first one, getting the first `right` of them right. */
  function playLevel1(right: number): void {
    for (let i = 0; i < 5; i++) {
      if (i < right) pickRight();
      else pickWrong();
    }
  }

  it('gives Level done the points earned on that level alone', () => {
    play(steps, 3);
    playLevel1(3);
    expect(last().request).toEqual({ kind: 'levelDone', level: 1, points: 30, possiblePoints: 50 });
    expect(progress.points).toBe(30);
  });

  it('restarts the level and takes back its points when the player picks Begin again', () => {
    progress.addPoints(5);
    play(steps, 3);
    playLevel1(2);
    last().report({ kind: 'choice', index: 0 });
    expect([progress.step, progress.points]).toEqual([3, 5]);
    expect(last().request).toEqual({ kind: 'chasm', chasm: makeChasm(SEED, 1, 0) });

    playLevel1(4);
    expect(last().request).toEqual({ kind: 'levelDone', level: 1, points: 40, possiblePoints: 50 });
    expect(progress.points).toBe(45);
  });

  it('moves on when the player picks Continue on to next level', () => {
    play(steps, 3);
    playLevel1(2);
    last().report({ kind: 'choice', index: 1 });
    expect(last().request).toEqual({ kind: 'chasm', chasm: makeChasm(SEED, 2, 0) });
    expect(progress.points).toBe(20);
  });

  it('moves on from Level done after every point, where choice 0 means continue', () => {
    play(steps, 3);
    playLevel1(5);
    last().report({ kind: 'choice', index: 0 });
    expect(last().request).toEqual({ kind: 'chasm', chasm: makeChasm(SEED, 2, 0) });
    expect(progress.points).toBe(50);
  });

  it('counts a level’s points from a save after a restart', () => {
    play(steps, 3);
    playLevel1(1);
    last().report({ kind: 'choice', index: 0 });
    playLevel1(5);
    progress = PlayerProgress.fromJSON(saves.at(-1)!);
    screens = [];
    play();
    expect(last().request).toEqual({ kind: 'levelDone', level: 1, points: 50, possiblePoints: 50 });
  });

  it('resumes from the step a save points at', () => {
    progress = PlayerProgress.fromJSON({ version: 1, seed: SEED, level: 1, step: 5, points: 20, topic: TOPIC, answers: [] });
    play();
    expect(kinds()).toEqual(['chasm']);
    expect(last().request).toEqual({ kind: 'chasm', chasm: makeChasm(SEED, 1, 2) });
  });

  it('ignores a report from a screen after it is stopped', () => {
    const flow = play();
    const title = last();
    flow.stop();
    title.report({ kind: 'done' });
    expect(title.stopped).toBe(true);
    expect(kinds()).toEqual(['title']);
  });

  it('leaves the medal screen up when the game ends', () => {
    play([{ kind: 'medal' }]);
    done();
    expect(last().stopped).toBe(false);
  });

  it('refuses to start at a step that does not exist', () => {
    expect(() => play(steps, steps.length)).toThrow(RangeError);
  });

  it('picks a whole-number seed for a new game', () => {
    expect(newSeed(() => 0.5)).toBe(2 ** 30);
    expect(Number.isInteger(newSeed())).toBe(true);
  });
});

// Optional documentation
// - Stand-in screen: an object with the same start/stop methods as a real screen, which records what it was asked for and reports only when the test calls report().
// - vi.fn<Hud['update']>(): a stand-in function with the same type as the Hud's method that records each call, so a test can check it with toHaveBeenLastCalledWith.
// - play(steps, 3): starts at step 3, the first chasm, as if loading a save there.
