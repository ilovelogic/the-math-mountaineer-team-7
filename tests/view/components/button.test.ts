import Konva from 'konva';
import { describe, expect, it } from 'vitest';
import { createButton } from '../../../src/view/components/button';

/**
 * Checks what other screens rely on from the shared Button: it shows the label
 * it's given, it's wide enough for that label, and a click or a touchscreen tap
 * calls the callback it was given. Clicks are simulated by firing the event
 * straight on the button, so no stage or browser is needed.
 */

const captionOf = (button: Konva.Group) => button.findOne('Text') as Konva.Text;
const backgroundOf = (button: Konva.Group) => button.findOne('Rect') as Konva.Rect;

describe('createButton', () => {
  it('shows the label it is given', () => {
    expect(captionOf(createButton('Start', () => {})).text()).toBe('Start');
  });

  it('is wide enough for its label, with padding on both sides', () => {
    const short = createButton('Go', () => {});
    const long = createButton('Cross the chasm using the correct log', () => {});
    expect(backgroundOf(short).width()).toBeGreaterThan(captionOf(short).width());
    expect(backgroundOf(long).width()).toBeGreaterThan(backgroundOf(short).width());
  });

  it('calls onClick once per click', () => {
    let clicks = 0;
    const button = createButton('Start', () => clicks++);
    button.fire('click');
    expect(clicks).toBe(1);
  });

  it('calls onClick on a touchscreen tap', () => {
    let taps = 0;
    createButton('Start', () => taps++).fire('tap');
    expect(taps).toBe(1);
  });
});

// Optional documentation
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
// - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws.
// - button.findOne('Text'): the first node of that type inside the button; `as Konva.Text` tells TypeScript which kind it is.
// - expect(value).toBe(expected): throws, failing the test, unless the two values are exactly equal.
// - toBeGreaterThan(other): passes when the value is more than `other`.
// - button.fire('click'): triggers the button's click handlers directly, as if it had been clicked.
