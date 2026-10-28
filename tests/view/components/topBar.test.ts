import Konva from 'konva';
import { describe, expect, it } from 'vitest';
import { createTopBar } from '../../../src/view/components/topBar';

/**
 * Checks what the Hud relies on from the top bar: it is the full width of the
 * stage, it shows the title, topic, level and points it's given, `update` shows
 * new values, and the right-hand items stay lined up against the right edge
 * whatever their length. Limit: it can't tell whether the colors and font look
 * right, which still needs a look in the browser.
 */

const status = { topic: 'Pythagorean theorem in 2D', level: 1, points: 0 };
const textsOf = (group: Konva.Group) => group.find('Text') as Konva.Text[];
const textOf = (group: Konva.Group, start: string) => textsOf(group).find((node) => node.text().startsWith(start)) as Konva.Text;

describe('createTopBar', () => {
  it('spans the stage width', () => {
    const bar = createTopBar('The Math Mountaineer', status);
    expect((bar.group.findOne('Rect') as Konva.Rect).width()).toBe(960);
  });

  it('shows the title, topic, level and points it is given', () => {
    const bar = createTopBar('The Math Mountaineer', status);
    expect(textsOf(bar.group).map((node) => node.text())).toEqual([
      'The Math Mountaineer',
      'Topic: Pythagorean theorem in 2D',
      'Level 1',
      'Points: 0',
    ]);
  });

  it('shows new values after update', () => {
    const bar = createTopBar('The Math Mountaineer', status);
    bar.update({ ...status, level: 2, points: 30 });
    expect(textOf(bar.group, 'Level').text()).toBe('Level 2');
    expect(textOf(bar.group, 'Points').text()).toBe('Points: 30');
  });

  it('keeps the points 24 px from the right edge as they grow', () => {
    const bar = createTopBar('The Math Mountaineer', status);
    bar.update({ ...status, points: 12345 });
    const points = textOf(bar.group, 'Points');
    expect(points.x() + points.width()).toBeCloseTo(936);
  });

  it('keeps 24 px between the items when the topic gets longer', () => {
    const bar = createTopBar('The Math Mountaineer', status);
    bar.update({ ...status, topic: 'Pythagorean theorem in 3D (box diagonals)' });
    const topic = textOf(bar.group, 'Topic');
    const level = textOf(bar.group, 'Level');
    const points = textOf(bar.group, 'Points');
    expect(level.x() - (topic.x() + topic.width())).toBeCloseTo(24);
    expect(points.x() - (level.x() + level.width())).toBeCloseTo(24);
  });
});

// Optional documentation
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
// - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws.
// - group.find('Text'): every node of that type inside the group, in the order they were added.
// - .map((node) => node.text()): makes a new array holding each node's text.
// - .find((node) => ...): the first item for which the function returns true. (Konva's group.find above is a different method with the same name.)
// - { ...status, level: 2 }: a copy of `status` with `level` replaced.
// - expect(value).toBe(expected) / toEqual(expected): throw, failing the test, unless the values are equal; toEqual compares arrays item by item.
// - toBeCloseTo(n): passes when the number equals n, give or take a tiny rounding difference.
