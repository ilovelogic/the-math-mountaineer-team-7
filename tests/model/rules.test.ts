import { describe, expect, it } from 'vitest';
import { settings } from '../../src/content/settings';
import { PlayerProgress } from '../../src/model/PlayerProgress';
import { isRight, pointsFor, resultsByTopic, skippedLevelPoints, worthReviewing, ziplinePoints } from '../../src/model/rules';
/**
 * Checks how many points each chasm pick earns (issue #37). `pointsFor` takes
 * the settings as an argument, so the first test passes in made-up settings:
 * if the points came from a hard-coded 10 instead of `settings`, it would fail.
 * The other tests check that both kinds of wrong pick earn nothing.
 */

describe('pointsFor', () => {
  it('awards the points in settings for the log that fits', () => {
    expect(pointsFor('fits', { ...settings, pointsPerChasm: 7 })).toBe(7);
    expect(pointsFor('fits', settings)).toBe(settings.pointsPerChasm);
  });

  it('gives no points for a log that is too short', () => {
    expect(pointsFor('tooShort', settings)).toBe(0);
  });

  it('gives no points for a log that is too long', () => {
    expect(pointsFor('tooLong', settings)).toBe(0);
  });
});

// Issue #63: as with pointsFor, made-up settings catch a hard-coded 50.
describe('ziplinePoints', () => {
  it('awards the points in settings for the right answer', () => {
    expect(ziplinePoints(true, { ...settings, pointsPerZipline: 7 })).toBe(7);
    expect(ziplinePoints(true, settings)).toBe(50);
  });

  it('gives no points for a wrong answer', () => {
    expect(ziplinePoints(false, settings)).toBe(0);
  });
});

// Issue #58: as with pointsFor, made-up settings catch a hard-coded 50.
describe('skippedLevelPoints', () => {
  it('awards the points in settings for skipping the level', () => {
    expect(skippedLevelPoints(true, { ...settings, pointsPerSkippedLevel: 7 })).toBe(7);
    expect(skippedLevelPoints(true, settings)).toBe(50);
  });

  it('gives no points when the level isn’t skipped, after a loss or turning down the gear', () => {
    expect(skippedLevelPoints(false, settings)).toBe(0);
    expect(skippedLevelPoints(false, { ...settings, pointsPerSkippedLevel: 7 })).toBe(0);
  });

  it('matches a perfect Level 1, so skipping it never changes which medal is reachable', () => {
    expect(settings.pointsPerSkippedLevel).toBe(5 * settings.pointsPerChasm);
  });
});

describe('isRight', () => {
  it('counts only the log that fits as right', () => {
    expect(isRight('fits')).toBe(true);
    expect(isRight('tooShort')).toBe(false);
    expect(isRight('tooLong')).toBe(false);
  });
});

// Issue #77: a handful of fixed answers recorded through PlayerProgress, so the expected counts are easy to check by hand.
describe('resultsByTopic', () => {
  const twoD = { level: 1, topic: 'Pythagorean theorem in 2D' };
  const threeD = { level: 2, topic: 'Pythagorean theorem in 3D' };

  function playedGame(): PlayerProgress {
    const progress = new PlayerProgress(42, twoD);
    progress.moveTo(3);
    progress.recordAnswer('tooShort');
    progress.recordAnswer('fits');
    progress.moveTo(4);
    progress.recordAnswer('fits');
    progress.moveTo(9, threeD);
    progress.recordAnswer('tooLong');
    progress.recordAnswer('tooShort');
    progress.recordAnswer('fits');
    return progress;
  }

  it('gives no results before any pick', () => {
    expect(resultsByTopic([])).toEqual([]);
  });

  it('counts right picks out of all picks for each topic, in the order the topics were played', () => {
    expect(resultsByTopic(playedGame().answers)).toEqual([
      { ...twoD, right: 2, total: 3 },
      { ...threeD, right: 1, total: 3 },
    ]);
  });

  it('matches the recorded answers, topic by topic', () => {
    const { answers } = playedGame();

    for (const result of resultsByTopic(answers)) {
      const picks = answers.filter((answer) => answer.topic === result.topic);
      expect(result.total).toBe(picks.length);
      expect(result.right).toBe(picks.filter((answer) => answer.result === 'fits').length);
    }
    const counted = resultsByTopic(answers).reduce((sum, result) => sum + result.total, 0);
    expect(counted).toBe(answers.length);
  });

  it('gives the same results after a save and load', () => {
    const progress = playedGame();
    const loaded = PlayerProgress.fromJSON(JSON.parse(JSON.stringify(progress)));

    expect(resultsByTopic(loaded.answers)).toEqual(resultsByTopic(progress.answers));
  });

  it('counts picks made again after a level restart', () => {
    const progress = playedGame();
    progress.moveTo(3, twoD);
    progress.recordAnswer('fits');

    expect(resultsByTopic(progress.answers)[0]).toEqual({ ...twoD, right: 3, total: 4 });
  });
});

