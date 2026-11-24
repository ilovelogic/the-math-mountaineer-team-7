import { describe, expect, it } from 'vitest';
import { dialogueScripts } from '../../src/content/dialogueScripts';
import { levelDoneLines } from '../../src/model/levelDone';

/**
 * Checks the Level done dialogue: perfect scores, partial scores,
 * restart choices, level numbers, and percentage calculations.
 * The tests use made-up points and do not require a screen.
 */
describe('levelDoneLines', () => {
  it('congratulates a player who earned every point, with one button to continue', () => {
    expect(levelDoneLines(1, 50, 50)).toEqual([
      {
        speaker: 'Narrator',
        text: 'Congratulations! You earned all the points on Level 1. (100%)',
        choices: ['Continue along the trail'],
      },
    ]);
  });

  it('offers a restart when the player missed a chasm, with restart as choice 0 and continue as choice 1', () => {
    expect(levelDoneLines(1, 40, 50)).toEqual([
      {
        speaker: 'Narrator',
        text: 'Do you want to restart Level 1 so you can get closer to earning your desired medal? (80%)',
        choices: ['Begin level 1 again', 'Continue on to next level'],
      },
    ]);
  });

  it('counts anything short of every point, even one, as missing points', () => {
    expect(levelDoneLines(1, 49, 50)[0].choices).toHaveLength(2);
  });

  it('offers a restart when the player earned no points at all', () => {
    expect(levelDoneLines(1, 0, 50)[0].choices).toHaveLength(2);
  });

  it('fills in the level number everywhere and leaves no placeholder behind', () => {
    for (const level of [1, 2]) {
      for (const points of [50, 40]) {
        const words = JSON.stringify(levelDoneLines(level, points, 50)).toLowerCase();
        expect(words, `level ${level}, ${points} points`).not.toContain('{level}');
        expect(words, `level ${level}, ${points} points`).toContain(`level ${level}`);
      }
    }
  });

  it('leaves the content untouched, so the next level still gets its own number', () => {
    levelDoneLines(1, 40, 50);
    expect(levelDoneLines(2, 40, 50)[0].choices).toEqual([
      'Begin level 2 again',
      'Continue on to next level',
    ]);
    expect(dialogueScripts.levelDoneUnder100[0].text).toContain('{level}');
  });

  // Sprint 3: Level completion percentage tests.

  it('shows 100% for a perfect level', () => {
    expect(levelDoneLines(1, 50, 50)[0].text).toContain('(100%)');
  });

  it('rounds the percentage for a partial level', () => {
    expect(levelDoneLines(2, 20, 30)[0].text).toContain('(67%)');
  });

  it('shows 0% when no points are earned', () => {
    expect(levelDoneLines(3, 0, 50)[0].text).toContain('(0%)');
  });

  it('handles zero possible points without dividing by zero', () => {
    expect(levelDoneLines(1, 0, 0)[0].text).toContain('(0%)');
  });
});
