import Konva from 'konva';
import { colors, text } from './theme';

/** The text on each tag of the zipline drawing, such as `12 m`. Leave `diagonal` out for no tag on the zip line. */
export interface ZiplineLabels {
  length: string;
  width: string;
  height: string;
  diagonal?: string;
}

// How far the back of the box sits up and to the right of the front, as a share of the
// drawing's size, from the box in the zipline mockups.
const DEPTH_X = 0.25;
const DEPTH_Y = 0.32;
const DOT_RADIUS = 7;

/**
 * The store as an outlined box, with the zip line dashed from the top back corner (the
 * office) to the bottom front corner (the exit), and a cream tag on each side, like the
 * zipline mockups. It only draws the labels it's given; the math is in model/zipline.
 *
 * The box is drawn `width` × `height` pixels from (0, 0), whatever the store's numbers,
 * so a player can't measure the drawing to work out the answer. The tags on the left and
 * top hang a little outside that box. Position it by setting the group's x and y.
 */
export function createZiplineDiagram(width: number, height: number, labels: ZiplineLabels): Konva.Group {
  const dx = width * DEPTH_X;
  const dy = height * DEPTH_Y;
  const front = { left: 0, top: dy, right: width - dx, bottom: height };
  const back = { left: dx, top: 0, right: width, bottom: height - dy };
  const edge = (points: number[]) => new Konva.Line({ points, stroke: colors.ink, strokeWidth: 2.5, lineJoin: 'round' });
  const face = (f: typeof front) => edge([f.left, f.top, f.right, f.top, f.right, f.bottom, f.left, f.bottom, f.left, f.top]);

  const diagram = new Konva.Group({ name: 'zipline-diagram' });
  diagram.add(
    face(back),
    face(front),
    edge([front.left, front.top, back.left, back.top]),
    edge([front.right, front.top, back.right, back.top]),
    edge([front.left, front.bottom, back.left, back.bottom]),
    edge([front.right, front.bottom, back.right, back.bottom]),
    new Konva.Line({ points: [back.left, back.top, front.right, front.bottom], stroke: colors.ink, strokeWidth: 3, dash: [10, 8] }),
    new Konva.Circle({ x: back.left, y: back.top, radius: DOT_RADIUS, fill: colors.orange }),
    new Konva.Circle({ x: front.right, y: front.bottom, radius: DOT_RADIUS, fill: colors.orange }),
  );

  // Width sits left of the slanted top edge, length above the back, and height right of the front.
  const widthTag = tag(labels.width);
  const heightTag = tag(labels.height);
  diagram.add(
    widthTag.position({ x: dx / 2 - widthTag.width() - 4, y: dy / 2 - widthTag.height() }),
    centeredAt(tag(labels.length), (back.left + back.right) / 2, -18),
    heightTag.position({ x: front.right + 8, y: front.top + (front.bottom - front.top) * 0.6 - heightTag.height() / 2 }),
  );
  if (labels.diagonal !== undefined) diagram.add(centeredAt(tag(labels.diagonal), width / 2, height / 2));
  return diagram;
}
// Optional documentation
// - typeof front: the type of the `front` object, so `face` takes any object with the same four numbers.
// - points: [x1, y1, x2, y2, ...]: a Konva.Line joins each point to the next; ending on the first point closes the shape.
// - dash: [10, 8]: draws the line as 10 px dashes with 8 px gaps.
// - new Konva.Circle({ x, y }): a circle centered on (x, y), unlike a Rect, whose x and y are its top-left corner.

/** A cream tag with a value on it, like the side labels in the zipline mockups. */
function tag(value: string): Konva.Group {
  const label = new Konva.Text({ ...text.label, text: value, x: 6, y: 3 });
  const group = new Konva.Group({ width: label.width() + 12, height: label.height() + 6 });
  group.add(new Konva.Rect({ width: group.width(), height: group.height(), fill: colors.cream, cornerRadius: 4 }), label);
  return group;
}

function centeredAt(node: Konva.Group, x: number, y: number): Konva.Group {
  return node.position({ x: x - node.width() / 2, y: y - node.height() / 2 });
}
// Optional documentation
// - node.position({ x, y }): sets both x and y at once and returns the node, so the call can sit inside diagram.add(...).
