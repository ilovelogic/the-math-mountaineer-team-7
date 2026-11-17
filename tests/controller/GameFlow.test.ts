import { SaveStore } from '../../src/model/SaveStore';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { steps, type Step } from '../../src/content/levels';
import { ACCEPT, DECLINE } from '../../src/content/shopText';
import { DUEL_RESULT } from '../../src/controller/DuelShopController';
import { GameFlow, newSeed, type ScreenRequest } from '../../src/controller/GameFlow';
import type { Outcome, Screen } from '../../src/controller/Screen';
import { PlayerProgress, type SavedProgress } from '../../src/model/PlayerProgress';
import { makeChasm, makeDuelQuestion, type Chasm } from '../../src/model/problems';
import { makeZiplineProblem, type ZiplineProblem } from '../../src/model/zipline';
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
const shownZipline = () => (last().request as { kind: 'shopGame'; shop: 'clothing'; problem: ZiplineProblem }).problem;
/** Reports the right guess, or a wrong one, on the zipline problem being shown. */
const guessZipline = (right: boolean) =>
  last().report({ kind: 'choice', index: (shownZipline().correct + (right ? 0 : 1)) % shownZipline().options.length });
/**
 * Plays on from the current screen to the medal: every pick right, every shop accepted,
 * the zipline guessed right, and the duel ending with `duel`.
 */
function playToMedal(duel: number): void {
  while (last().request.kind !== 'medal') {
    const request = last().request;
    if (request.kind === 'chasm') pickRight();
    else if (request.kind === 'shopOffer') last().report({ kind: 'choice', index: ACCEPT });
    else if (request.kind === 'shopGame' && request.shop === 'clothing') guessZipline(true);
    else if (request.kind === 'shopGame') last().report({ kind: 'choice', index: duel });
    else done();
  }
}

