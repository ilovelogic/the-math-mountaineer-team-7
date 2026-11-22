import type { PickResult } from './rules';

/**
 * One pick the player made: which step it was on, the level and topic it belonged to,
 * and how the log fit. Only `'fits'` is right (see `isRight`). The level and topic are
 * stored rather than looked up from `step`, so results by topic need only the answers.
 */
export interface Answer {
  step: number;
  level: number;
  topic: string;
  result: PickResult;
}

export interface TopicResult {
  topic: string;
  correct: number;
  incorrect: number;
}
/** Score earned in one completed attempt at a level. */
export interface LevelAttempt {
  readonly level: number;
  readonly points: number;
}

export interface LevelResult {
  level: number;
  correct: number;
  total: number;
  skipped?: boolean;
}

/** Where the player is in the game's script: the level and topic of the current step. */
export interface Place {
  level: number;
  topic: string;
}

/**
 * PlayerProgress as plain data, safe for `JSON.stringify`. SaveStore stores this.
 * `version` lets a later save format tell old saves apart. Version 2 added each
 * answer's level and topic; a version 1 save is refused, since its answers lack them.
 */
export interface SavedProgress {
  version: 2;
  seed: number;
  level: number;
  step: number;
  points: number;
  topic: string;
  answers: Answer[];
  levelAttempts?: LevelAttempt[];
  skippedLevels?: number[];
}

/**
 * What everything except GameFlow sees: the values without any way to change them.
 * Pass this type to the Hud and screens so only GameFlow can call `addPoints` and `moveTo`.
 */
export type ProgressView = Pick<
  PlayerProgress,
  'seed' | 'level' | 'step' | 'points' | 'topic' | 'answers' | 'getResults' | 'getLevelResults'
>;

const FITS: readonly PickResult[] = ['fits', 'tooShort', 'tooLong'];

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
  private _answers: Answer[];
  private _levelAttempts: LevelAttempt[] = [];
  private _skippedLevels: number[] = [];


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
  get answers(): readonly Answer[] {
    return this._answers;
  }

  /** Completed level attempts, oldest first. */
  get levelAttempts(): readonly LevelAttempt[] {
    return this._levelAttempts.map((attempt) => ({ ...attempt }));
  }

  getResults(): TopicResult[] {
    const results = new Map<string, TopicResult>();

    for (const answer of this._answers) {
      if (!results.has(answer.topic)) {
        results.set(answer.topic, {
          topic: answer.topic,
          correct: 0,
          incorrect: 0,
        });
      }

      const topicResult = results.get(answer.topic)!;

      if (answer.result === 'fits') {
        topicResult.correct++;
      } else {
        topicResult.incorrect++;
      }
    }

    return Array.from(results.values());
  }

  getLevelResults(): LevelResult[] {
    const results = new Map<number, LevelResult>();
  
    for (const answer of this._answers) {
      if (!results.has(answer.level)) {
        results.set(answer.level, {
          level: answer.level,
          correct: 0,
          total: 0,
        });
      }
  
      const levelResult = results.get(answer.level)!;
      levelResult.total++;
  
      if (answer.result === 'fits') {
        levelResult.correct++;
      }
    }
  
    for (const level of this._skippedLevels) {
      results.set(level, {
        level,
        correct: 0,
        total: 0,
        skipped: true,
      });
    }
  
    return Array.from(results.values()).sort((a, b) => a.level - b.level);
  }
  /** Records a level skipped by winning the supplies duel. */
  skipLevel(level: number): void {
    checkWholeNumber('level', level, 1);

    if (!this._skippedLevels.includes(level)) {
      this._skippedLevels.push(level);
    }
  }

  /** Keeps this attempt's score without replacing earlier attempts. */
  recordLevelAttempt(level: number, points: number): void {
    checkWholeNumber('level', level, 1);
    checkWholeNumber('attempt points', points, 0);
    this._levelAttempts.push({ level, points });
  }

  /** Adds `n` points. `n` can be 0, since a wrong pick earns nothing, but never negative. */
  addPoints(n: number): void {
    checkWholeNumber('points', n, 0);
    this._points += n;
  }

  /**
   * Takes back `n` points, when the player restarts a level and its points are earned again.
   * The answers stay, since they're the record of every pick. Never takes more than the player has.
   */
  removePoints(n: number): void {
    checkWholeNumber('points', n, 0);
    if (n > this._points) {
      throw new Error(`Can't remove ${n} points from ${this._points}`);
    }
    this._points -= n;
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

  /** Records a pick on the current step, with the current level and topic. */
  recordAnswer(result: PickResult): void {
    if (!FITS.includes(result)) {
      throw new Error(`Unknown pick result: ${String(result)}`);
    }
    this._answers.push({ step: this._step, level: this._level, topic: this._topic, result });
  }
  /** Restores a checkpoint without replacing the PlayerProgress object. */
  restore(saved: SavedProgress): void {
    const restored = PlayerProgress.fromJSON(saved);

    if (restored.seed !== this.seed) {
      throw new Error('Checkpoint belongs to a different game');
    }

    this._level = restored.level;
    this._step = restored.step;
    this._points = restored.points;
    this._topic = restored.topic;
    this._answers = restored.answers.map((answer) => ({ ...answer }));
  }
  /** Plain data for saving. Returns copies, so changing them doesn't change the progress. */
  toJSON(): SavedProgress {
    return {
      version: 2,
      seed: this.seed,
      level: this._level,
      step: this._step,
      points: this._points,
      topic: this._topic,
      answers: this._answers.map((answer) => ({ ...answer })),
      levelAttempts: this._levelAttempts.map((attempt) => ({ ...attempt })),
      skippedLevels: [...this._skippedLevels],
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
    if (saved.version !== 2) {
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
      checkPlace(answer);
    }

    const progress = new PlayerProgress(saved.seed, { level: saved.level, topic: saved.topic });
    progress.moveTo(saved.step);
    progress._points = saved.points;
    progress._answers = saved.answers.map(({ step, level, topic, result }) => ({ step, level, topic, result }));

    if (saved.levelAttempts !== undefined) {
      if (!Array.isArray(saved.levelAttempts)) {
        throw new Error('levelAttempts must be a list');
      }

      for (const attempt of saved.levelAttempts) {
        if (typeof attempt !== 'object' || attempt === null) {
          throw new Error('Saved level attempt is not valid');
        }
        progress.recordLevelAttempt(attempt.level, attempt.points);
      }
    }

    if (saved.skippedLevels !== undefined) {
      if (!Array.isArray(saved.skippedLevels)) {
        throw new Error('skippedLevels must be a list');
      }
    
      for (const level of saved.skippedLevels) {
        checkWholeNumber('skipped level', level, 1);
        progress.skipLevel(level);
      }
    }

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
