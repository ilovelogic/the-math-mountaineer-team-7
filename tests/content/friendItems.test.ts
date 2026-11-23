import { describe, expect, it } from 'vitest';
import { friendItems } from '../../src/content/friendItems';
import { steps, type Step } from '../../src/content/levels';
import { IMAGE_FILES } from '../../src/view/assets';

/**
 * Checks issue #218's list of the friend's items: every chasm in `levels` has an item of its
 * own, each level keeps to one theme, and every item's picture is listed in view/assets (whose
 * own test checks that the file exists). It reads the lists only; that the chasm screen draws
 * and names the item is tested in tests/view/ChasmScreen.test.ts.
 */

type ChasmStep = Extract<Step, { kind: 'chasm' }>;
const chasmSteps = steps.filter((step): step is ChasmStep => step.kind === 'chasm');
const allItems = friendItems.flatMap((level) => level.items);

describe('content/friendItems', () => {
  it('has an item for every chasm, and no two chasms share one', () => {
    const shown = chasmSteps.map((step) => friendItems[step.level - 1]?.items[step.index]);
    expect(shown).not.toContain(undefined);
    expect(new Set(shown.map((item) => item.name)).size).toBe(chasmSteps.length);
    expect(new Set(shown.map((item) => item.image)).size).toBe(chasmSteps.length);
  });

  it('gives each level one theme, candy then foreign coins then jewelry, with an item per chasm', () => {
    expect(friendItems.map((level) => level.theme)).toEqual(['candy', 'foreign coins', 'jewelry']);
    friendItems.forEach((level, i) => {
      const chasmsOnLevel = chasmSteps.filter((step) => step.level === i + 1);
      expect(level.items, `Level ${i + 1}`).toHaveLength(chasmsOnLevel.length);
    });
  });

  it('names a picture listed in view/assets for every item', () => {
    for (const item of allItems) {
      expect(Object.keys(IMAGE_FILES), item.name).toContain(item.image);
    }
  });
});

// Optional documentation
// - describe(name, fn) / it(name, fn): describe groups related tests under a name, and each it is one test that fails if any expect inside it fails.
// - expect(value).toBe(x) / .toEqual(x): toBe passes when the two are the very same value, and toEqual when they hold the same contents, as with two arrays.
// - Extract<Step, { kind: 'chasm' }>: the part of the Step type whose kind is 'chasm', so its level and index can be read.
// - filter((step): step is ChasmStep => ...): keeps the chasm steps, and the `step is ChasmStep` part tells TypeScript that's all the result holds.
// - flatMap: runs the function on each level and joins the item lists it returns into one list.
// - friendItems[step.level - 1]?.items[step.index]: the item for that chasm, or undefined if its level has no list, so a missing item fails the test instead of throwing.
// - new Set(list).size: how many different values the list holds, so it equals the list's length only when nothing repeats.
// - expect(list).toHaveLength(n): passes when the list holds exactly n items; the second argument to expect names it in the failure message.
// - expect(list).not.toContain(x) / .toContain(x): passes when the list doesn't, or does, hold x.
// - Object.keys(IMAGE_FILES): the names of every image the game loads.