describe('controller/GameFlow', () => {
  it('updates the topic for Mini-game 2 and restores it for chasms', () => {
  const list: Step[] = [
    { kind: 'chasm', level: 1, topic: 'Pythagorean theorem in 2D', index: 0 },
    { kind: 'shopOffer', shop: 'clothing' },
    { kind: 'shopGame', shop: 'clothing', topic: 'Pythagorean theorem in 3D' },
    { kind: 'chasm', level: 1, topic: 'Pythagorean theorem in 2D', index: 1 },
  ];

  play(list);

  expect(progress.topic).toBe('Pythagorean theorem in 2D');

  pickRight();
  expect(progress.topic).toBe('Pythagorean theorem in 2D');

  // Accept the shop offer to enter Mini-game 2.
  last().report({ kind: 'choice', index: 0 });

  expect(progress.topic).toBe('Pythagorean theorem in 3D');
  expect(hud.update).toHaveBeenLastCalledWith(progress, undefined);

  // Finish Mini-game 2 and return to the chasm.
  done();

  expect(progress.topic).toBe('Pythagorean theorem in 2D');
  expect(hud.update).toHaveBeenLastCalledWith(progress, 2);
});
  it('plays the steps in order, one screen at a time', () => {
    play();
    done();
    last().report({ kind: 'choice', index: DECLINE });
    done();
    expect(screens.map((screen) => screen.request)).toEqual([
      { kind: 'dialogue', script: 'intro' },
      { kind: 'shopOffer', shop: 'supplies' },
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
    expect(progress.answers).toEqual([{ step: FIRST_CHASM, level: 1, topic: TOPIC, result: 'fits' }]);
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
    expect(progress.answers).toEqual([{ step: FIRST_CHASM, level: 1, topic: TOPIC, result }]);
    expect(cues).toEqual([result]);
  });

  it('saves a checkpoint after every step, pointing at the step to play next', () => {
    play();
    done();
    last().report({ kind: 'choice', index: DECLINE });
    done();
    pickRight();
    expect(saves.map((saved) => saved.step)).toEqual([1, FIRST_CHASM - 1, FIRST_CHASM, FIRST_CHASM + 1]);
    expect(saves.at(-1)).toEqual(progress.toJSON());
    expect(saves.at(-1)?.points).toBe(10);
  });
it('saves checkpoints to actual storage after every step', () => {
  const data = new Map<string, string>();

  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  } as Storage;

  const store = new SaveStore(storage);

  const flow = new GameFlow(steps, progress, makeScreen, {
  save: store.save,
  });

  flow.run();

  expect(store.load()).toBeNull();

  done();
  expect(store.load()?.step).toBe(1);

  // Turn down the supply shop, then finish the crossing scene.
  screens[screens.length - 1].report({ kind: 'choice', index: DECLINE });
  done();
  expect(store.load()?.step).toBe(FIRST_CHASM);

  pickRight();

  expect(store.load()?.step).toBe(FIRST_CHASM + 1);
  expect(store.load()?.points).toBe(10);
  expect(store.load()).toEqual(progress.toJSON());

  expect(data.has('math-mountaineer-save')).toBe(true);
});
  it('plays the whole game through to the medal', () => {
    play();
    playToMedal(DUEL_RESULT.notWon);
    expect(last().request).toEqual({ kind: 'medal', points: 200 });
    expect(kinds().filter((kind) => kind === 'chasm')).toHaveLength(15);
    expect(kinds().filter((kind) => kind === 'levelDone')).toHaveLength(2);
    expect(kinds().filter((kind) => kind === 'shopGame')).toHaveLength(2);
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
    expect(last().request).toEqual({ kind: 'shopOffer', shop: 'clothing' });
    expect(progress.points).toBe(20);
  });

  it('moves on from Level done after every point, where choice 0 means continue', () => {
    play(steps, FIRST_CHASM);
    playLevel1(5);
    last().report({ kind: 'choice', index: 0 });
    expect(last().request).toEqual({ kind: 'shopOffer', shop: 'clothing' });
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
    progress = PlayerProgress.fromJSON({ version: 2, seed: SEED, level: 1, step: FIRST_CHASM + 2, points: 20, topic: TOPIC, answers: [] });
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

// A short script with the supply shop between the intro and the crossing tutorial, as in
// the real one. It ends with a Level done step, since a duel needs one to skip to.
const SHOP_SCRIPT: Step[] = [
  { kind: 'dialogue', script: 'intro' },
  { kind: 'shopOffer', shop: 'supplies' },
  { kind: 'shopGame', shop: 'supplies' },
  { kind: 'dialogue', script: 'howCrossingWorks' },
  { kind: 'levelDone', level: 1 },
];
const OFFER = 1;
const pickOffer = (index: number) => last().report({ kind: 'choice', index });

describe('controller/GameFlow shop offers (#52, #53)', () => {
  it('opens the shop’s mini-game when the player accepts', () => {
    play(SHOP_SCRIPT, OFFER);
    pickOffer(ACCEPT);
    expect(screens.map((screen) => screen.request)).toEqual([
      { kind: 'shopOffer', shop: 'supplies' },
      { kind: 'shopGame', shop: 'supplies', question: makeDuelQuestion(SEED) },
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
    play([{ kind: 'dialogue', script: 'intro' }, ...ZIPLINE_SCRIPT.slice(0, 2)], OFFER);
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

// Issue #175: the zipline shop pays 50 points for the right guess, checked against the
// problem GameFlow put in the request, which is the one the shop showed.
const ZIPLINE_SCRIPT: Step[] = [
  { kind: 'shopOffer', shop: 'clothing' },
  { kind: 'shopGame', shop: 'clothing' },
  { kind: 'medal' },
];
const ZIPLINE = 1;

describe('controller/GameFlow zipline shop (#175)', () => {
  it('gives the shop the zipline problem made from the game’s seed', () => {
    play(ZIPLINE_SCRIPT, ZIPLINE);
    expect(last().request).toEqual({ kind: 'shopGame', shop: 'clothing', problem: makeZiplineProblem(SEED) });
  });

  it('adds 50 points for the right guess, and shows them on the Hud', () => {
    progress.addPoints(20);
    play(ZIPLINE_SCRIPT, ZIPLINE);
    guessZipline(true);
    expect(progress.points).toBe(70);
    expect(hud.showPointsGained).toHaveBeenLastCalledWith(50);
    expect(last().request).toEqual({ kind: 'medal', points: 70 });
  });

  it('adds nothing for a wrong guess', () => {
    play(ZIPLINE_SCRIPT, ZIPLINE);
    guessZipline(false);
    expect(progress.points).toBe(0);
    expect(hud.showPointsGained).not.toHaveBeenCalledWith(50);
  });

  it('adds nothing when the player turns down the store owner’s deal', () => {
    play(ZIPLINE_SCRIPT, ZIPLINE);
    done();
    expect(progress.points).toBe(0);
    expect(last().request.kind).toBe('medal');
  });

  it('saves the points with the checkpoint after the shop', () => {
    play(ZIPLINE_SCRIPT, ZIPLINE);
    guessZipline(true);
    expect(saves.at(-1)?.points).toBe(50);
  });
});

// Issues #55 and #134: the duel is given the question made from the game's seed, and
// GameFlow carries on from the right place however it ends.
const DUEL = 2;
const REAL_DUEL = steps.findIndex((step) => step.kind === 'shopGame' && step.shop === 'supplies');
/** Where Level 2 starts in the real script: the step after Level 1's Level done. */
const LEVEL_2_START = steps.findIndex((step) => step.kind === 'levelDone' && step.level === 1) + 1;

describe('controller/GameFlow math duel (#55, #134)', () => {
  it('gives the duel the question made from the game’s seed', () => {
    play(SHOP_SCRIPT, DUEL);
    expect(last().request).toEqual({ kind: 'shopGame', shop: 'supplies', question: makeDuelQuestion(SEED) });
  });

  it('gives the same question after a reload, so the duel is the same one', () => {
    play(SHOP_SCRIPT, DUEL);
    const first = last().request;
    progress = PlayerProgress.fromJSON(progress.toJSON());
    play(SHOP_SCRIPT, DUEL);
    expect(last().request).toEqual(first);
  });

  it.each([
    ['turning down the gear', DUEL_RESULT.normalPath],
    ['losing or leaving', DUEL_RESULT.notWon],
  ])('goes on to the crossing scene with no points after %s', (_, result) => {
    play(steps, REAL_DUEL);
    last().report({ kind: 'choice', index: result });
    expect(last().request).toEqual({ kind: 'dialogue', script: 'howCrossingWorks' });
    expect(progress.points).toBe(0);
    expect(hud.showPointsGained).not.toHaveBeenCalled();
  });

  it('skips Level 1 on a win with the climb, going straight to the start of Level 2', () => {
    play(steps, REAL_DUEL);
    last().report({ kind: 'choice', index: DUEL_RESULT.skipLevel });
    expect(last().request).toEqual(requestAt(LEVEL_2_START));
    expect(kinds()).not.toContain('chasm');
    expect(kinds()).not.toContain('levelDone');
  });

  it('gives Level 1’s 50 points for skipping it, and shows them on the Hud', () => {
    play(steps, REAL_DUEL);
    last().report({ kind: 'choice', index: DUEL_RESULT.skipLevel });
    expect(progress.points).toBe(50);
    expect(hud.showPointsGained).toHaveBeenCalledWith(50);
    expect(hud.update).toHaveBeenLastCalledWith(progress, undefined);
  });

  it('saves the skip, so a reload continues at the start of Level 2 with the points', () => {
    play(steps, REAL_DUEL);
    last().report({ kind: 'choice', index: DUEL_RESULT.skipLevel });
    expect(saves.at(-1)).toMatchObject({ step: LEVEL_2_START, points: 50 });
  });

  it('counts the skipped level’s points in the medal at the end', () => {
    play();
    playToMedal(DUEL_RESULT.skipLevel);
    // 50 for skipping Level 1, 100 for Levels 2 and 3, and 50 for the zipline.
    expect(last().request).toEqual({ kind: 'medal', points: 200 });
    expect(kinds().filter((kind) => kind === 'chasm')).toHaveLength(10);
    expect(kinds().filter((kind) => kind === 'levelDone')).toHaveLength(1);
  });

  it('throws a clear error for a script where the duel has no Level done after it', () => {
    const script: Step[] = SHOP_SCRIPT.slice(0, 4);
    expect(() => play(script)).toThrow("The supply shop's duel at step 2 needs a Level done step after it");
  });
});

/** What GameFlow asks for at `index` of the real script, for steps that need nothing from the seed. */
function requestAt(index: number): ScreenRequest {
  const step = steps[index];
  if (step.kind !== 'shopOffer') throw new Error(`Step ${index} isn't a shop offer.`);
  return { kind: 'shopOffer', shop: step.shop };
}

// Optional documentation
// - Stand-in screen: an object with the same start/stop methods as a real screen, which records what it was asked for and reports only when the test calls report().
// - vi.fn<Hud['update']>(): a stand-in function with the same type as the Hud's method that records each call, so a test can check it with toHaveBeenLastCalledWith.
// - toMatchObject({ step, points }): passes when the object has at least these values, ignoring its other fields.
// - steps.findIndex(...): the position of the first step the function returns true for, so the tests don't break when a scene is added before the first chasm.
// - play(steps, FIRST_CHASM): starts at the first chasm, as if loading a save there.
// - expect(fn).not.toHaveBeenCalled(): passes when the stand-in function was never called.
// - saves.at(-1)?.step: the step the latest checkpoint points at; `?.` gives undefined instead of failing if nothing was saved.
// - SHOP_SCRIPT.slice(0, 3): a copy of the first three steps, so the mini-game is the last one.
// - it.each([...] as [string, Step[]][])(name, fn): runs the same test once per row, passing the row's items to fn; %s in the name is filled in from the row, and the `as` tells TypeScript each row is a label and a script.
// - (_, script) =>: `_` names a parameter the test doesn't use, here the row's label.
// - expect(() => ...).toThrow(text): passes only if calling the function throws an error whose message contains `text`.
describe('level attempt history (#87)', () => {
  it('keeps both scores after restarting a level and loading a save', () => {
    play(steps, steps.findIndex((step) => step.kind === 'chasm'));

    // First attempt: one correct answer, four wrong.
    pickRight();
    for (let i = 0; i < 4; i++) pickWrong();

    expect(progress.levelAttempts).toEqual([
      { level: 1, points: 10 },
    ]);

    // Restart, then answer all five correctly.
    last().report({ kind: 'choice', index: 0 });
    for (let i = 0; i < 5; i++) pickRight();

    const expected = [
      { level: 1, points: 10 },
      { level: 1, points: 50 },
    ];

    expect(progress.levelAttempts).toEqual(expected);

    // Reload at Level done: neither lose nor duplicate an attempt.
    progress = PlayerProgress.fromJSON(saves.at(-1)!);
    screens = [];
    play();

    expect(last().request.kind).toBe('levelDone');
    expect(progress.levelAttempts).toEqual(expected);
  });

  it('records all three levels, including the final level before the medal', () => {
    play();

    while (last().request.kind !== 'medal') {
      if (last().request.kind === 'chasm') pickRight();
      else done();
    }

    const expected = [
      { level: 1, points: 50 },
      { level: 2, points: 50 },
      { level: 3, points: 50 },
    ];

    expect(progress.levelAttempts).toEqual(expected);
    expect(saves.at(-1)?.levelAttempts).toEqual(expected);
  });
});