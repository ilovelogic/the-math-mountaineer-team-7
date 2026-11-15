
import type { Shop, Step } from '../content/levels';
import { settings } from '../content/settings';
import { DECLINE } from '../content/shopText';
import type { Place, PlayerProgress, SavedProgress } from '../model/PlayerProgress';
import { checkPick, makeChasm, type Chasm } from '../model/problems';
import { pointsFor, type PickResult } from '../model/rules';
import type { Hud } from '../view/Hud';
import type { Outcome, Screen } from './Screen';

/** What GameFlow asks for to play a step. */
export type ScreenRequest =
  | { kind: 'dialogue'; script: string }
  | { kind: 'chasm'; chasm: Chasm }
  | { kind: 'levelDone'; level: number; points: number; possiblePoints: number }
  | { kind: 'medal'; points: number }
  | { kind: 'shopOffer'; shop: Shop }
  | { kind: 'shopGame'; shop: Shop };

/** Optional services GameFlow uses. */
export interface GameFlowOptions {
  hud?: Pick<Hud, 'update' | 'showPointsGained'>;

  /** Saves a checkpoint. */
  save?: (saved: SavedProgress) => void;

  /** Loads the latest checkpoint for recovery. */
  load?: () => SavedProgress | null;

  /** Plays the sound for a pick. */
  playCue?: (cue: PickResult) => void;
}

const RESTART = 0;

/** A seed for a new game. */
export function newSeed(random: () => number = Math.random): number {
  return Math.floor(random() * 2 ** 31);
}

/**
 * Runs the game one step at a time.
 * Can recover from a failed screen using a saved checkpoint.
 */
export class GameFlow {
  private screen: Screen | null = null;
  private current = 0;
  private recovering = false;

  constructor(
    private readonly steps: readonly Step[],
    private readonly progress: PlayerProgress,
    private readonly makeScreen: (request: ScreenRequest) => Screen,
    private readonly options: GameFlowOptions = {},
  ) {
    steps.forEach((step, index) => {
      if (step.kind === 'shopOffer') {
        requireShopGameAfter(steps, index, step.shop);
      }
    });
  }

  /** Starts the game at the requested step. */
  run(fromStep: number = this.progress.step): void {
    if (!this.steps[fromStep]) {
      throw new RangeError(`There is no step ${fromStep}.`);
    }

    this.stop();
    this.progress.moveTo(fromStep, this.placeOf(fromStep));
    this.play(fromStep);
  }

  /** Stops the current screen and ignores old callbacks. */
  stop(): void {
    this.current++;
    this.screen?.stop();
    this.screen = null;
  }

  /** Plays a step and handles screen failures. */
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

          // Keep the medal screen visible after the game ends.
          if (next >= this.steps.length) return;

          this.stop();
          this.progress.moveTo(next, this.placeOf(next));

          // Save the checkpoint before starting the next step.
          this.options.save?.(this.progress.toJSON());
        } catch (error) {
          this.recover(error);
          return;
        }

        // Start the next screen outside the catch block.
        // This prevents errors from being handled multiple times.
        this.play(next);
      });
    } catch (error) {
      // A synchronous callback may already have handled the error.
      // Do not attempt recovery a second time.
      if (callbackRan) {
        throw error;
      }

      this.recover(error);
    }
  }

  /**
   * Stops a failed screen and restarts from the latest
   * valid checkpoint.
   */
  private recover(error: unknown): void {
    if (this.recovering) {
      throw error;
    }

    this.stop();

    const saved = this.options.load?.();

    // Cannot recover without a usable checkpoint.
    if (!saved || !this.steps[saved.step]) {
      throw error;
    }

    this.recovering = true;

    try {
      // Restore progress without replacing the shared object.
      this.progress.restore(saved);

      // Restart at the saved step.
      this.run(saved.step);
    } catch {
      // Preserve the original screen failure.
      throw error;
    } finally {
      this.recovering = false;
    }
  }

  /** Creates the screen request for the current step. */
  private requestFor(step: Step): ScreenRequest {
    switch (step.kind) {
      case 'dialogue':
        return { kind: 'dialogue', script: step.script };

      case 'chasm':
        return {
          kind: 'chasm',
          chasm: makeChasm(this.progress.seed, step.level, step.index),
        };

      case 'levelDone':
        return {
          kind: 'levelDone',
          level: step.level,
          points: this.levelPoints(step.level),
          possiblePoints:
            this.chasmStepsOf(step.level).length * settings.pointsPerChasm,
        };

      case 'medal':
        return { kind: 'medal', points: this.progress.points };

      case 'shopOffer':
        return { kind: 'shopOffer', shop: step.shop };

      case 'shopGame':
        return { kind: 'shopGame', shop: step.shop };
    }
  }

  /** Determines which step should play next. */
  private nextAfter(
    index: number,
    request: ScreenRequest,
    outcome: Outcome,
  ): number {
    const step = this.steps[index];

    if (
      request.kind === 'chasm' &&
      step.kind === 'chasm' &&
      outcome.kind === 'choice'
    ) {
      this.score(request.chasm, outcome.index, step.index + 1);
    }

    const missedPoints =
      request.kind === 'levelDone' &&
      request.points < request.possiblePoints;

    if (
      missedPoints &&
      outcome.kind === 'choice' &&
      outcome.index === RESTART
    ) {
      this.progress.removePoints(request.points);
      return this.chasmStepsOf(request.level)[0];
    }

    if (
      request.kind === 'shopOffer' &&
      outcome.kind === 'choice' &&
      outcome.index === DECLINE
    ) {
      return index + 2;
    }

    return index + 1;
  }

  /** Checks a chasm answer and awards points. */
  private score(
    chasm: Chasm,
    log: number,
    chasmNumber: number,
  ): void {
    const result = checkPick(chasm, log);
    const points = pointsFor(result, settings);

    this.progress.recordAnswer(result);
    this.progress.addPoints(points);

    this.options.hud?.update(this.progress, chasmNumber);
    this.options.hud?.showPointsGained(points);
    this.options.playCue?.(result);
  }

  /** Returns the level and topic for a chasm step. */
  private placeOf(index: number): Place | undefined {
    const step = this.steps[index];

    return step.kind === 'chasm'
      ? { level: step.level, topic: step.topic }
      : undefined;
  }

  /** Finds the chasm positions for a level. */
  private chasmStepsOf(level: number): number[] {
    const positions: number[] = [];

    this.steps.forEach((step, i) => {
      if (step.kind === 'chasm' && step.level === level) {
        positions.push(i);
      }
    });

    return positions;
  }

  /** Calculates points earned on the current level. */
  private levelPoints(level: number): number {
    let points = 0;

    for (const position of this.chasmStepsOf(level)) {
      const latest = this.progress.answers
        .filter((answer) => answer.step === position)
        .at(-1);

      if (latest) {
        points += pointsFor(latest.result, settings);
      }
    }

    return points;
  }
}

/**
 * Ensures a shop offer is immediately followed
 * by its corresponding shop mini-game.
 */
function requireShopGameAfter(
  steps: readonly Step[],
  index: number,
  shop: Shop,
): void {
  const next = steps[index + 1];

  if (next?.kind !== 'shopGame' || next.shop !== shop) {
    throw new Error(
      `The ${shop} shop offer at step ${index} must come right before the ${shop} shop's mini-game.`,
    );
  }
}
