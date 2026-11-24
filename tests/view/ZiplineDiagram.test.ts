import Konva from 'konva';
import { describe, expect, it } from 'vitest';
import { createZiplineDiagram } from '../../src/view/ZiplineDiagram';

/**
 * Checks issue #205: the store reads as a closed box, because no tag sits on any of its
 * 12 edges, or on the floor diagonal (#206). Only the `x` tag may sit on the dashed zip
 * line, which it labels. Each solid
 * edge is checked at many points along it against every tag's rectangle, at the sizes
 * the zipline screen draws it (on the card and on squared paper, with short and long
 * dialog text). Limit: this reads positions, not pixels, so the look still needs a check
 * with `npm run dev`.
 */

const labels = { length: '16 m', width: '8 m', height: '11 m', diagonal: 'x', floorDiagonal: 'floor diagonal' };
const SIZES = [
  [380, 150],
  [380, 260],
  [420, 190],
  [420, 300],
];

/** Konva leaves `dash` unset on a solid line. */
const isDashed = (line: Konva.Line) => (line.dash()?.length ?? 0) > 0;

/** Every point along each solid (not dashed) line in the drawing, 1 px or less apart. */
function edgePoints(diagram: Konva.Group): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (const line of diagram.find<Konva.Line>('Line')) {
    if (isDashed(line)) continue;
    const p = line.points();
    for (let i = 0; i + 3 < p.length; i += 2) {
      const steps = Math.ceil(Math.hypot(p[i + 2] - p[i], p[i + 3] - p[i + 1]));
      for (let s = 0; s <= steps; s++) {
        points.push({ x: p[i] + ((p[i + 2] - p[i]) * s) / steps, y: p[i + 1] + ((p[i + 3] - p[i + 1]) * s) / steps });
      }
    }
  }
  return points;
}

describe('createZiplineDiagram', () => {
  it.each(SIZES)('keeps every tag off the box’s edges at %i × %i', (width, height) => {
    const diagram = createZiplineDiagram(width, height, labels);
    const edges = edgePoints(diagram);
    const tags = diagram.getChildren().filter((node): node is Konva.Group => node instanceof Konva.Group);
    expect(tags).toHaveLength(5);
    for (const tag of tags) {
      const { x, y, width: w, height: h } = tag.getClientRect({ relativeTo: diagram });
      const covered = edges.filter((point) => point.x > x && point.x < x + w && point.y > y && point.y < y + h);
      expect(covered, `the ${tag.findOne<Konva.Text>('Text')!.text()} tag covers an edge`).toEqual([]);
    }
  });

  it('draws all 12 edges of the box, and the zip line dashed', () => {
    const diagram = createZiplineDiagram(380, 200, labels);
    const lines = diagram.find<Konva.Line>('Line');
    const edges = lines.filter((line) => !isDashed(line) && line.name() !== 'floor-diagonal');
    expect(edges.reduce((sum, line) => sum + line.points().length / 2 - 1, 0)).toBe(12);
    expect(lines.filter(isDashed)).toHaveLength(1);
  });

  it('draws the floor diagonal from the corner under the office to the exit, only when it has a label', () => {
    const diagram = createZiplineDiagram(400, 200, labels);
    const [dashed] = diagram.find<Konva.Line>('Line').filter(isDashed);
    const [office, , exit, exitY] = dashed.points();
    const floorLine = diagram.findOne<Konva.Line>('.floor-diagonal')!;
    // The bottom back corner is straight below the office dot, level with the back's bottom edge.
    expect(floorLine.points()).toEqual([office, 200 - 200 * 0.32, exit, exitY]);

    const { floorDiagonal, ...withoutFloor } = labels;
    expect(floorDiagonal).toBe('floor diagonal');
    expect(createZiplineDiagram(400, 200, withoutFloor).find('.floor-diagonal')).toHaveLength(0);
  });
});

// Optional documentation
// - line.points(): the line's corners as [x1, y1, x2, y2, ...], so each pair of corners next to each other is one edge.
// - line.dash()?.length ?? 0: the number of dash lengths, or 0 when the line has none; `?.` and `??` cover the unset case.
// - Math.hypot(dx, dy): the length of an edge, used to check it at about every pixel.
// - .filter((node): node is Konva.Group => ...): keeps only the tag groups, and tells TypeScript they're groups.
// - const { floorDiagonal, ...withoutFloor } = labels: copies every label except floorDiagonal into withoutFloor.
// - expect(covered, message): the message is shown if the test fails, naming the tag that covers an edge.
