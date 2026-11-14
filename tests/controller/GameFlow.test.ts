import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { steps, type Step } from '../../src/content/levels';
import { ACCEPT, DECLINE } from '../../src/content/shopText';
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
 * chasm" path in the C&C view is the spec for what happens after a pick. The shop offer
 * tests at the end check #52 and #53: accepting plays the shop's mini-game, declining skips
 * it with no points, and an offer that isn't right before its own mini-game is refused.
 */

const SEED = 7;
const TOPIC = 'Pythagorean theorem in 2D';
/** Where the game's first chasm is in `steps`, after the intro scenes. */
const FIRST_CHASM = steps.findIndex((step) => step.kind === 'chasm');

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
    expect(screens.map((screen) => screen.request)).toEqual([
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
    play(steps, FIRST_CHASM);
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
    play(steps, FIRST_CHASM);
    pickRight();
    expect(progress.points).toBe(10);
    expect(progress.answers).toEqual([{ step: FIRST_CHASM, result: 'fits' }]);
    expect(hud.update).toHaveBeenCalledWith(progress, 1);
    expect(hud.showPointsGained).toHaveBeenCalledWith(10);
    expect(cues).toEqual(['fits']);
  });

  it('records a wrong pick as too short or too long, with no points', () => {
    play(steps, FIRST_CHASM);
    const chasm = shownChasm();
    pickWrong();
    const result = chasm.logs[(chasm.correct + 1) % chasm.logs.length] < chasm.c ? 'tooShort' : 'tooLong';
    expect(progress.points).toBe(0);
    expect(progress.answers).toEqual([{ step: FIRST_CHASM, result }]);
    expect(cues).toEqual([result]);
  });

  it('saves a checkpoint after every step, pointing at the step to play next', () => {
    play();
    done();
    done();
    pickRight();
    expect(saves.map((saved) => saved.step)).toEqual([1, 2, 3]);
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
    play(steps, FIRST_CHASM);
    playLevel1(3);
    expect(last().request).toEqual({ kind: 'levelDone', level: 1, points: 30, possiblePoints: 50 });
    expect(progress.points).toBe(30);
  });

  it('restarts the level and takes back its points when the player picks Begin again', () => {
    progress.addPoints(5);
    play(steps, FIRST_CHASM);
    playLevel1(2);
    last().report({ kind: 'choice', index: 0 });
    expect([progress.step, progress.points]).toEqual([FIRST_CHASM, 5]);
    expect(last().request).toEqual({ kind: 'chasm', chasm: makeChasm(SEED, 1, 0) });

    playLevel1(4);
    expect(last().request).toEqual({ kind: 'levelDone', level: 1, points: 40, possiblePoints: 50 });
    expect(progress.points).toBe(45);
  });

  it('moves on when the player picks Continue on to next level', () => {
    play(steps, FIRST_CHASM);
    playLevel1(2);
    last().report({ kind: 'choice', index: 1 });
    expect(last().request).toEqual({ kind: 'chasm', chasm: makeChasm(SEED, 2, 0) });
    expect(progress.points).toBe(20);
  });

  it('moves on from Level done after every point, where choice 0 means continue', () => {
    play(steps, FIRST_CHASM);
    playLevel1(5);
    last().report({ kind: 'choice', index: 0 });
    expect(last().request).toEqual({ kind: 'chasm', chasm: makeChasm(SEED, 2, 0) });
    expect(progress.points).toBe(50);
  });

  it('counts a level’s points from a save after a restart', () => {
    play(steps, FIRST_CHASM);
    playLevel1(1);
    last().report({ kind: 'choice', index: 0 });
    playLevel1(5);
    progress = PlayerProgress.fromJSON(saves.at(-1)!);
    screens = [];
    play();
    expect(last().request).toEqual({ kind: 'levelDone', level: 1, points: 50, possiblePoints: 50 });
  });

  it('resumes from the step a save points at', () => {
    progress = PlayerProgress.fromJSON({ version: 1, seed: SEED, level: 1, step: FIRST_CHASM + 2, points: 20, topic: TOPIC, answers: [] });
    play();
    expect(kinds()).toEqual(['chasm']);
    expect(last().request).toEqual({ kind: 'chasm', chasm: makeChasm(SEED, 1, 2) });
  });

  it('ignores a report from a screen after it is stopped', () => {
    const flow = play();
    const intro = last();
    flow.stop();
    intro.report({ kind: 'done' });
    expect(intro.stopped).toBe(true);
    expect(kinds()).toEqual(['dialogue']);
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

// The real script has no shop steps until a mini-game exists (#55, #61), so these tests use
// their own, with the supply shop between the intro and the crossing tutorial as in the mockups.
const SHOP_SCRIPT: Step[] = [
  { kind: 'dialogue', script: 'intro' },
  { kind: 'shopOffer', shop: 'supplies' },
  { kind: 'shopGame', shop: 'supplies' },
  { kind: 'dialogue', script: 'howCrossingWorks' },
];
const OFFER = 1;
const pickOffer = (index: number) => last().report({ kind: 'choice', index });

describe('controller/GameFlow shop offers (#52, #53)', () => {
  it('opens the shop’s mini-game when the player accepts', () => {
    play(SHOP_SCRIPT, OFFER);
    pickOffer(ACCEPT);
    expect(screens.map((screen) => screen.request)).toEqual([
      { kind: 'shopOffer', shop: 'supplies' },
      { kind: 'shopGame', shop: 'supplies' },
    ]);
  });

  it('skips the mini-game and returns to the game without points when the player declines', () => {
    play(SHOP_SCRIPT, OFFER);
    pickOffer(DECLINE);
    expect(last().request).toEqual({ kind: 'dialogue', script: 'howCrossingWorks' });
    expect(progress.points).toBe(0);
    expect(hud.showPointsGained).not.toHaveBeenCalled();
  });

  it('saves a checkpoint past the mini-game on decline, so a reload doesn’t offer it again', () => {
    play(SHOP_SCRIPT, OFFER);
    pickOffer(DECLINE);
    expect(saves.at(-1)?.step).toBe(3);
  });

  it('ends the game when the declined mini-game was the last step', () => {
    play(SHOP_SCRIPT.slice(0, 3), OFFER);
    pickOffer(DECLINE);
    expect(kinds()).toEqual(['shopOffer']);
    expect(last().stopped).toBe(false);
  });

  it.each([
    ['another step', [{ kind: 'shopOffer', shop: 'supplies' }, { kind: 'dialogue', script: 'intro' }]],
    ['another shop’s mini-game', [{ kind: 'shopOffer', shop: 'supplies' }, { kind: 'shopGame', shop: 'clothing' }]],
    ['nothing', [{ kind: 'dialogue', script: 'intro' }, { kind: 'shopOffer', shop: 'supplies' }]],
  ] as [string, Step[]][])('refuses a script where an offer is followed by %s, before playing anything', (_, script) => {
    expect(() => play(script)).toThrow('The supplies shop offer at step');
    expect(screens).toEqual([]);
  });
});

// Optional documentation
// - Stand-in screen: an object with the same start/stop methods as a real screen, which records what it was asked for and reports only when the test calls report().
// - vi.fn<Hud['update']>(): a stand-in function with the same type as the Hud's method that records each call, so a test can check it with toHaveBeenLastCalledWith.
// - steps.findIndex(...): the position of the first step the function returns true for, so the tests don't break when a scene is added before the first chasm.
// - play(steps, FIRST_CHASM): starts at the first chasm, as if loading a save there.
// - expect(fn).not.toHaveBeenCalled(): passes when the stand-in function was never called.
// - saves.at(-1)?.step: the step the latest checkpoint points at; `?.` gives undefined instead of failing if nothing was saved.
// - SHOP_SCRIPT.slice(0, 3): a copy of the first three steps, so the mini-game is the last one.
// - it.each([...] as [string, Step[]][])(name, fn): runs the same test once per row, passing the row's items to fn; %s in the name is filled in from the row, and the `as` tells TypeScript each row is a label and a script.
// - (_, script) =>: `_` names a parameter the test doesn't use, here the row's label.
// - expect(() => ...).toThrow(text): passes only if calling the function throws an error whose message contains `text`.
