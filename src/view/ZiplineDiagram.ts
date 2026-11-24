import Konva from 'konva';
import { colors, text } from './theme';

/**
 * The text on each tag of the zipline drawing, such as `12 m`. Leave `diagonal` out for no
 * tag on the zip line, and `floorDiagonal` out to draw no floor diagonal at all.
 */
export interface ZiplineLabels {
  length: string;
  width: string;
  height: string;
  diagonal?: string;
  /** The tag on the floor's diagonal, the first right triangle in the tutorial's two steps. */
  floorDiagonal?: string;
}

// How far the back of the box sits up and to the right of the front, as a share of the
// drawing's size, from the box in the zipline mockups.
const DEPTH_X = 0.25;
const DEPTH_Y = 0.32;
const DOT_RADIUS = 7;

/** One face of the box, as the pixel positions of its sides. */
interface Face {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * The store as an outlined box, with the zip line dashed from the top back corner (the
 * office) to the bottom front corner (the exit), and a cream tag on each side, like the
 * zipline mockups. It only draws the labels it's given; the math is in model/zipline.
 *
 * The box is drawn `width` × `height` pixels from (0, 0), whatever the store's numbers,
 * so a player can't measure the drawing to work out the answer. The tags on the left, top
 * and right hang a little outside that box, and none of them sits on an edge. Position it
 * by setting the group's x and y.
 */
export function createZiplineDiagram(width: number, height: number, labels: ZiplineLabels): Konva.Group {
  const dx = width * DEPTH_X;
  const dy = height * DEPTH_Y;
  const front: Face = { left: 0, top: dy, right: width - dx, bottom: height };
  const back: Face = { left: dx, top: 0, right: width, bottom: height - dy };
  const edge = (points: number[]) => new Konva.Line({ points, stroke: colors.ink, strokeWidth: 2.5, lineJoin: 'round' });
  const face = (f: Face) => edge([f.left, f.top, f.right, f.top, f.right, f.bottom, f.left, f.bottom, f.left, f.top]);

  const diagram = new Konva.Group({ name: 'zipline-diagram' });
  diagram.add(
    face(back),
    face(front),
    edge([front.left, front.top, back.left, back.top]),
    edge([front.right, front.top, back.right, back.top]),
    edge([front.left, front.bottom, back.left, back.bottom]),
    edge([front.right, front.bottom, back.right, back.bottom]),
    new Konva.Line({ points: [back.left, back.top, front.right, front.bottom], stroke: colors.ink, strokeWidth: 3, dash: [10, 8] }),
  );
  // The floor's diagonal runs from the corner under the office to the exit, drawn before the
  // dots so they sit on top of its ends, like the "Tutorial (3D)" mockup.
  if (labels.floorDiagonal !== undefined) {
    diagram.add(
      new Konva.Line({
        name: 'floor-diagonal',
        points: [back.left, back.bottom, front.right, front.bottom],
        stroke: colors.orange,
        strokeWidth: 3,
        lineCap: 'round',
      }),
    );
  }
  diagram.add(
    new Konva.Circle({ x: back.left, y: back.top, radius: DOT_RADIUS, fill: colors.orange }),
    new Konva.Circle({ x: front.right, y: front.bottom, radius: DOT_RADIUS, fill: colors.orange }),
  );

  // Width sits left of the slanted top edge, length above the back, and height beside the back's
  // right edge, where nothing else is drawn. On the front's right edge, the height tag covered the
  // box's bottom corner, so the box looked open at the bottom (#205).
  const widthTag = tag(labels.width);
  const heightTag = tag(labels.height);
  diagram.add(
    widthTag.position({ x: dx / 2 - widthTag.width() - 4, y: dy / 2 - widthTag.height() }),
    centeredAt(tag(labels.length), (back.left + back.right) / 2, -18),
    heightTag.position({ x: back.right + 8, y: (back.top + back.bottom) / 2 - heightTag.height() / 2 }),
  );
  if (labels.diagonal !== undefined) diagram.add(centeredAt(tag(labels.diagonal), width / 2, height / 2));
  if (labels.floorDiagonal !== undefined) diagram.add(placeFloorTag(tag(labels.floorDiagonal), front, back));
  return diagram;
}
// Optional documentation
// - points: [x1, y1, x2, y2, ...]: a Konva.Line joins each point to the next; ending on the first point closes the shape.
// - dash: [10, 8]: draws the line as 10 px dashes with 8 px gaps.
// - new Konva.Circle({ x, y }): a circle centered on (x, y), unlike a Rect, whose x and y are its top-left corner.

/**
 * Puts the floor diagonal's tag on the floor in front of its line, as in the mockup: in the
 * triangle between the slanted bottom-left edge, the front's bottom edge and the floor
 * diagonal. When the box is drawn too short for it to fit there, it goes just below the
 * front's bottom edge instead, so it never covers a line.
 */
function placeFloorTag(floorTag: Konva.Group, front: Face, back: Face): Konva.Group {
  const margin = 6;
  const top = front.bottom - margin - floorTag.height();
  const depth = (front.bottom - top) / (front.bottom - back.bottom);
  // Where the slanted edge and the floor diagonal cross the tag's top: it must fit between them.
  const slantedEdgeX = back.left * depth;
  const floorLineX = back.left + (front.right - back.left) * (1 - depth);
  const left = slantedEdgeX + margin;
  if (left + floorTag.width() <= floorLineX - margin) return floorTag.position({ x: left, y: top });
  return floorTag.position({ x: (front.right - floorTag.width()) / 2, y: front.bottom + margin });
}
// Optional documentation
// - depth: how far up the floor the tag's top reaches, from 0 at the front edge to 1 at the back edge; both lines are straight, so where each crosses that height is a simple share of its run.

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
