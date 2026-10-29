import type { checkPick } from './problems';

/** How a picked log compared to the gap: what `checkPick` returns. */
export type Fit = ReturnType<typeof checkPick>;

/** One pick the player made: which step it was on and how the log fit. */
export interface PickResult {
  step: number;
  result: Fit;
}

/** Where the player is in the game's script: the level and topic of the current step. */
export interface Place {
  level: number;
  topic: string;
}

/**
 * PlayerProgress as plain data, safe for `JSON.stringify`. SaveStore stores this.
 * `version` lets a later save format tell old saves apart.
 */
export interface SavedProgress {
  version: 1;
  seed: number;
  level: number;
  step: number;
  points: number;
  topic: string;
  answers: PickResult[];
}

/**
 * What everything except GameFlow sees: the values without any way to change them.
 * Pass this type to the Hud and screens so only GameFlow can call `addPoints` and `moveTo`.
 */
export type ProgressView = Pick<
  PlayerProgress,
  'seed' | 'level' | 'step' | 'points' | 'topic' | 'answers'
>;

const FITS: readonly Fit[] = ['fits', 'tooShort', 'tooLong'];

/**
 * Where the player is and how they're doing. GameFlow owns it and is the only
 * thing that changes it; the Hud and saving read from it.
 *
 * `seed` never changes during a game, so a loaded save rebuilds the same chasms
 * with `makeChasm(seed, level, index)`.
 */
export class PlayerProgress {
  readonly seed: number;
  private _level: number;
  private _step: number;
  private _points: number;
  private _topic: string;
  private _answers: PickResult[];

  /** A new game: level 1, step 0, no points and no answers yet. */
  constructor(seed: number, place: Place = { level: 1, topic: '' }) {
    checkWholeNumber('seed', seed, 0);
    checkPlace(place);
    this.seed = seed;
    this._level = place.level;
    this._topic = place.topic;
    this._step = 0;
    this._points = 0;
    this._answers = [];
  }

  get level(): number {
    return this._level;
  }

  /** The position of the current step in the game's list of steps. */
  get step(): number {
    return this._step;
  }

  get points(): number {
    return this._points;
  }

  get topic(): string {
    return this._topic;
  }

  /** Every pick so far, oldest first. Read-only so callers can't change the record. */
  get answers(): readonly PickResult[] {
    return this._answers;
  }

  /** Adds `n` points. A negative `n` spends points, but never below 0. */
  addPoints(n: number): void {
    if (!Number.isInteger(n)) {
      throw new Error('Points must be a whole number');
    }
    if (this._points + n < 0) {
      throw new Error('Not enough points');
    }
    this._points += n;
  }

  /**
   * Moves to another step. Pass `place` when the step starts a new level or topic;
   * leave it out to stay on the same level, such as the next chasm.
   */
  moveTo(step: number, place?: Place): void {
    checkWholeNumber('step', step, 0);
    if (place) {
      checkPlace(place);
      this._level = place.level;
      this._topic = place.topic;
    }
    this._step = step;
  }

  /** Records a pick on the current step. */
  recordAnswer(result: Fit): void {
    if (!FITS.includes(result)) {
      throw new Error(`Unknown pick result: ${String(result)}`);
    }
    this._answers.push({ step: this._step, result });
  }

  /** Plain data for saving. Returns copies, so changing them doesn't change the progress. */
  toJSON(): SavedProgress {
    return {
      version: 1,
      seed: this.seed,
      level: this._level,
      step: this._step,
      points: this._points,
      topic: this._topic,
      answers: this._answers.map((answer) => ({ ...answer })),
    };
  }

  /**
   * Rebuilds progress from saved data. Throws if the data isn't a valid save,
   * such as a save edited by hand or from an older version of the game.
   */
  static fromJSON(saved: SavedProgress): PlayerProgress {
    if (typeof saved !== 'object' || saved === null) {
      throw new Error('Saved progress must be an object');
    }
    if (saved.version !== 1) {
      throw new Error(`Unknown save version: ${String(saved.version)}`);
    }
    checkWholeNumber('points', saved.points, 0);
    if (!Array.isArray(saved.answers)) {
      throw new Error('answers must be a list');
    }
    for (const answer of saved.answers) {
      if (typeof answer !== 'object' || answer === null || !FITS.includes(answer.result)) {
        throw new Error('Saved answers are not valid');
      }
      checkWholeNumber('answer step', answer.step, 0);
    }

    const progress = new PlayerProgress(saved.seed, { level: saved.level, topic: saved.topic });
    progress.moveTo(saved.step);
    progress._points = saved.points;
    progress._answers = saved.answers.map((answer) => ({ step: answer.step, result: answer.result }));
    return progress;
  }
}

function checkWholeNumber(name: string, value: unknown, min: number): void {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min) {
    throw new Error(`${name} must be a whole number of at least ${min}`);
  }
}

function checkPlace(place: Place): void {
  checkWholeNumber('level', place.level, 1);
  if (typeof place.topic !== 'string') {
    throw new Error('topic must be text');
  }
}