// Optional documentation
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
// - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws.
// - expect(value).toBe(expected): throws, failing the test, unless the two values are exactly equal.
// - resultsByTopic(...).reduce((sum, result) => sum + result.total, 0): adds up every topic's total, which should be every recorded pick.

describe('worthReviewing (#81, #82)', () => {
  const answer = (
    level: number,
    topic: string,
    result: 'fits' | 'tooShort' | 'tooLong',
  ) => ({
    step: level,
    level,
    topic,
    result,
  });

  it('returns null when no answers exist', () => {
    expect(worthReviewing([])).toBeNull();
  });

  it('selects the topic with the lowest correct-answer rate', () => {
    expect(worthReviewing([
      answer(1, '2D', 'fits'),
      answer(1, '2D', 'fits'),
      answer(1, '2D', 'tooShort'),
      answer(2, '3D', 'fits'),
      answer(2, '3D', 'tooLong'),
      answer(2, '3D', 'tooShort'),
    ])).toEqual({ level: 2, topic: '3D' });
  });

  it('breaks ties by choosing the first encountered topic', () => {
    expect(worthReviewing([
      answer(1, '2D', 'fits'),
      answer(1, '2D', 'tooShort'),
      answer(2, '3D', 'fits'),
      answer(2, '3D', 'tooLong'),
    ])).toEqual({ level: 1, topic: '2D' });
  });

  it('returns null for a perfect score', () => {
    expect(worthReviewing([
      answer(1, '2D', 'fits'),
      answer(1, '2D', 'fits'),
      answer(2, '3D', 'fits'),
    ])).toBeNull();
  });

  it('compares percentages rather than total mistakes', () => {
    expect(worthReviewing([
      answer(1, '2D', 'fits'),
      answer(1, '2D', 'fits'),
      answer(1, '2D', 'fits'),
      answer(1, '2D', 'tooShort'),
      answer(2, '3D', 'fits'),
      answer(2, '3D', 'tooLong'),
    ])).toEqual({ level: 2, topic: '3D' });
  });

  it('selects the weakest level when multiple levels share a topic', () => {
    expect(worthReviewing([
      answer(1, 'Pythagorean theorem in 2D', 'fits'),
      answer(1, 'Pythagorean theorem in 2D', 'fits'),
      answer(1, 'Pythagorean theorem in 2D', 'fits'),
      answer(1, 'Pythagorean theorem in 2D', 'tooShort'),
      answer(3, 'Pythagorean theorem in 2D', 'fits'),
      answer(3, 'Pythagorean theorem in 2D', 'tooLong'),
      answer(3, 'Pythagorean theorem in 2D', 'tooShort'),
      answer(3, 'Pythagorean theorem in 2D', 'tooLong'),
    ])).toEqual({
      level: 3,
      topic: 'Pythagorean theorem in 2D',
    });
  });

});
