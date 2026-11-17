import type { Shop, Step } from '../content/levels';
import { settings } from '../content/settings';
import { DECLINE } from '../content/shopText';
import type { Place, PlayerProgress, SavedProgress } from '../model/PlayerProgress';
import { checkPick, makeChasm, makeDuelQuestion, type Chasm, type DuelQuestion } from '../model/problems';
import { pointsFor, ziplinePoints, type PickResult } from '../model/rules';
import { checkZiplineAnswer, makeZiplineProblem, type ZiplineProblem } from '../model/zipline';
import type { Hud } from '../view/Hud';
import { DUEL_RESULT } from './DuelShopController';
import type { Outcome, Screen } from './Screen';

/**
 * What GameFlow asks for to play a step: the step with everything its screen needs
 * filled in, such as the chasm, duel question or zipline problem made from the game's
 * seed, or the points for Level done. GameFlow makes each problem here, once, so it checks the
 * player's answer against the same problem the screen showed.
 */
export type ScreenRequest =
  | { kind: 'dialogue'; script: string }
  | { kind: 'chasm'; chasm: Chasm }
  /** `points` is what the player earned on this level alone, out of `possiblePoints`. */
  | { kind: 'levelDone'; level: number; points: number; possiblePoints: number }
  | { kind: 'medal'; points: number }
  | { kind: 'shopOffer'; shop: Shop }
  | { kind: 'shopGame'; shop: 'supplies'; question: DuelQuestion }
  | { kind: 'shopGame'; shop: 'clothing'; problem: ZiplineProblem };

/** The parts of the game GameFlow keeps up to date. Each is optional, so tests pass only what they check. */
export interface GameFlowOptions {
  hud?: Pick<Hud, 'update' | 'showPointsGained'>;
  /** Stores a checkpoint, such as SaveStore's `save`. */
  save?: (saved: SavedProgress) => void;
    /** Loads the latest checkpoint for recovery after a screen failure. */
  load?: () => SavedProgress | null;

  /** Plays the sound for how a pick went. */
  playCue?: (cue: PickResult) => void;
}

