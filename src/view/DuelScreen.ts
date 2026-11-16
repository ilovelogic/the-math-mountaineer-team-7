import Konva from 'konva';
import { duelExplanation, type DuelPage } from '../content/duelText';
import type { DuelQuestion } from '../model/problems';
import { image } from './assets';
import { createButton } from './components/button';
import { createDialogBox } from './components/dialogBox';
import { createRightTriangle } from './components/rightTriangle';
import { STAGE_HEIGHT, STAGE_WIDTH, type Layers } from './stage';
import { colors, text as textStyles } from './theme';

/** The bottom of the Hud's top bar, so nothing important is drawn under it. */
const TOP = 48;
/**
 * The tutorial's example triangle. It's none of the triangles the game asks about, so the
 * tutorial can't give away the duel's answer, and its legs are close in length so its
 * labels look believable (see rightTriangle).
 */
export const TUTORIAL_EXAMPLE = { a: 12, b: 16, c: 20 } as const;
const EXAMPLE = TUTORIAL_EXAMPLE;
/** Where the triangle and the worked steps go on the tutorial and solution pages. */
const TRIANGLE = { x: 90, y: TOP + 50, width: 260 };
const CARD = { x: 470, y: TOP + 34, width: 420 };
const STEP_HEIGHT = 46;
const CARD_PADDING = 22;
// Each character is named after its image, so tests can tell who is drawn.
// Every character sprite is 40 × 65 (the celebrating ones 50 × 65), and each is drawn at
// a whole or half multiple of that so it keeps its shape, as in ZiplineScreen.
/** A character at 1.5 times its size, as in the shop mockups. */
const BIG = { width: 60, height: 97.5 };
/** The celebrating store owner, who is wider, at the same 1.5 times. */
const BIG_CELEBRATING = { width: 75, height: 97.5 };
/** The store owner up close, at three times the sprite's size. */
const CLOSE_UP = { width: 120, height: 195 };
/**
 * The top-left corner of the duel page, kept empty for the store owner's progress (#57),
 * which the mockup puts there.
 */
export const PROGRESS_CORNER = { x: 0, y: TOP, width: 240, height: 120 };
/** On the duel page, where the floor starts; the page has no dialog box. */
const DUEL_FLOOR = 440;
/** The duel page's card with the question and its answers. */
const DUEL_CARD = { x: 290, y: TOP + 24, width: 380, height: 340 };
const BUTTON_GAP = 16;

/**
 * The math duel at the supply shop, one page at a time, like the Math duel mockups: the
 * store owner's challenge inside the shop, the tutorial offer, the duel itself on a card
 * with the question's triangle and its answers, the gear bag when the player wins, the
 * climb that skips Level 1, and the Explanation card when the player loses. The tutorial
 * and solution pages are drawn on squared paper, as in "Tutorial (2D)" and "Solution
 * (2D)": a right triangle beside a card of worked steps, with a general example on the
 * tutorial and the duel question's own numbers on the solution.
 *
 * Each page's text and buttons go in the dialog box, except on the duel page, where they
 * go on the card and the dialog box is hidden. The duel's answers are plain buttons, so
 * the first can't look like a hint. Clicking a button reports its position on the page,
 * and DuelShopController decides what that means. The store owner's progress (#57) isn't
 * drawn here; the duel page leaves its corner empty.
 */
export class DuelScreen {
  private readonly scene = new Konva.Group({ listening: false });
  private readonly figures = new Konva.Group({ listening: false });
  /** The duel page's card, on the ui layer so its answers can be clicked. */
  private readonly panel = new Konva.Group();
  private readonly box = createDialogBox((index) => this.onPick?.(index));
  private onPick: ((index: number) => void) | null = null;
  private added = false;

  constructor(
    private readonly layers: Layers,
    private readonly question: DuelQuestion,
  ) {}

