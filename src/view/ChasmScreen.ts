import Konva from 'konva';
import type { Layers } from './stage';
import { colors, text } from './theme';

export interface DrawnChasm {
  /** The rise, drawn up the far cliff. */
  a: number;
  /** The gap's width, drawn along the bottom. */
  b: number;
  /** Log lengths, in the order the screen shows them; a click reports a position in this list. */
  logs: readonly number[];
}

const QUESTION = 'Which log fits across this gap?';

/** Where the near cliff ends and the far cliff begins, from the "Pick a log" mockup. */
const GAP = { left: 300, right: 650, near: 300, far: 180 } as const;

/**
 * Pixel tops of the background mountains, one per 40 px column across the stage.
 * Far columns marked in `SNOWY` get a snow cap.
 */
const FAR_PEAKS = [250, 230, 210, 170, 150, 130, 110, 130, 170, 190, 210, 190, 170, 130, 90, 70, 90, 130, 150, 170, 190, 210, 230, 250];
const NEAR_PEAKS = [310, 290, 290, 270, 250, 270, 290, 310, 310, 290, 270, 250, 230, 210, 230, 250, 270, 290, 290, 270, 250, 270, 290, 310];
const SNOWY = new Set([5, 6, 7, 13, 14, 15, 16, 17]);
const COLUMN = 40;
const MOUNTAIN_BASE = 370;


export class ChasmScreen {
  private readonly scenery = new Konva.Group();
  private readonly props = new Konva.Group();
  private readonly controls = new Konva.Group();
  private readonly buttons: Konva.Group[] = [];
  private onClick: ((index: number) => void) | null = null;
  private picked: number | null = null;
  private locked = false;

  constructor(
    private readonly layers: Layers,
    private readonly chasm: DrawnChasm,
  ) {}

  /** Draws the whole screen. Call it once. */
  draw(): void {
    this.drawScenery();
    this.drawTriangle();
    this.drawLogPile();
    this.drawLogButtons();
    this.drawPrompt();
    this.layers.background.add(this.scenery);
    this.layers.sprites.add(this.props);
    this.layers.ui.add(this.controls);
  }

  /** Calls `cb` with the log's position in `chasm.logs` each time a log button is clicked, until `lock()`. */
  onLogClicked(cb: (index: number) => void): void {
    this.onClick = cb;
  }

  /** Stops reporting clicks and greys out the log that was picked, if any. */
  lock(): void {
    this.locked = true;
    this.controls.listening(false);
    if (this.picked !== null) this.buttons[this.picked].opacity(0.5);
  }

  /** Removes everything this screen drew. The screen can't be drawn again afterwards. */
  destroy(): void {
    this.locked = true;
    this.onClick = null;
    this.scenery.destroy();
    this.props.destroy();
    this.controls.destroy();
  }

  private drawScenery(): void {
    this.scenery.add(new Konva.Rect({ width: 960, height: 540, fill: colors.skyDay }));
    FAR_PEAKS.forEach((top, i) => {
      this.scenery.add(column(i, top, colors.rockLight));
      if (SNOWY.has(i)) this.scenery.add(new Konva.Rect({ x: i * COLUMN, y: top, width: COLUMN, height: 20, fill: colors.snow }));
    });
    NEAR_PEAKS.forEach((top, i) => this.scenery.add(column(i, top, colors.rock)));
    this.scenery.add(
      new Konva.Rect({ y: MOUNTAIN_BASE, width: 960, height: 540 - MOUNTAIN_BASE, fill: colors.snow }),
      new Konva.Rect({ x: GAP.left, y: GAP.near, width: GAP.right - GAP.left, height: 540 - GAP.near, fill: colors.ink }),
      cliff(0, GAP.near, GAP.left),
      cliff(GAP.right, GAP.far, 960 - GAP.right),
    );
  }

  private drawTriangle(): void {
    const { left, right, near, far } = GAP;
    this.props.add(
      new Konva.Line({ points: [left, near, right, near, right, far], stroke: colors.ink, strokeWidth: 3, lineCap: 'round', lineJoin: 'round' }),
      new Konva.Line({ points: [left, near, right, far], stroke: colors.ink, strokeWidth: 3, dash: [10, 8] }),
      new Konva.Rect({ x: right - 16, y: near - 16, width: 16, height: 16, stroke: colors.ink, strokeWidth: 2 }),
      centeredAt(tag(`${this.chasm.b} m`, text.math), (left + right) / 2, near + 10),
      centeredAt(tag(`${this.chasm.a} m`, text.math), right + 12, (near + far) / 2),
      centeredAt(tag('c = ?', text.math), (left + right) / 2, (near + far) / 2 - 20),
    );
  }

