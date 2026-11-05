import Konva from 'konva';
import { describe, expect, it } from 'vitest';
import { createRightTriangle, type RightTriangleOptions } from '../../../src/view/components/rightTriangle';

/**
 * Checks what the screens in #48, #55 and #84 rely on from the shared right
 * triangle: it shows the labels it's given, it keeps the same shape whatever
 * lengths its legs have, it puts the longer leg's label on the longer drawn
 * side, its right-angle mark shrinks on small triangles, and it throws for
 * sizes or lengths it can't draw. It builds real Konva nodes (node-canvas
 * stands in for the browser) and reads their text, points and positions.
 * Limit: it can't tell whether the drawing looks right, which still needs a
 * look with `npm run dev`.
 */

const CHASM: RightTriangleOptions = {
  width: 350,
  height: 120,
  a: { length: 5, label: '5 m' },
  b: { length: 12, label: '12 m' },
  c: 'c = ?',
};

const texts = (triangle: Konva.Group) => triangle.find<Konva.Text>('Text').map((node) => node.text());
const outline = (triangle: Konva.Group) => triangle.find<Konva.Line>('Line').map((line) => line.points());
const rightAngleMark = (triangle: Konva.Group) => triangle.findOne('Rect') as Konva.Rect;

/** The tag holding `label`, which is the Text's parent group. */
function tagWith(triangle: Konva.Group, label: string): Konva.Node {
  const node = triangle.find<Konva.Text>('Text').find((t) => t.text() === label);
  if (!node) throw new Error(`No tag says "${label}"`);
  return node.getParent()!;
}

/**
 * True when the tag sits on the bottom side, false when it sits beside the right side. It
 * compares the tag's center, since the bottom tag overlaps the line and its top edge is above it.
 */
function isOnBottom(triangle: Konva.Group, label: string, height: number): boolean {
  const tag = tagWith(triangle, label);
  return tag.y() + tag.height() / 2 > height;
}

describe('createRightTriangle', () => {
  it('shows the labels it is given, whatever the units', () => {
    const triangle = createRightTriangle({ ...CHASM, a: { length: 5, label: '5 km' }, b: { length: 12, label: '12 km' }, c: 'c = 13 km' });
    expect(texts(triangle).sort()).toEqual(['12 km', '5 km', 'c = 13 km']);
  });

  it('keeps the same shape for long and short legs', () => {
    const short = createRightTriangle(CHASM);
    const long = createRightTriangle({ ...CHASM, a: { length: 500, label: '500 m' }, b: { length: 1200, label: '1200 m' } });
    expect(outline(long)).toEqual(outline(short));
    expect(outline(short)).toEqual([
      [0, 120, 350, 120, 350, 0],
      [0, 120, 350, 0],
    ]);
  });

  it('puts the longer leg on the bottom of a wide triangle, in either order', () => {
    expect(isOnBottom(createRightTriangle(CHASM), '12 m', 120)).toBe(true);
    const swapped = createRightTriangle({ ...CHASM, a: CHASM.b, b: CHASM.a });
    expect(isOnBottom(swapped, '12 m', 120)).toBe(true);
    expect(isOnBottom(swapped, '5 m', 120)).toBe(false);
  });

  it('puts the longer leg on the right side of a tall triangle', () => {
    const tall = createRightTriangle({ ...CHASM, width: 120, height: 350 });
    expect(isOnBottom(tall, '12 m', 350)).toBe(false);
    expect(isOnBottom(tall, '5 m', 350)).toBe(true);
  });

  it('keeps the mockup-sized right-angle mark at the chasm size and on bigger triangles', () => {
    expect(rightAngleMark(createRightTriangle(CHASM)).width()).toBe(16);
    expect(rightAngleMark(createRightTriangle({ ...CHASM, width: 700, height: 240 })).width()).toBe(16);
  });

  it('shrinks the right-angle mark on a small triangle and keeps it in the corner', () => {
    const mark = rightAngleMark(createRightTriangle({ ...CHASM, width: 60, height: 30 }));
    expect(mark.width()).toBe(4);
    expect(mark.height()).toBe(4);
    expect(mark.x()).toBe(56);
    expect(mark.y()).toBe(26);
  });

  it('draws the smallest triangle that is still positive', () => {
    expect(() => createRightTriangle({ ...CHASM, width: 0.5, height: 0.5, a: { length: 0.1, label: 'a' }, b: { length: 0.1, label: 'b' } })).not.toThrow();
  });

  it.each([
    ['width', { width: 0 }],
    ['width', { width: -350 }],
    ['width', { width: NaN }],
    ['height', { height: 0 }],
    ['height', { height: Infinity }],
    ['a.length', { a: { length: 0, label: '0 m' } }],
    ['b.length', { b: { length: -12, label: '-12 m' } }],
  ])('refuses a %s it cannot draw (%o)', (name, bad) => {
    expect(() => createRightTriangle({ ...CHASM, ...bad })).toThrow(`Right triangle ${name} must be a positive number`);
  });
});

// Optional documentation
// - import { ..., type RightTriangleOptions }: `type` marks an import used only for type checking, so it adds nothing to the built code.
// - triangle.find<Konva.Text>('Text'): every Text node inside the group, at any depth; `<Konva.Text>` tells TypeScript what kind of node they are.
// - .map((node) => node.text()): makes a new array holding each node's text, in the same order.
// - line.points(): the flat [x1, y1, x2, y2, ...] list a Konva.Line was drawn with.
// - triangle.findOne('Rect'): the first node of that type inside the group; `as Konva.Rect` tells TypeScript which kind it is.
// - .find((t) => ...) on an array: the first item the check is true for, or undefined if none is.
// - node.getParent()!: the group the node sits in; the `!` tells TypeScript it can't be missing here, since every tag's text is inside its tag.
// - { ...CHASM, width: 0 }: a copy of CHASM with only the listed fields changed.
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
// - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws.
// - expect(value).toEqual(expected): passes when the two values have the same contents, even if they're different arrays.
// - .sort(): puts the texts in a fixed order, so the test doesn't depend on the order the tags were drawn in.
// - expect(value).toBe(expected): throws, failing the test, unless the two values are exactly equal.
// - expect(() => ...).not.toThrow(): passes when calling the function doesn't throw.
// - it.each([...])(name, fn): runs the same test once per row, passing the row's items to fn; %s and %o in the name are filled in from the row.
// - expect(() => ...).toThrow(text): passes only if calling the function throws an error whose message contains `text`.