  /** Draws `page` with `text` and a button for each choice, replacing the page shown before. */
  show(page: DuelPage, text: string, choices: string[]): void {
    if (!this.added) {
      this.layers.background.add(this.scene);
      this.layers.sprites.add(this.figures);
      this.layers.ui.add(this.panel, this.box.group);
      this.added = true;
    }
    this.scene.destroyChildren();
    this.figures.destroyChildren();
    this.panel.destroyChildren();

    // The duel page shows its text and answers on the card instead.
    const onCard = page === 'duel';
    this.box.show(onCard ? '' : text, onCard ? [] : choices);
    this.box.group.visible(!onCard);

    // The dialog box grows with its text, so each drawing fits the room left above it.
    const floor = onCard ? DUEL_FLOOR : this.box.group.y();
    const { a, b, c } = this.question;

    switch (page) {
      case 'challenge':
        this.drawPlankWall();
        this.drawShopInterior(floor);
        break;
      case 'tutorialOffer':
        this.drawPlankWall();
        this.figures.add(new Konva.Image({ image: image('shopOwnerSupplies'), name: 'shopOwnerSupplies', x: (STAGE_WIDTH - CLOSE_UP.width) / 2, y: floor - CLOSE_UP.height, ...CLOSE_UP }));
        break;
      case 'tutorial':
        this.drawGraphPaper();
        this.drawWorkedExample(floor, { a: 'a', b: 'b', c: 'c' }, workedSteps('c', EXAMPLE.a, EXAMPLE.b, EXAMPLE.c), EXAMPLE);
        break;
      case 'duel':
        this.drawPlankWall();
        this.drawFloor(floor);
        this.drawRivals(floor, 'shopOwnerSupplies');
        this.drawDuelCard(text, choices);
        break;
      case 'won':
        this.drawPlankWall();
        this.drawPrize(floor);
        break;
      case 'climb':
        this.drawClimb(floor);
        break;
      case 'lost':
        this.drawPlankWall();
        this.drawFloor(floor);
        this.drawRivals(floor, 'shopOwnerCelebrating');
        this.drawExplanation(c);
        break;
      case 'solution':
        this.drawGraphPaper();
        this.drawWorkedExample(floor, { a: String(a), b: String(b), c: `x = ${c}` }, workedSteps('x', a, b, c), { a, b });
        break;
    }
  }
  // Optional documentation
  // - destroyChildren(): deletes everything inside the group but keeps the group, so the next page draws into the same place.
  // - visible(false): hides the dialog box and stops its buttons from being clicked, without deleting it.
  // - onCard ? '' : text: the duel page empties the dialog box, so no old buttons are left in it while it's hidden.

  /** Calls `cb` with the clicked button's position each time one is clicked, until `destroy()`. */
  onChoice(cb: (index: number) => void): void {
    this.onPick = cb;
  }

  /** Removes everything this screen drew. It can't show a page again afterwards. */
  destroy(): void {
    this.onPick = null;
    this.scene.destroy();
    this.figures.destroy();
    this.panel.destroy();
    this.box.group.destroy();
  }

  /** The tutorial and solution mockups' squared paper. */
  private drawGraphPaper(): void {
    this.scene.add(new Konva.Rect({ width: STAGE_WIDTH, height: STAGE_HEIGHT, fill: colors.white }));
    for (let x = 40; x < STAGE_WIDTH; x += 40) {
      this.scene.add(new Konva.Rect({ x, width: 1, height: STAGE_HEIGHT, fill: colors.snow }));
    }
    for (let y = 40; y < STAGE_HEIGHT; y += 40) {
      this.scene.add(new Konva.Rect({ y, width: STAGE_WIDTH, height: 1, fill: colors.snow }));
    }
  }

  /** The supply shop's blue-gray plank wall, from the duel mockups. */
  private drawPlankWall(): void {
    this.scene.add(new Konva.Rect({ width: STAGE_WIDTH, height: STAGE_HEIGHT, fill: colors.rockLight }));
    for (let y = 60; y < STAGE_HEIGHT; y += 60) {
      this.scene.add(new Konva.Rect({ y, width: STAGE_WIDTH, height: 3, fill: colors.rock }));
    }
  }

  /** The dark floor the player and the store owner stand on, from `floor` down. */
  private drawFloor(floor: number): void {
    this.scene.add(new Konva.Rect({ y: floor, width: STAGE_WIDTH, height: STAGE_HEIGHT - floor, fill: colors.rockDark }));
  }

  /** The "Duel challenge" mockup: shelves of goods, a window, and the store owner behind the counter. */
  private drawShopInterior(floor: number): void {
    const goods = [colors.orange, colors.peach, colors.cream, colors.pine, colors.teal];
    for (const shelfY of [120, 220]) {
      this.scene.add(new Konva.Rect({ x: 80, y: shelfY, width: 320, height: 10, fill: colors.woodDark }));
      goods.forEach((fill, i) => {
        this.scene.add(new Konva.Rect({ x: 100 + i * 60, y: shelfY - 26, width: 36, height: 26, fill }));
      });
    }
    this.scene.add(new Konva.Rect({ x: 644, y: 84, width: 192, height: 132, fill: colors.ice, stroke: colors.woodDark, strokeWidth: 8 }));
    this.figures.add(
      new Konva.Image({ image: image('shopOwnerSupplies'), name: 'shopOwnerSupplies', x: 610, y: 246 - BIG.height, ...BIG }),
      new Konva.Rect({ x: 480, y: 246, width: 320, height: 60, fill: colors.wood }),
      new Konva.Rect({ x: 480, y: 246, width: 320, height: 8, fill: colors.woodDark }),
      new Konva.Image({ image: image('player'), name: 'player', x: 300, y: floor - BIG.height, ...BIG }),
    );
  }

