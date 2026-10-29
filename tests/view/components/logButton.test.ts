import Konva from 'konva';
import { describe, expect, it } from 'vitest';
import { colors } from '../../../src/view/theme';
import { createLogButton } from '../../../src/view/components/logButton';

/**
 * Checks what the chasm screen relies on from a Log button: it shows its length,
 * a click calls the callback, `setState` switches between the three looks from
 * the mockups, and a used log stops reporting clicks. Clicks are fired straight
 * on the group, so no stage is needed. Limit: whether it looks right on screen
 * still needs a check in the browser.
 */

const backgroundOf = (log: Konva.Group) => log.findOne('Rect') as Konva.Rect;

describe('createLogButton', () => {
  it('shows the label it is given', () => {
    const log = createLogButton('13 m', () => {});
    const caption = log.group.findOne('Text') as Konva.Text;
    expect(caption.text()).toBe('13 m');
  });

  it('is wide enough for its label', () => {
    const short = createLogButton('5 m', () => {});
    const long = createLogButton('125 m', () => {});
    expect(backgroundOf(long.group).width()).toBeGreaterThan(backgroundOf(short.group).width());
  });

  it('calls onClick once per click', () => {
    let clicks = 0;
    const log = createLogButton('13 m', () => clicks++);
    log.group.fire('click');
    expect(clicks).toBe(1);
  });

  it('shows the selected look, and goes back to the default look', () => {
    const log = createLogButton('13 m', () => {});
    log.setState('selected');
    expect(backgroundOf(log.group).fill()).toBe(colors.cream);
    expect(backgroundOf(log.group).stroke()).toBe(colors.orange);
    log.setState('default');
    expect(backgroundOf(log.group).fill()).toBe(colors.white);
    expect(backgroundOf(log.group).stroke()).toBe(colors.ink);
  });

  it('fades a used log and ignores clicks on it', () => {
    let clicks = 0;
    const log = createLogButton('13 m', () => clicks++);
    log.setState('used');
    log.group.fire('click');
    expect(log.group.opacity()).toBe(0.4);
    expect(clicks).toBe(0);
  });

  it('takes clicks again after going from used back to default', () => {
    let clicks = 0;
    const log = createLogButton('13 m', () => clicks++);
    log.setState('used');
    log.setState('default');
    log.group.fire('click');
    expect(clicks).toBe(1);
  });
});

// Optional documentation
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
// - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws.
// - log.group.findOne('Rect'): the first node of that type inside the group, which is the background; `as Konva.Rect` tells TypeScript which kind it is.
// - expect(value).toBe(expected): throws, failing the test, unless the two values are exactly equal.
// - toBeGreaterThan(other): passes when the value is more than `other`.
// - log.group.fire('click'): triggers the group's click handlers directly, as if it had been clicked.
// - fill() / stroke() / opacity(): called with no value, these read the current setting back.
