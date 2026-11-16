import Konva from 'konva';
import { createDialogBox } from './components/dialogBox';
import { createLogButton, type LogButton } from './components/logButton';
import type { Layers } from './stage';
import { colors, text } from './theme';
import { image } from './assets';


export interface DrawnChasm {
  /** The rise, drawn up the far cliff. */
  a: number;
  /** The gap's width, drawn along the bottom. */
  b: number;
  c: number;
  /** Log lengths, in the order the screen shows them; a click reports a position in this list. */
  logs: readonly number[];
  correct: number;
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
  private readonly logPile = new Konva.Group();
  private readonly selectedLog = new Konva.Group({
    name: 'selected-log',
  });
  private readonly buttons: LogButton[] = [];
  private hypotenuseLabel!: Konva.Group;
  private choiceCallback: ((index: number) => void) | null = null;
  private readonly prompt = createDialogBox((index) => {
    this.choiceCallback?.(index);
  });
  // Until ChasmController (#24) registers its own handler, clicks are only logged.
  private onClick: ((index: number) => void) | null = (index) => console.log(`Log ${index} (${this.chasm.logs[index]} m) was clicked`);
  private picked: number | null = null;
  private locked = false;
  private player!: Konva.Image;
  private logHeading!: Konva.Text;

  constructor(
    private readonly layers: Layers,
    private readonly chasm: DrawnChasm,
  ) {}

  /** Draws the whole screen. Call it once. */
  draw(): void {
    this.drawScenery();
    this.drawTriangle();
    this.drawPlayer();
    this.drawLogPile();

    this.props.add(this.logPile);
    this.props.add(this.selectedLog);

    this.drawLogButtons();
    this.drawPrompt();

    this.layers.background.add(this.scenery);
    this.layers.sprites.add(this.props);
    this.layers.ui.add(this.controls);
  }

  /**
   * Calls `cb` with the log's position in `chasm.logs` each time a log button is clicked, until `lock()`.
   * Eventually a controller will call this to set and replace the default handler
   */
  onLogClicked(cb: (index: number) => void): void {
    this.onClick = cb;
  }

  onChoiceSelected(cb: (index: number) => void): void {
    this.choiceCallback = cb;
  }

  /** Stops reporting clicks and greys out the log that was picked, if any. */
  lock(): void {
    this.locked = true;
    this.setCursor('default');
    this.controls.listening(false);
    if (this.picked !== null) this.buttons[this.picked].setState('used');
  }

  /** Removes everything this screen drew. The screen can't be drawn again afterwards. */
  destroy(): void {
    this.locked = true;
    this.onClick = null;
    this.setCursor('default');
    this.scenery.destroy();
    this.props.destroy();
    this.controls.destroy();
  }
  showCorrectFeedback(correctLength: number): void {
    this.locked = true;
    this.updateHypotenuseLabel(correctLength);
    this.crossChasm(true);

    if (this.picked !== null) {
        this.buttons[this.picked].setState('used');
    }

    this.prompt.show(
      `The ${correctLength} m log fits. You cross the gap and find one of your friend's items.`,
      ['Continue']
    );
    this.positionLogButtons();
  }
  showFeedback(result: 'tooShort' | 'tooLong', selectedLength: number, correctLength: number): void {
    this.locked = true;
    if (this.picked !== null) {
        this.buttons[this.picked].setState('used');
    }

    if (result === 'tooShort') {
      this.drawFallingLog();
    }
    else {
      this.drawOverhangingLog();
    }
  
    const message = result === 'tooShort'
        ? `The ${selectedLength} m log is too short. It falls into the chasm. The right log was the ${correctLength} m log.`
        : `The ${selectedLength} m log is too long. It smashes your friend's item on the other side, and you lose the points it was worth. The right log was the ${correctLength} m log.`;

    this.prompt.show(message, ['Cross the chasm using the correct log',
      'First, see how to derive the correct answer'
    ]);
    this.positionLogButtons();
  }

  showCrossing(correctLength: number): void {
    this.updateHypotenuseLabel(correctLength);
    this.crossChasm(false);
    this.prompt.show(
      `You lay down the ${correctLength} m log and cross the chasm.`,
      ['Continue']
    );

    this.positionLogButtons();
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
    );
    this.hypotenuseLabel = centeredAt(
      tag('c = ?', text.math),
      (left + right) / 2,
      (near + far) / 2 - 50,
    );