  /** The player on the left and the store owner (`owner`) on the right, standing on `floor`. */
  private drawRivals(floor: number, owner: 'shopOwnerSupplies' | 'shopOwnerCelebrating'): void {
    const size = owner === 'shopOwnerCelebrating' ? BIG_CELEBRATING : BIG;
    this.figures.add(
      new Konva.Image({ image: image('player'), name: 'player', x: 120, y: floor - BIG.height, ...BIG }),
      new Konva.Image({ image: image(owner), name: owner, x: STAGE_WIDTH - 120 - size.width, y: floor - size.height, ...size }),
    );
  }

  /**
   * The "The duel" mockup's card: `heading`, the question's triangle with the side to
   * find marked x, and one plain button per answer in `choices`, each reporting its position.
   */
  private drawDuelCard(heading: string, choices: string[]): void {
    const card = new Konva.Group({ x: DUEL_CARD.x, y: DUEL_CARD.y, name: 'duel-card' });
    card.add(
      new Konva.Rect({ width: DUEL_CARD.width, height: DUEL_CARD.height, fill: colors.white, cornerRadius: 8 }),
      new Konva.Text({ ...textStyles.heading, text: heading, x: 24, y: 20, width: DUEL_CARD.width - 48 }),
    );

    const { a, b } = this.question;
    // The margins leave room for the tags that hang below and to the right of the triangle.
    const triangle = createRightTriangle({
      width: DUEL_CARD.width - 130,
      height: 150,
      a: { length: a, label: String(a) },
      b: { length: b, label: String(b) },
      c: 'x',
    });
    card.add(triangle.position({ x: 40, y: 64 }));

    const buttons = new Konva.Group({ y: DUEL_CARD.height - 64, name: 'duel-answers' });
    let x = 0;
    choices.forEach((choice, index) => {
      const button = createButton(choice, () => this.onPick?.(index), 'secondary');
      buttons.add(button.x(x));
      x += button.getClientRect({ relativeTo: buttons }).width + BUTTON_GAP;
    });
    // Centered on the card: x has one gap more than the row is wide.
    buttons.x((DUEL_CARD.width - (x - BUTTON_GAP)) / 2);
    card.add(buttons);
    this.panel.add(card);
  }
  // Optional documentation
  // - createButton(choice, ..., 'secondary'): a white button with a dark outline, the same look for every answer.
  // - () => this.onPick?.(index): each button remembers its own index, and reports it only while a callback is registered.

  /** The "Duel won" mockup: a white card with the bag of climbing gear. */
  private drawPrize(floor: number): void {
    const width = 300;
    const height = Math.max(floor - TOP - 48, 120);
    const prize = new Konva.Group({ x: (STAGE_WIDTH - width) / 2, y: TOP + 24, name: 'duel-prize' });
    const middle = width / 2;
    const bag = Math.min(110, height - 50);
    const top = (height - bag) / 2 + 10;
    prize.add(
      new Konva.Rect({ width, height, fill: colors.white, cornerRadius: 8 }),
      // A pixel-art sack, like the mockup's: stepped rows that widen toward the bottom, and a tie at the top.
      ...[
        [0.3, 0.1, 0.15],
        [0.55, 0.25, 0.15],
        [0.8, 0.4, 0.15],
        [1, 0.55, 0.3],
        [0.8, 0.85, 0.1],
      ].map(([w, y, h]) => new Konva.Rect({ x: middle - (bag * w) / 2, y: top + bag * y, width: bag * w, height: bag * h, fill: colors.wood })),
      new Konva.Rect({ x: middle - bag * 0.1, y: top - bag * 0.05, width: bag * 0.2, height: bag * 0.15, fill: colors.woodDark }),
    );
    this.figures.add(prize);
  }
  // Optional documentation
  // - [[0.3, 0.1, 0.15], ...]: each row of the sack as [width, top, height], each a fraction of the bag's size.
  // - ...[...].map(...): turns each row into a rectangle, and the spread `...` passes them all to add().

