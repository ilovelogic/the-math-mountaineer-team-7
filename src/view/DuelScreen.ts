import Konva from 'konva';
import type { DuelPage } from '../content/duelText';
import type { DuelQuestion } from '../model/problems';
import { createDialogBox } from './components/dialogBox';
import { createRightTriangle } from './components/rightTriangle';
import { STAGE_HEIGHT, STAGE_WIDTH, type Layers } from './stage';
import { colors, text as textStyles } from './theme';

/** The bottom of the Hud's top bar, so nothing important is drawn under it. */
const TOP = 48;
/** The tutorial's example triangle, with legs close in length so its labels look believable (see rightTriangle). */
const EXAMPLE = { a: 5, b: 12, c: 13 };
/** Where the triangle and the worked steps go on the tutorial and solution pages. */
const TRIANGLE = { x: 90, y: TOP + 50, width: 260 };
const CARD = { x: 470, y: TOP + 34, width: 420 };
const STEP_HEIGHT = 46;
const CARD_PADDING = 22;

/**
 * The math duel at the supply shop, one page at a time, like the Math duel mockups. The
 * tutorial and solution pages are drawn on squared paper, as in "Tutorial (2D)" and
 * "Solution (2D)": a right triangle beside a card of worked steps, with a general example
 * on the tutorial and the duel question's own numbers on the solution. The other pages
 * show the shop's plank wall until #55 draws them. Each page's text and buttons go in the
 * dialog box, and the duel's answers are plain buttons so the first can't look like a
 * hint. Clicking a button reports its position on the page, and DuelShopController
 * decides what that means.
 */
export class DuelScreen {
  private readonly scene = new Konva.Group({ listening: false });
  private readonly figures = new Konva.Group({ listening: false });
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
      this.layers.ui.add(this.box.group);
      this.added = true;
    }
    this.box.show(text, choices, { plain: page === 'duel' });
    this.scene.destroyChildren();
    this.figures.destroyChildren();

    // The dialog box grows with its text, so each drawing fits the room left above it.
    const floor = this.box.group.y();
    const { a, b, c } = this.question;

    switch (page) {
      case 'tutorial':
        this.drawGraphPaper();
        this.drawWorkedExample(floor, { a: 'a', b: 'b', c: 'c' }, workedSteps('c', EXAMPLE.a, EXAMPLE.b, EXAMPLE.c), EXAMPLE);
        break;
      case 'solution':
        this.drawGraphPaper();
        this.drawWorkedExample(floor, { a: String(a), b: String(b), c: `x = ${c}` }, workedSteps('x', a, b, c), { a, b });
        break;
      // The rest of the duel's art comes with #55.
      case 'challenge':
      case 'tutorialOffer':
      case 'duel':
      case 'won':
      case 'climb':
      case 'lost':
        this.drawPlankWall();
        break;
    }
  }
  // Optional documentation
  // - destroyChildren(): deletes everything inside the group but keeps the group, so the next page draws into the same place.
  // - { plain: page === 'duel' }: every answer is drawn as the same white button, so none looks like the right one.
  // - case 'challenge': with no break, falls through to the next case, so all six pages run the same lines.

  /** Calls `cb` with the clicked button's position each time one is clicked, until `destroy()`. */
  onChoice(cb: (index: number) => void): void {
    this.onPick = cb;
  }

  /** Removes everything this screen drew. It can't show a page again afterwards. */
  destroy(): void {
    this.onPick = null;
    this.scene.destroy();
    this.figures.destroy();
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
