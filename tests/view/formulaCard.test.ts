import Konva from 'konva';
import { describe, expect, it } from 'vitest';
import { hintText } from '../../src/content/hintText';
import { createFormulaCard } from '../../src/view/formulaCard';
import { colors } from '../../src/view/theme';

/**
 * Checks what the chasm screen relies on from the formula card: it shows the formula and
 * caption it's given, in that order, and its white background grows to hold the longer
 * of the two with room around it. It builds real Konva nodes and reads their sizes, so
 * no stage is needed.
 * Limit: whether it looks like the mockup still needs a look with `npm run dev`.
 */

const background = (card: Konva.Group) => card.findOne<Konva.Rect>('Rect')!;
const textNodes = (card: Konva.Group) => card.find<Konva.Text>('Text');

describe('createFormulaCard', () => {
  it('shows the formula, then the caption', () => {
    const card = createFormulaCard(hintText.formula, hintText.caption);
    expect(textNodes(card).map((node) => node.text())).toEqual([hintText.formula, hintText.caption]);
  });

  it('has a white background with an ink border, like the mockup', () => {
    const rect = background(createFormulaCard(hintText.formula, hintText.caption));
    expect([rect.fill(), rect.stroke()]).toEqual([colors.white, colors.ink]);
  });

  it('grows to hold its longer line with room on every side', () => {
    const card = createFormulaCard('x', 'A caption much longer than the formula above it');
    const rect = background(card);
    for (const node of textNodes(card)) {
      expect(node.x()).toBeGreaterThan(0);
      expect(node.y()).toBeGreaterThan(0);
      expect(node.x() + node.width()).toBeLessThan(rect.width());
      expect(node.y() + node.height()).toBeLessThan(rect.height());
    }
  });
});

// Optional documentation
// - card.findOne<Konva.Rect>('Rect'): the first rectangle inside the card, which is its background; the `!` tells TypeScript it's there.
// - card.find<Konva.Text>('Text'): every text node inside the card, in the order they were added.
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
// - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws.
// - expect(value).toEqual(expected): passes when the two values have the same contents, even if they're different arrays.
// - expect(n).toBeGreaterThan(m) / toBeLessThan(m): passes when n is bigger, or smaller, than m.