  /** The "Climb: skip Level 1" mockup: the mountains, a cliff with a rope, and the player climbing it. */
  private drawClimb(floor: number): void {
    const cliffX = 700;
    const ropeX = cliffX - 8;
    this.scene.add(
      new Konva.Image({ image: image('mountainsDay'), width: STAGE_WIDTH, height: STAGE_HEIGHT }),
      new Konva.Rect({ x: cliffX, width: STAGE_WIDTH - cliffX, height: STAGE_HEIGHT, fill: colors.rock }),
      new Konva.Rect({ x: ropeX - 2, width: 4, height: floor, fill: colors.cream }),
    );
    this.figures.add(new Konva.Image({ image: image('playerClimbing'), name: 'playerClimbing', x: ropeX - BIG.width + 10, y: (TOP + floor) / 2 - BIG.height / 2, ...BIG }));
  }

  /** The "Duel lost" mockup's Explanation card: a gray panel with the right answer. */
  private drawExplanation(answer: number): void {
    const width = 320;
    const card = new Konva.Group({ x: (STAGE_WIDTH - width) / 2, y: TOP + 30, name: 'duel-explanation' });
    card.add(
      new Konva.Rect({ width, height: 84, fill: colors.panel, stroke: colors.silver, strokeWidth: 1, cornerRadius: 8 }),
      new Konva.Text({ ...textStyles.heading, text: duelExplanation.title.replace('{answer}', String(answer)), x: 20, y: 18, width: width - 40 }),
      new Konva.Text({ ...textStyles.body, text: duelExplanation.line, x: 20, y: 46, width: width - 40, fill: colors.mutedText }),
    );
    this.figures.add(card);
  }

  /**
   * A right triangle with `labels` on its sides, beside a card of numbered steps. The
   * legs' `lengths` only decide which label goes on the longer side; the triangle isn't
   * drawn to scale.
   */
  private drawWorkedExample(
    floor: number,
    labels: { a: string; b: string; c: string },
    steps: string[],
    lengths: { a: number; b: number },
  ): void {
    // Room for the tags that hang below and to the right of the triangle.
    const height = Math.max(floor - TRIANGLE.y - 50, 60);
    const triangle = createRightTriangle({
      width: TRIANGLE.width,
      height,
      a: { length: lengths.a, label: labels.a },
      b: { length: lengths.b, label: labels.b },
      c: labels.c,
    });
    triangle.name('duel-triangle');
    this.figures.add(triangle.position({ x: TRIANGLE.x, y: TRIANGLE.y }));

    const card = new Konva.Group({ ...CARD, name: 'duel-steps' });
    card.add(
      new Konva.Rect({
        width: CARD.width,
        height: 2 * CARD_PADDING + steps.length * STEP_HEIGHT - (STEP_HEIGHT - 32),
        fill: colors.white,
        stroke: colors.ink,
        strokeWidth: 2,
        cornerRadius: 8,
      }),
    );
    steps.forEach((step, index) => {
      const y = CARD_PADDING + index * STEP_HEIGHT;
      card.add(
        new Konva.Circle({ x: 38, y: y + 16, radius: 16, fill: colors.teal }),
        new Konva.Text({ ...textStyles.label, text: String(index + 1), x: 22, y, width: 32, height: 32, align: 'center', verticalAlign: 'middle', fill: colors.white }),
        new Konva.Text({ ...textStyles.math, text: step, x: 70, y: y + 4, width: CARD.width - 90 }),
      );
    });
    this.figures.add(card);
  }
  // Optional documentation
  // - Math.max(..., 60): never shorter than 60 px, even if the dialog box were very tall.
  // - new Konva.Group({ ...CARD, name }): the spread copies CARD's x, y and width into the group, so everything inside is placed relative to the card.
  // - steps.forEach((step, index) => ...): runs once per step, also passing its position, starting at 0.
}

/** The worked steps for a right triangle with legs `a` and `b`, solving for the side called `side`. */
function workedSteps(side: string, a: number, b: number, c: number): string[] {
  return [
    `${side}² = a² + b²`,
    `${side}² = ${a}² + ${b}² = ${a ** 2} + ${b ** 2} = ${c ** 2}`,
    `${side} = √${c ** 2} = ${c}`,
  ];
}
// Optional documentation
// - a ** 2: a to the power of 2, so 5 ** 2 is 25.
// - `${side}² = ...`: a template literal, which puts each ${...} value into the text.
// - duelExplanation.title.replace('{answer}', ...): puts the answer where the text marks it.
