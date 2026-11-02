import type { Step } from '../content/levels';
import { settings } from '../content/settings';
import type { Place, PlayerProgress, SavedProgress } from '../model/PlayerProgress';
import { checkPick, makeChasm, type Chasm } from '../model/problems';
import { pointsFor, type PickResult } from '../model/rules';
import type { Hud } from '../view/Hud';
import type { Outcome, Screen } from './Screen';

/**
 * What GameFlow asks for to play a step: the step with everything its screen needs
 * filled in, such as the chasm made from the game's seed or the points for Level done.
 */
export type ScreenRequest =
  | { kind: 'title' }
  | { kind: 'dialogue'; script: string }
  | { kind: 'chasm'; chasm: Chasm }
  /** `points` is what the player earned on this level alone, out of `possiblePoints`. */
  | { kind: 'levelDone'; level: number; points: number; possiblePoints: number }
  | { kind: 'medal'; points: number };

/** The parts of the game GameFlow keeps up to date. Each is optional, so tests pass only what they check. */
export interface GameFlowOptions {
  hud?: Pick<Hud, 'update' | 'showPointsGained'>;
  /** Stores a checkpoint, such as SaveStore's `save`. */
  save?: (saved: SavedProgress) => void;
  /** Plays the sound for how a pick went. */
  playCue?: (cue: PickResult) => void;
}

/** A seed for a new game. `random` is passed in so tests can get a fixed one. */
export function newSeed(random: () => number = Math.random): number {
  return Math.floor(random() * 2 ** 31);
}

/**
 * Runs the whole game: plays each step in order, one screen at a time, and decides
 * what happens after each one. GameFlow is the only thing that changes PlayerProgress.
 * It gets its screens from `makeScreen`, so tests can swap in stand-ins.
 */
export class GameFlow {
  private screen: Screen | null = null;
  /** Goes up each time a screen starts or stops, so a report from a screen that's no longer current is ignored. */
  private current = 0;

  constructor(
    private readonly steps: readonly Step[],
    private readonly progress: PlayerProgress,
    private readonly makeScreen: (request: ScreenRequest) => Screen,
    private readonly options: GameFlowOptions = {},
  ) {}

  /** Starts playing at `fromStep`: the start of a new game, or the step a loaded save points at. */
  run(fromStep: number = this.progress.step): void {
    if (!this.steps[fromStep]) throw new RangeError(`There is no step ${fromStep}.`);
    this.stop();
    this.progress.moveTo(fromStep, this.placeOf(fromStep));
    this.play(fromStep);
  }

  /** Stops the current screen. Anything it reports afterwards is ignored. */
  stop(): void {
    this.current++;
    this.screen?.stop();
    this.screen = null;
  }

  private play(index: number): void {
    const step = this.steps[index];
    const request = this.requestFor(step);
    this.options.hud?.update(this.progress, step.kind === 'chasm' ? step.index + 1 : undefined);

    const screen = this.makeScreen(request);
    const id = ++this.current;
    this.screen = screen;
    screen.start((outcome) => {
      if (id !== this.current) return;
      const next = this.nextAfter(index, request, outcome);
      // After the last step the game is over, so its screen (the medal) stays up.
      if (next >= this.steps.length) return;
      this.stop();
      this.progress.moveTo(next, this.placeOf(next));
      // The checkpoint points at the step to play next, so a closed tab loses at most that step.
      this.options.save?.(this.progress.toJSON());
      this.play(next);
    });
  }

  private requestFor(step: Step): ScreenRequest {
    switch (step.kind) {
      case 'title':
        return { kind: 'title' };
      case 'dialogue':
        return { kind: 'dialogue', script: step.script };
      case 'chasm':
        return { kind: 'chasm', chasm: makeChasm(this.progress.seed, step.level, step.index) };
      case 'levelDone':
        return {
          kind: 'levelDone',
          level: step.level,
          points: this.levelPoints(step.level),
          possiblePoints: this.chasmStepsOf(step.level).length * settings.pointsPerChasm,
        };
      case 'medal':
        return { kind: 'medal', points: this.progress.points };
    }
  }

  /** Acts on what the screen reported and gives the position of the step to play next. */
  private nextAfter(index: number, request: ScreenRequest, outcome: Outcome): number {
    const step = this.steps[index];
    if (request.kind === 'chasm' && step.kind === 'chasm' && outcome.kind === 'choice') {
      this.score(request.chasm, outcome.index, step.index + 1);
    }
    return index + 1;
  }

  /** The "crossing one chasm" path: check the pick, award its points, record it, and show and play how it went. */
  private score(chasm: Chasm, log: number, chasmNumber: number): void {
    const result = checkPick(chasm, log);
    const points = pointsFor(result, settings);
    this.progress.recordAnswer(result);
    this.progress.addPoints(points);
    this.options.hud?.update(this.progress, chasmNumber);
    this.options.hud?.showPointsGained(points);
    this.options.playCue?.(result);
  }

  /** The level and topic to move to, when the step at `index` is a chasm. */
  private placeOf(index: number): Place | undefined {
    const step = this.steps[index];
    return step.kind === 'chasm' ? { level: step.level, topic: step.topic } : undefined;
  }

  /** Positions in `steps` of the level's chasm steps, in order. */
  private chasmStepsOf(level: number): number[] {
    const positions: number[] = [];
    this.steps.forEach((step, i) => {
      if (step.kind === 'chasm' && step.level === level) positions.push(i);
    });
    return positions;
  }

  /**
   * Points earned on the level, from the latest answer on each of its chasms. Working
   * from the answers keeps it right after a restart, and after loading a save.
   */
  private levelPoints(level: number): number {
    let points = 0;
    for (const position of this.chasmStepsOf(level)) {
      const latest = this.progress.answers.filter((answer) => answer.step === position).at(-1);
      if (latest) points += pointsFor(latest.result, settings);
    }
    return points;
  }
}
// Optional documentation
// - Pick<Hud, 'update' | 'showPointsGained'>: only these two methods of the Hud, so a test can pass a small stand-in instead of a real one.
// - 2 ** 31: 2 to the power of 31; Math.floor(random() * 2 ** 31) gives a whole number from 0 up to about 2 billion.
// - ++this.current: adds 1 and gives the new value, so each screen remembers its own number.
// - switch (step.kind) with a return in every case: TypeScript checks every kind of step is handled.
// - this.options.save?.(...): calls save only if it was passed in; `?.` skips the call when it's undefined.
// - .at(-1): the last item of an array, or undefined when it's empty.
