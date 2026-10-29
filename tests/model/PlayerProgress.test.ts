import { describe, it, expect } from 'vitest';
import { PlayerProgress, type SavedProgress } from '../../src/model/PlayerProgress';

const level1 = { level: 1, topic: 'Pythagorean theorem in 2D' };
const level2 = { level: 2, topic: 'Pythagorean theorem in 3D' };

describe('PlayerProgress', () => {
  it('starts a new game at step 0 with no points or answers', () => {
    const progress = new PlayerProgress(42, level1);

    expect(progress.seed).toBe(42);
    expect(progress.level).toBe(1);
    expect(progress.topic).toBe('Pythagorean theorem in 2D');
    expect(progress.step).toBe(0);
    expect(progress.points).toBe(0);
    expect(progress.answers).toEqual([]);
  });

  it('moves to the next chasm and keeps the same level and topic', () => {
    const progress = new PlayerProgress(42, level1);

    progress.moveTo(1);

    expect(progress.step).toBe(1);
    expect(progress.level).toBe(1);
    expect(progress.topic).toBe('Pythagorean theorem in 2D');
  });

  it('moves to the next level and changes the level and topic', () => {
    const progress = new PlayerProgress(42, level1);
    progress.moveTo(5);

    progress.moveTo(6, level2);

    expect(progress.step).toBe(6);
    expect(progress.level).toBe(2);
    expect(progress.topic).toBe('Pythagorean theorem in 3D');
  });

  it('keeps points when moving between steps and levels', () => {
    const progress = new PlayerProgress(42, level1);
    progress.addPoints(10);
    progress.moveTo(1);
    progress.addPoints(5);
    progress.moveTo(2, level2);

    expect(progress.points).toBe(15);
  });

  it('spends points but never goes below 0', () => {
    const progress = new PlayerProgress(42, level1);
    progress.addPoints(10);
    progress.addPoints(-4);

    expect(progress.points).toBe(6);
    expect(() => progress.addPoints(-7)).toThrow();
    expect(progress.points).toBe(6);
  });

  it('records each pick with the step it was made on', () => {
    const progress = new PlayerProgress(42, level1);
    progress.recordAnswer('tooShort');
    progress.recordAnswer('fits');
    progress.moveTo(1);
    progress.recordAnswer('fits');

    expect(progress.answers).toEqual([
      { step: 0, result: 'tooShort' },
      { step: 0, result: 'fits' },
      { step: 1, result: 'fits' },
    ]);
  });

  it('rejects bad values', () => {
    const progress = new PlayerProgress(42, level1);

    expect(() => progress.addPoints(1.5)).toThrow();
    expect(() => progress.moveTo(-1)).toThrow();
    expect(() => progress.moveTo(1, { level: 0, topic: 'x' })).toThrow();
    expect(() => new PlayerProgress(-1)).toThrow();
  });
});

describe('PlayerProgress saving', () => {
  function playedGame(): PlayerProgress {
    const progress = new PlayerProgress(1234, level1);
    progress.recordAnswer('tooLong');
    progress.recordAnswer('fits');
    progress.addPoints(10);
    progress.moveTo(7, level2);
    progress.recordAnswer('fits');
    progress.addPoints(20);
    return progress;
  }

  it('turns into plain data and back without losing anything', () => {
    const progress = playedGame();

    const text = JSON.stringify(progress);
    const loaded = PlayerProgress.fromJSON(JSON.parse(text));

    expect(loaded.toJSON()).toEqual(progress.toJSON());
    expect(loaded.seed).toBe(1234);
    expect(loaded.level).toBe(2);
    expect(loaded.topic).toBe('Pythagorean theorem in 3D');
    expect(loaded.step).toBe(7);
    expect(loaded.points).toBe(30);
    expect(loaded.answers).toHaveLength(3);
  });

  it('keeps playing normally after loading', () => {
    const loaded = PlayerProgress.fromJSON(playedGame().toJSON());

    loaded.moveTo(8);
    loaded.addPoints(5);
    loaded.recordAnswer('tooShort');

    expect(loaded.step).toBe(8);
    expect(loaded.points).toBe(35);
    expect(loaded.answers.at(-1)).toEqual({ step: 8, result: 'tooShort' });
  });

  it('does not share data with the saved copy', () => {
    const progress = playedGame();
    const saved = progress.toJSON();

    saved.answers.push({ step: 99, result: 'fits' });
    saved.answers[0].result = 'fits';
    const loaded = PlayerProgress.fromJSON(saved);
    saved.answers.length = 0;

    expect(progress.answers).toHaveLength(3);
    expect(progress.answers[0].result).toBe('tooLong');
    expect(loaded.answers).toHaveLength(4);
  });

  it('rejects data that is not a valid save', () => {
    const good = playedGame().toJSON();
    const bad: unknown[] = [
      null,
      'not a save',
      { ...good, version: 2 },
      { ...good, seed: -1 },
      { ...good, level: 0 },
      { ...good, step: 1.5 },
      { ...good, points: '30' },
      { ...good, topic: undefined },
      { ...good, answers: 'none' },
      { ...good, answers: [{ step: 0, result: 'maybe' }] },
      { ...good, answers: [{ step: -1, result: 'fits' }] },
    ];

    for (const saved of bad) {
      expect(() => PlayerProgress.fromJSON(saved as SavedProgress)).toThrow();
    }
  });
});