    this.props.add(this.hypotenuseLabel);

  }

  /**
   * Stacks the logs on the near cliff, shortest on top, from 90 px to 200 px
   * wide like the mockup. The pile isn't clickable, so its order can differ from the buttons'.
   */
  private drawLogPile(): void {
  this.logPile.destroyChildren();

  const pile = this.chasm.logs
    .filter((_, index) => index !== this.picked)
    .sort((x, y) => x - y);

  if (pile.length === 0) return;

  const shortest = pile[0];
  const spread = pile[pile.length - 1] - shortest || 1;

  const top = GAP.near - 52 - 46 * (pile.length - 1);

  pile.forEach((length, i) => {
    const width = Math.round(90 + (110 * (length - shortest)) / spread);

    this.logPile.add(pileLog(length, width, 16, top + i * 46));
  });
}

  /** One button per log */
  private drawLogButtons(): void {
    this.chasm.logs.forEach((length, i) => {
        const log = createLogButton(`${length} m`, () => {
            if (this.locked) return;
            this.picked = i;
            this.drawLogPile();
            this.onClick?.(i);
        });

        log.group.name('log-button');
        log.group.on('mouseenter', () => this.setCursor(this.locked ? 'default' : 'pointer'));
        log.group.on('mouseleave', () => this.setCursor('default'));
        this.buttons.push(log);
    });

    this.logHeading = new Konva.Text({
        ...text.label,
        fill: colors.white,
        text: 'Logs:',
    });

    const row = [this.logHeading, ...this.buttons.map((log) => log.group)];
    this.controls.add(...row);

    const size = (node: Konva.Node) =>
        node.getClientRect({ relativeTo: this.controls });

    let x = 936 - row.reduce((sum, node) => sum + size(node).width, 0) - 10 * (row.length - 1);

    for (const node of row) {
        node.position({ x, y: 438 - size(node).height / 2 });
        x += size(node).width + 10;
    }
  }

  private setCursor(cursor: string): void {
    const stage = this.controls.getStage();
    if (stage) stage.container().style.cursor = cursor;
  }

  private drawPrompt(): void {
    this.prompt.show(QUESTION, []);
    this.controls.add(this.prompt.group);
  }

  private drawPlayer(): void {
    this.player = new Konva.Image({
      image: image('player'),
      x: 230,
      y: 230,
      width: 45,
      height: 70,
    });
  
    this.props.add(this.player);
  }

  private drawBridgeLog(type: 'correct' | 'tooShort' | 'tooLong'): void {
    const dx = GAP.right - GAP.left;
    const dy = GAP.far - GAP.near;

    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const gapLength = Math.sqrt(dx * dx + dy * dy);

    let width = gapLength;

    if (type === 'tooShort') {
        width = gapLength * 0.7;
    } else if (type === 'tooLong') {
        width = gapLength * 1.3;
    }

    this.selectedLog.destroyChildren();

    const log = new Konva.Rect({
        x: -width / 2,
        y: -12,
        width,
        height: 24,
        fill: '#8B5A2B',
        stroke: '#573719',
        strokeWidth: 3,
        cornerRadius: 10,
    });

    this.selectedLog.add(log);

    this.selectedLog.position({
        x: (GAP.left + GAP.right) / 2,
        y: (GAP.near + GAP.far) / 2,
    });

    this.selectedLog.rotation(angle);
}

  private drawFallingLog(): void {
    this.drawBridgeLog('tooShort');

    this.selectedLog.position({
        x: GAP.left + 50,
        y: GAP.near + 80,
    });

    this.selectedLog.rotation(65);
  }
  private drawOverhangingLog(): void {
    this.drawBridgeLog('tooLong');

    const dx = GAP.right - GAP.left;
    const dy = GAP.far - GAP.near;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    this.selectedLog.position({
        x: GAP.left,
        y: GAP.near,
    });

    // The log extends from its left endpoint.
    const log = this.selectedLog.findOne<Konva.Rect>('Rect')!;
    log.x(0);

    this.selectedLog.rotation(angle);
  }
  private crossChasm(celebrate: boolean): void {
    this.drawBridgeLog('correct');
  
    this.player.position({
      x: GAP.right + 20,
      y: GAP.far - 70,
    });
  
    if (celebrate) {
      this.player.image(image('playerCelebrating'));
    }
  }

  private positionLogButtons(): void {
    const row = [this.logHeading, ...this.buttons.map((log) => log.group)];
    const dialogTop = this.prompt.getTop();
    const size = (node: Konva.Node) =>
        node.getClientRect({ relativeTo: this.controls });

    for (const node of row) {
        node.y(dialogTop - 30 - size(node).height / 2);
    }
  }

  private updateHypotenuseLabel(correctLength: number): void {
    const label = this.hypotenuseLabel.findOne<Konva.Text>('Text')!;
    const background = this.hypotenuseLabel.findOne<Konva.Rect>('Rect')!;

    label.text(`c = ${correctLength} m`);

    // Keep the background sized to fit the updated text.
    background.width(label.width() + 12);
    background.height(label.height() + 4);
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