  /**
   * Stacks the logs on the near cliff, shortest on top, from 90 px to 200 px
   * wide like the mockup. The pile isn't clickable, so its order can differ from the buttons'.
   */
  private drawLogPile(): void {
    const pile = [...this.chasm.logs].sort((x, y) => x - y);
    const shortest = pile[0];
    const spread = pile[pile.length - 1] - shortest || 1;
    // Each log is 52 px tall and overlaps the one below by 6 px, so the last one rests on the cliff.
    const top = GAP.near - 52 - 46 * (pile.length - 1);
    pile.forEach((length, i) => {
      const width = Math.round(90 + (110 * (length - shortest)) / spread);
      this.props.add(pileLog(length, width, 16, top + i * 46));
    });
  }

  /** One button per log */
  private drawLogButtons(): void {
    this.chasm.logs.forEach((length, i) => {
      const button = logButton(length);
      button.on('click tap', () => {
        if (this.locked) return;
        this.picked = i;
        this.onClick?.(i);
      });
      this.buttons.push(button);
    });
    const heading = new Konva.Text({ ...text.label, fill: colors.white, text: 'Logs:' });
    const row = [heading, ...this.buttons];
    let x = 936 - row.reduce((sum, node) => sum + node.width(), 0) - 10 * (row.length - 1);
    for (const node of row) {
      node.position({ x, y: 438 - node.height() / 2 });
      x += node.width() + 10;
    }
    this.controls.add(...row);
  }

  /** A plain stand-in for the shared Dialog box (#11). */
  private drawPrompt(): void {
    this.controls.add(
      new Konva.Rect({ x: 1, y: 471, width: 958, height: 68, fill: colors.white, stroke: colors.ink, strokeWidth: 2 }),
      new Konva.Text({ ...text.dialog, text: QUESTION, x: 30, y: 471, height: 68, verticalAlign: 'middle' }),
    );
  }
}

function column(i: number, top: number, fill: string): Konva.Rect {
  return new Konva.Rect({ x: i * COLUMN, y: top, width: COLUMN, height: MOUNTAIN_BASE - top, fill });
}

function cliff(x: number, y: number, width: number): Konva.Group {
  const group = new Konva.Group({ x, y });
  group.add(
    new Konva.Rect({ width, height: 540 - y, fill: colors.rockDark }),
    new Konva.Rect({ width, height: 14, fill: colors.snow }),
  );
  return group;
}

/** A cream tag with a value on it, like the `12 m` and `c = ?` labels in the mockups. */
function tag(value: string, style: typeof text.math | typeof text.label): Konva.Group {
  const label = new Konva.Text({ ...style, text: value, x: 6, y: 2 });
  const group = new Konva.Group({ width: label.width() + 12, height: label.height() + 4 });
  group.add(new Konva.Rect({ width: group.width(), height: group.height(), fill: colors.cream, cornerRadius: 4 }), label);
  return group;
}

function centeredAt(node: Konva.Group, x: number, y: number): Konva.Group {
  return node.position({ x: x - node.width() / 2, y: y - node.height() / 2 });
}

/** A log lying on the cliff with its length tagged above it, 52 px tall like the mockup's. */
function pileLog(length: number, width: number, x: number, y: number): Konva.Group {
  const group = new Konva.Group({ x, y });
  group.add(
    new Konva.Rect({ x: 12, y: 30, width: width - 24, height: 20, fill: colors.wood }),
    new Konva.Circle({ x: 12, y: 40, radius: 12, fill: colors.woodDark }),
    new Konva.Circle({ x: width - 12, y: 40, radius: 12, fill: colors.woodDark }),
    centeredAt(tag(`${length} m`, text.label), width / 2, 12),
  );
  return group;
}

/** A plain stand-in for the shared Log button (#11): a log icon and the length on a white button. */
function logButton(length: number): Konva.Group {
  const label = new Konva.Text({ ...text.label, text: `${length} m`, x: 52, y: 10 });
  const width = label.x() + label.width() + 14;
  const group = new Konva.Group({ name: 'log-button', width, height: 40 });
  group.add(
    new Konva.Rect({ width, height: 40, fill: colors.white, stroke: colors.ink, strokeWidth: 1.5, cornerRadius: 6 }),
    new Konva.Rect({ x: 18, y: 15, width: 22, height: 10, fill: colors.wood }),
    new Konva.Ellipse({ x: 19, y: 20, radiusX: 5, radiusY: 6, fill: colors.woodDark }),
    new Konva.Ellipse({ x: 39, y: 20, radiusX: 5, radiusY: 6, fill: colors.woodDark }),
    label,
  );
  return group;
}