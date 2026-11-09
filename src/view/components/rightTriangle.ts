import Konva from 'konva';
import { colors, text } from '../theme';

/** One of the two sides that meet at the right angle, with the text shown on it, such as `12 m`. */
export interface Leg {
  length: number;
  label: string;
}

/** What createRightTriangle draws: its size on screen in pixels, and what each side says. */
export interface RightTriangleOptions {
  /** Pixel length of the horizontal side. */
  width: number;
  /** Pixel length of the vertical side. */
  height: number;
  a: Leg;
  b: Leg;
  /** Text on the dashed diagonal, such as `c = ?` or `c = 13 m`. */
  c: string;
}

// The chasm mockup has a 16 px right-angle square marker on a triangle whose shorter
// side is 120 px, and smaller triangles shrink the mark to keep that proportion.
const MARK_SIZE = 16;
const MARK_RATIO = 16 / 120;

/**
 * A right triangle with a dashed diagonal, a right-angle mark in the bottom
 * right corner and a cream tag on each side, like the chasm and "How to find
 * the right log" mockups. It draws whatever labels it's given.
 *
 * The shape is set by `width` and `height`, not by the legs' lengths, so a
 * player can't measure the drawing to work out the answer. The lengths only
 * decide placement: the longer leg's label always goes on the longer drawn
 * side. That only looks believable when the two legs are fairly close in
 * length, so pick examples like 5 and 12 rather than 1 and 7.
 *
 * The triangle is drawn from (0, 0), so position it by setting the group's x
 * and y. The bottom and right tags hang a little outside the width × height box.
 * Throws if the size or either leg's length isn't a positive number.
 */
export function createRightTriangle({ width, height, a, b, c }: RightTriangleOptions): Konva.Group {
  requirePositive('width', width);
  requirePositive('height', height);
  requirePositive('a.length', a.length);
  requirePositive('b.length', b.length);

  const [longer, shorter] = a.length >= b.length ? [a, b] : [b, a];
  const [bottom, side] = width >= height ? [longer, shorter] : [shorter, longer];
  const mark = Math.min(MARK_SIZE, Math.min(width, height) * MARK_RATIO);

  const triangle = new Konva.Group();
  triangle.add(
    new Konva.Line({ points: [0, height, width, height, width, 0], stroke: colors.ink, strokeWidth: 3, lineCap: 'round', lineJoin: 'round' }),
    new Konva.Line({ points: [0, height, width, 0], stroke: colors.ink, strokeWidth: 3, dash: [10, 8] }),
    new Konva.Rect({ x: width - mark, y: height - mark, width: mark, height: mark, stroke: colors.ink, strokeWidth: 2 }),
    centeredAt(tag(bottom.label), width / 2, height + 10),
    centeredAt(tag(side.label), width + 12, height / 2),
    centeredAt(tag(c), width / 2, height / 2 - 20),
  );
  return triangle;
}
// Optional documentation
// - ({ width, height, a, b, c }: RightTriangleOptions): destructuring, which unpacks the options object's fields into variables with the same names.
// - const [longer, shorter] = ... ? [a, b] : [b, a]: array destructuring, which names the first and second items of whichever pair the condition picks.
// - lineCap / lineJoin: 'round': rounds the ends of the line and the corners where its segments meet.
// - dash: [10, 8]: draws the line as 10 px dashes with 8 px gaps.

function requirePositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Right triangle ${name} must be a positive number, but got ${value}.`);
  }
}
// Optional documentation
// - Number.isFinite(value): false for NaN and Infinity, which would otherwise slip past `value <= 0`.
// - throw new Error(message): stops right here and fails loudly, so a bad size shows up where it was passed in.
// - `... ${name} ...`: a template literal, which puts the value of each ${...} into the string.

/** A cream tag with a value on it, like the `12 m` and `c = ?` labels in the mockups. */
function tag(value: string): Konva.Group {
  const label = new Konva.Text({ ...text.math, text: value, x: 6, y: 2 });
  const group = new Konva.Group({ width: label.width() + 12, height: label.height() + 4 });
  group.add(new Konva.Rect({ width: group.width(), height: group.height(), fill: colors.cream, cornerRadius: 4 }), label);
  return group;
}
// Optional documentation
// - { ...text.math, text: value, ... }: the spread `...` copies every property of text.math into the new object; the properties after it add to or override them.
// - label.width() / label.height(): with no size set, a Konva.Text measures its own text, so the tag can be sized to fit.
// - cornerRadius: rounds the rectangle's corners by this many pixels.

function centeredAt(node: Konva.Group, x: number, y: number): Konva.Group {
  return node.position({ x: x - node.width() / 2, y: y - node.height() / 2 });
}
// Optional documentation
// - node.position({ x, y }): sets both x and y at once and returns the node, so the call can sit inside triangle.add(...).
