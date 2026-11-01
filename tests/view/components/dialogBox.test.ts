import Konva from 'konva';
import { describe, expect, it } from 'vitest';
import { colors } from '../../../src/view/theme';
import { createDialogBox } from '../../../src/view/components/dialogBox';

/**
 * Checks what the dialogue and "Level done" screens rely on from the Dialog box:
 * it shows the line it's given, makes one button per choice (the first one
 * primary), reports a click by the choice's position, stays pinned to the bottom
 * of the 960 x 540 stage as its height changes, and refuses more than three
 * choices. Clicks are fired straight on the buttons, so no stage is needed.
 * Limit: how it looks on screen still needs a check in the browser.
 */

const background = (box: Konva.Group) => box.getChildren()[0] as Konva.Rect;
const message = (box: Konva.Group) => box.getChildren()[1] as Konva.Text;
const buttonsOf = (box: Konva.Group) => (box.getChildren()[2] as Konva.Group).getChildren() as Konva.Group[];
const fillOf = (button: Konva.Group) => (button.findOne('Rect') as Konva.Rect).fill();
const bottomOf = (box: Konva.Group) => box.y() + background(box).height();

const SHORT = 'You are a famous mountaineer.';
const LONG = 'You will need to cross deep chasms. At each one there are a few fallen logs. Pick the one that is exactly the right length. Too short and it falls into the chasm. Too long and it smashes the item your friend left on the other side.';

describe('createDialogBox', () => {
  it('shows the line it is given', () => {
    const box = createDialogBox(() => {});
    box.show(SHORT, ['Continue']);
    expect(message(box.group).text()).toBe(SHORT);
  });

  it('makes one button per choice, with only the first one primary', () => {
    const box = createDialogBox(() => {});
    box.show(SHORT, ['Yes', 'No', 'Maybe']);
    expect(buttonsOf(box.group).map(fillOf)).toEqual([colors.teal, colors.white, colors.white]);
  });

  it('reports a click by the choice position', () => {
    const picked: number[] = [];
    const box = createDialogBox((index) => picked.push(index));
    box.show(SHORT, ['Yes', 'No', 'Maybe']);
    buttonsOf(box.group)[1].fire('click');
    buttonsOf(box.group)[2].fire('click');
    expect(picked).toEqual([1, 2]);
  });

  it('stays on the bottom of the stage, and grows taller for a longer line', () => {
    const box = createDialogBox(() => {});
    box.show(SHORT, ['Continue']);
    const shortHeight = background(box.group).height();
    expect(bottomOf(box.group)).toBe(540);

    box.show(LONG, ['Continue']);
    expect(background(box.group).height()).toBeGreaterThan(shortHeight);
    expect(bottomOf(box.group)).toBe(540);
  });

  it('closes up under the text when there are no choices', () => {
    const box = createDialogBox(() => {});
    box.show(SHORT, ['Continue']);
    const withButton = background(box.group).height();
    box.show(SHORT, []);
    expect(buttonsOf(box.group)).toHaveLength(0);
    expect(background(box.group).height()).toBeLessThan(withButton);
    expect(bottomOf(box.group)).toBe(540);
  });

  it('replaces the old buttons when it shows a new line', () => {
    const box = createDialogBox(() => {});
    box.show(SHORT, ['Yes', 'No', 'Maybe']);
    box.show(SHORT, ['Continue']);
    expect(buttonsOf(box.group)).toHaveLength(1);
  });

  it('refuses more than three choices', () => {
    const box = createDialogBox(() => {});
    expect(() => box.show(SHORT, ['A', 'B', 'C', 'D'])).toThrow(RangeError);
  });
});

// Optional documentation
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
// - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws.
// - box.getChildren()[0]: the group's nodes in the order they were added (background, then text, then the row of buttons); `as Konva.Rect` tells TypeScript which kind it is.
// - .map(fillOf): makes a new array holding each button's background color.
// - button.fire('click'): triggers the button's click handlers directly, as if it had been clicked.
// - expect(value).toBe(expected) / toEqual(expected): throw, failing the test, unless the values are equal; toEqual compares arrays item by item.
// - toHaveLength(n): passes when the array has exactly n items.
// - toBeGreaterThan / toBeLessThan: compare two numbers.
// - expect(() => ...).toThrow(RangeError): passes only if calling the function throws that kind of error; the arrow stops it from running before expect is ready.