/** On the "under 100%" Level done message, the first choice restarts the level (see model/levelDone). */
const RESTART = 0;

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
  /** Prevents repeated recovery attempts if the restarted screen fails. */
  private recovering = false;
  constructor(
    private readonly steps: readonly Step[],
    private readonly progress: PlayerProgress,
    private readonly makeScreen: (request: ScreenRequest) => Screen,
    private readonly options: GameFlowOptions = {},
  ) {
    steps.forEach((step, index) => {
      if (step.kind === 'shopOffer') requireShopGameAfter(steps, index, step.shop);
      if (step.kind === 'shopGame' && step.shop === 'supplies') levelDoneAfter(steps, index);
    });
  }

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

  /** Plays one step and recovers from a screen failure when a checkpoint is available. */
  private play(index: number): void {
    let callbackRan = false;

    try {
      const step = this.steps[index];
      const request = this.requestFor(step);

      this.options.hud?.update(
        this.progress,
        step.kind === 'chasm' ? step.index + 1 : undefined,
      );

      const screen = this.makeScreen(request);
      const id = ++this.current;
      this.screen = screen;

      screen.start((outcome) => {
        callbackRan = true;
        if (id !== this.current) return;

        let next: number;

        try {
          next = this.nextAfter(index, request, outcome);

          // After the last step the game is over, so its screen stays visible.
          if (next >= this.steps.length) return;

          this.stop();
          this.progress.moveTo(next, this.placeOf(next));

          // The checkpoint points at the step to play next,
          // so a closed tab loses at most that step.
          this.options.save?.(this.progress.toJSON());
        } catch (error) {
          this.recover(error);
          return;
        }

        // Starting the next screen outside the catch prevents double recovery.
        this.play(next);
      });
    } catch (error) {
      if (callbackRan) throw error;
      this.recover(error);
    }
  }

    /** Stops a failed screen and replays the latest valid checkpoint. */
  private recover(error: unknown): void {
    if (this.recovering) throw error;

    this.stop();

    const saved = this.options.load?.();

    // Without a usable checkpoint, preserve the original error.
    if (!saved || !this.steps[saved.step]) {
      throw error;
    }

    this.recovering = true;

    try {
      // Restore the existing progress object so shared references remain valid.
      this.progress.restore(saved);

      // Replay the saved step instead of the failed screen's current position.
      this.run(saved.step);
    } catch {
      throw error;
    } finally {
      this.recovering = false;
    }
  }

  private requestFor(step: Step): ScreenRequest {
    switch (step.kind) {
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
      case 'shopOffer':
        return { kind: 'shopOffer', shop: step.shop };
      case 'shopGame':
        return step.shop === 'clothing'
          ? { kind: 'shopGame', shop: 'clothing', problem: makeZiplineProblem(this.progress.seed) }
          : { kind: 'shopGame', shop: 'supplies', question: makeDuelQuestion(this.progress.seed) };
    }
  }

  /**
   * Acts on what the screen reported and gives the position of the step to play next.
   * Winning the duel and taking the shortcut skips the rest of the level; every other
   * way the duel ends (turning down the gear, losing, or leaving) goes on to the next step.
   */
  private nextAfter(index: number, request: ScreenRequest, outcome: Outcome): number {
    const step = this.steps[index];
    if (request.kind === 'chasm' && step.kind === 'chasm' && outcome.kind === 'choice') {
      this.score(request.chasm, outcome.index, step.index + 1);

      // Keep each completed attempt, including the final level.
      if (index === this.chasmStepsOf(step.level).at(-1)) {
        this.progress.recordLevelAttempt(
          step.level,
          this.levelPoints(step.level),
        );
      }
    }
    if (request.kind === 'shopGame' && request.shop === 'clothing' && outcome.kind === 'choice') {
      this.scoreZipline(request.problem, outcome.index);
    }
    if (request.kind === 'shopGame' && request.shop === 'supplies' && outcome.kind === 'choice' && outcome.index === DUEL_RESULT.skipLevel) {
      return this.skipLevel(index);
    }
    const missedPoints = request.kind === 'levelDone' && request.points < request.possiblePoints;
    if (missedPoints && outcome.kind === 'choice' && outcome.index === RESTART) {
      // Restarting earns the level's points again, so take back what this attempt earned.
      this.progress.removePoints(request.points);
      return this.chasmStepsOf(request.level)[0];
    }
    // The constructor checked that the shop's mini-game is the next step, so declining
    // skips exactly that step, and the player earns nothing from the shop.
    if (request.kind === 'shopOffer' && outcome.kind === 'choice' && outcome.index === DECLINE) {
      return index + 2;
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

  /**
   * The zipline shop reports the player's guess: the right one earns its points, and a wrong
   * one earns nothing. Leaving before guessing reports no choice, so it never gets here. The
   * next step updates the Hud's total, so only the "+ points" tag is shown here.
   */
  private scoreZipline(problem: ZiplineProblem, guess: number): void {
    const points = ziplinePoints(checkZiplineAnswer(problem, guess), settings);
    this.progress.addPoints(points);
    this.options.hud?.showPointsGained(points);
  }

  /**
   * The duel was won and the player climbed past the rest of the level: award the level's
   * points and give the position of the step after its Level done, the start of the next
   * level. No answers are recorded, since no chasm was played.
   */
  private skipLevel(duelIndex: number): number {
    const levelDone = levelDoneAfter(this.steps, duelIndex);
    const points = this.skippedLevelPoints(levelDone.level);
    this.progress.addPoints(points);
    this.options.hud?.showPointsGained(points);
    return levelDone.position + 1;
  }

  /**
   * Stands in for #58's skip-level rule until it lands: every point the skipped level
   * could have earned, worked out from settings as Level done does (50 for Level 1).
   */
  private skippedLevelPoints(level: number): number {
    return this.chasmStepsOf(level).length * settings.pointsPerChasm;
  }

  /** The level and topic to move to, when the step at `index` is a chasm. */
  private placeOf(index: number): Place | undefined {
  const step = this.steps[index];

  if (step.kind === 'chasm') {
    return { level: step.level, topic: step.topic };
  }

  if (step.kind === 'shopGame' && step.topic) {
    return { level: this.progress.level, topic: step.topic };
  }

  return undefined;
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

/**
 * Declining a shop's offer skips the step after it, so that step must be the same shop's
 * mini-game. Checking when GameFlow is made means a reordered script fails before anything
 * is played, instead of a decline quietly skipping the wrong step.
 */
function requireShopGameAfter(steps: readonly Step[], index: number, shop: Shop): void {
  const next = steps[index + 1];
  if (next?.kind !== 'shopGame' || next.shop !== shop) {
    throw new Error(`The ${shop} shop offer at step ${index} must come right before the ${shop} shop's mini-game.`);
  }
}
// Optional documentation
// - next?.kind: reads kind only if there is a next step; past the end of the list it gives undefined, which fails the check.

/**
 * Winning the duel skips to the step after the next Level done, so a duel must have one
 * after it. Checking when GameFlow is made means a reordered script fails before anything
 * is played, instead of a win having nowhere to go.
 */
function levelDoneAfter(steps: readonly Step[], index: number): { position: number; level: number } {
  for (let position = index + 1; position < steps.length; position++) {
    const step = steps[position];
    if (step.kind === 'levelDone') return { position, level: step.level };
  }
  throw new Error(`The supply shop's duel at step ${index} needs a Level done step after it, for a win to skip to.`);
}
// Optional documentation
// - { position: number; level: number }: gives back two values at once, where the Level done step is and which level it ends.
// - if (step.kind === 'levelDone') return ...: after the check, TypeScript knows the step is a Level done one, so step.level is allowed.
