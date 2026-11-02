import { describe, expect, it } from 'vitest';
import { dialogueScripts } from '../../src/content/dialogueScripts';
import { levelDoneLines } from '../../src/model/levelDone';

/**
 * Checks the Level done dialogue (issue #44): a player with every point on the level
 * is congratulated, anyone short of that is offered a restart, and the level number is
 * filled into the words. The tests call `levelDoneLines` with made-up points, so they
 * need no screen. They also pin the order of the restart offer's choices, since GameFlow
 * reads the choice by position. Limit: how the lines look in the dialog box still needs
 * a check in the browser once the DialogueController (#18) can show them.
 */

describe('levelDoneLines', () => {
  it('congratulates a player who earned every point, with one button to continue', () => {
    expect(levelDoneLines(1, 50, 50)).toEqual([
      {
        speaker: 'Narrator',
        text: 'Congratulations! You earned all the points on Level 1.',
        choices: ['Continue along the trail'],
      },
    ]);
  });

  it('offers a restart when the player missed a chasm, with restart as choice 0 and continue as choice 1', () => {
    expect(levelDoneLines(1, 40, 50)).toEqual([
      {
        speaker: 'Narrator',
        text: 'Do you want to restart Level 1 so you can get closer to earning your desired medal?',
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
    expect(levelDoneLines(2, 40, 50)[0].choices).toEqual(['Begin level 2 again', 'Continue on to next level']);
    expect(dialogueScripts.levelDoneUnder100[0].text).toContain('{level}');
  });
});

// Optional documentation
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
// - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws.
// - expect(value).toEqual(expected): throws, failing the test, unless the two values have the same contents (toBe would check they are the same object and always fail for a new array).
// - expect(array).toHaveLength(n): passes if the array has exactly n items.
// - for (const level of [1, 2]): runs the block once for each value in the array.
// - JSON.stringify(value).toLowerCase(): turns the lines into one lowercase string, so a single check can search every text and choice, whether it says "Level 2" or "level 2".
// - expect(value, message): the message is shown if the check fails, here naming the case that broke.
// - .not.toContain(text) / .toContain(text): passes if the string does not (or does) include text.
// - `level ${level}`: a template string; the value inside ${ } is inserted into the text.
