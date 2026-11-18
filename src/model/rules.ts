import { Settings } from '../content/settings';
import type { Answer } from './PlayerProgress';

/** How a picked log compares to the gap it has to cross. */
export type PickResult = 'fits' | 'tooShort' | 'tooLong';

/**
 * Only the log that fits earns points, since a short log falls into the chasm
 * and a long one smashes the item waiting on the other side.
 */
export function pointsFor(result: PickResult, settings: Settings): number {
  if (result === 'fits') return settings.pointsPerChasm;
  return 0;
}

/** The zipline shop pays only for the right answer; a wrong one, or leaving, earns nothing. */
export function ziplinePoints(right: boolean, settings: Settings): number {
  return right ? settings.pointsPerZipline : 0;
}

/**
 * Winning the math duel and taking the shortcut skips the level and earns its points.
 * Every other ending earns nothing and changes nothing: turning down the gear, a wrong
 * answer, the store owner finishing first (a loss, like a wrong answer), or leaving.
 */
export function skippedLevelPoints(skipped: boolean, settings: Settings): number {
  return skipped ? settings.pointsPerSkippedLevel : 0;
}

/** Whether a pick was right: only the log that fits is. */
export function isRight(result: PickResult): boolean {
  return result === 'fits';
}

/** How the player did on one topic: how many picks were right out of how many were made. */
export interface TopicResult {
  level: number;
  topic: string;
  right: number;
  total: number;
}

/**
 * Counts the picks per topic, for the end screen's results. Every pick counts, including
 * ones made again after a level restart. Topics come in the order they were first played.
 */
export function resultsByTopic(answers: readonly Answer[]): TopicResult[] {
  const byTopic = new Map<string, TopicResult>();
  for (const answer of answers) {
    let counts = byTopic.get(answer.topic);
    if (!counts) {
      counts = { level: answer.level, topic: answer.topic, right: 0, total: 0 };
      byTopic.set(answer.topic, counts);
    }
    counts.total += 1;
    if (isRight(answer.result)) counts.right += 1;
  }
  return [...byTopic.values()];
}
/**
 * Finds the level with the lowest correct-answer rate.
 * Ties favor the level encountered first.
 * Returns null when there are no mistakes.
 */
export function worthReviewing(
  answers: readonly Answer[],
): { level: number; topic: string } | null {
  const byLevel = new Map<number, TopicResult>();

  for (const answer of answers) {
    let counts = byLevel.get(answer.level);

    if (!counts) {
      counts = {
        level: answer.level,
        topic: answer.topic,
        right: 0,
        total: 0,
      };
      byLevel.set(answer.level, counts);
    }

    counts.total += 1;
    if (isRight(answer.result)) {
      counts.right += 1;
    }
  }

  let weakest: TopicResult | null = null;

  for (const result of byLevel.values()) {
    // Cross-multiplication compares correct-answer rates without division.
    // For example, a/b < c/d is equivalent to a*d < c*b.
    if (
      weakest === null ||
      result.right * weakest.total < weakest.right * result.total
    ) {
      weakest = result;
    }
  }

  if (!weakest || weakest.right === weakest.total) {
    return null;
  }

  return {
    level: weakest.level,
    topic: weakest.topic,
  };
}