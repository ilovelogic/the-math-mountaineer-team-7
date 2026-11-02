import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { steps, type Step } from '../../src/content/levels';
import { GameFlow, newSeed, type ScreenRequest } from '../../src/controller/GameFlow';
import type { Outcome, Screen } from '../../src/controller/Screen';
import { PlayerProgress } from '../../src/model/PlayerProgress';
import { makeChasm } from '../../src/model/problems';
import type { Hud } from '../../src/view/Hud';

/**
 * Checks issue #6 with stand-in screens: GameFlow asks `makeScreen` for each step in
 * order, and each stand-in records what it was asked for and reports only when the test
 * says so. The Hud is a stand-in too, so no Konva or browser is needed. The "crossing one
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

beforeEach(() => {
  screens = [];
  hud = { update: vi.fn<Hud['update']>(), showPointsGained: vi.fn<Hud['showPointsGained']>() };
  progress = new PlayerProgress(SEED);
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
  const flow = new GameFlow(list, progress, makeScreen, { hud });
  flow.run(from);
  return flow;
}

const last = () => screens[screens.length - 1];
const done = () => last().report({ kind: 'done' });
const kinds = () => screens.map((screen) => screen.request.kind);

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
