import Konva from 'konva';
import type { ZiplinePage } from '../content/ziplineText';
import type { ZiplineProblem } from '../model/zipline';
import { image } from './assets';
import { createDialogBox } from './components/dialogBox';
import { STAGE_HEIGHT, STAGE_WIDTH, type Layers } from './stage';
import { colors, text as textStyles } from './theme';
import { createZiplineDiagram, type ZiplineLabels } from './ZiplineDiagram';

/** The bottom of the Hud's top bar, so nothing important is drawn under it. */
const TOP = 48;
/** Room left between the drawing and the dialog box. */
const GAP = 12;
// Every character sprite is 40 × 65 (the celebrating ones 50 × 65), and each is drawn at
// a whole or half multiple of that so it keeps its shape.
/** A character at 1.5 times its size, as in the shop interior mockups. */
const BIG = { width: 60, height: 97.5 };
/** Past the shop's door in the outside picture, heading on to the next chasm. */
const OUTSIDE_PLAYER = { x: 820, y: 305, width: 40, height: 65 };

/**
 * The zipline shop, one page at a time, like the Clothing shop mockups: the shop's
 * interior, the store drawn as a box with the zip line on its diagonal, the zip line
 * installed, and the trail outside afterwards. The page's text and buttons go in the
 * dialog box. Clicking a button reports its position on the page, and
 * ZiplineShopController decides what that means.
 */
export class ZiplineScreen {
  private readonly scene = new Konva.Group({ listening: false });
  private readonly figures = new Konva.Group({ listening: false });
  private readonly box = createDialogBox((index) => this.onPick?.(index));
  private onPick: ((index: number) => void) | null = null;
  private added = false;

  constructor(
    private readonly layers: Layers,
    private readonly problem: ZiplineProblem,
  ) {}

  /** Draws `page` with `text` and a button for each choice, replacing the page shown before. */
  show(page: ZiplinePage, text: string, choices: string[]): void {
    if (!this.added) {
      this.layers.background.add(this.scene);
      this.layers.sprites.add(this.figures);
      this.layers.ui.add(this.box.group);
      this.added = true;
    }
    // The guesses all look alike, so a teal first button can't hint at the answer.
    this.box.show(text, choices, { plain: page === 'answer' });
    this.scene.destroyChildren();
    this.figures.destroyChildren();

    // The dialog box grows with its text, so each drawing fits the room left above it.
    const floor = this.box.group.y();
    const words = { length: 'length', width: 'width', height: 'height' };
    const { length, width, height } = this.problem;
    const numbers = { length: `${length} m`, width: `${width} m`, height: `${height} m` };

    switch (page) {
      case 'deal':
        this.drawWoodWall();
        this.drawShopInterior(floor);
        break;
      case 'problem':
        this.drawWoodWall();
        this.drawCard(floor, words);
        break;
      case 'answer':
        this.drawWoodWall();
        this.drawCard(floor, { ...numbers, diagonal: 'x' });
        break;
      case 'tutorial':
        this.drawGraphPaper();
        this.drawOnGraphPaper(floor, { ...words, diagonal: 'x' });
        break;
      case 'solution':
        this.drawGraphPaper();
        this.drawOnGraphPaper(floor, { ...numbers, diagonal: 'x' });
        break;
      case 'wrong':
        this.drawWoodWall();
        // The store owner up close, at three times the sprite's size.
        this.figures.add(new Konva.Image({ image: image('shopOwnerClothing'), x: 420, y: floor - 195, width: 120, height: 195 }));
        break;
      case 'right':
        this.drawZiplineInstalled(floor);
        break;
      case 'onwardDressed':
      case 'onwardPacked':
        this.scene.add(new Konva.Image({ image: image('shopClothingOutside'), width: STAGE_WIDTH, height: STAGE_HEIGHT }));
        this.figures.add(new Konva.Image({ image: image(page === 'onwardDressed' ? 'playerNewOutfit' : 'player'), ...OUTSIDE_PLAYER }));
        break;
    }
  }
  // Optional documentation
  // - destroyChildren(): deletes everything inside the group but keeps the group, so the next page draws into the same place.
  // - { ...numbers, diagonal: 'x' }: copies numbers' three labels and adds a fourth for the zip line.
  // - case 'onwardDressed': with no break, falls through to the next case, so both pages run the same lines.

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

  /** The shop's plank wall, like the interior mockups. */
  private drawWoodWall(): void {
    this.scene.add(new Konva.Rect({ width: STAGE_WIDTH, height: STAGE_HEIGHT, fill: colors.wood }));
    for (let y = 60; y < STAGE_HEIGHT; y += 60) {
      this.scene.add(new Konva.Rect({ y, width: STAGE_WIDTH, height: 3, fill: colors.woodDark }));
    }
  }

  /** The "Store owner's deal" mockup: shelves, a window, and the store owner behind the counter. */
  private drawShopInterior(floor: number): void {
    this.scene.add(
      new Konva.Rect({ x: 80, y: 120, width: 320, height: 10, fill: colors.woodDark }),
      new Konva.Rect({ x: 80, y: 220, width: 320, height: 10, fill: colors.woodDark }),
      new Konva.Rect({ x: 644, y: 84, width: 192, height: 132, fill: colors.ice, stroke: colors.woodDark, strokeWidth: 8 }),
    );
    this.figures.add(
      new Konva.Image({ image: image('shopOwnerClothing'), x: 610, y: 246 - BIG.height, ...BIG }),
      new Konva.Rect({ x: 480, y: 246, width: 320, height: 20, fill: colors.woodDark }),
      new Konva.Image({ image: image('player'), x: 300, y: floor - BIG.height, ...BIG }),
    );
  }

  /** The white card the store owner shows the problem on, with the store drawn inside. */
  private drawCard(floor: number, labels: ZiplineLabels): void {
    const card = { x: 180, y: TOP + GAP, width: 600, height: floor - TOP - 2 * GAP };
    this.scene.add(new Konva.Rect({ ...card, name: 'zipline-card', fill: colors.white, cornerRadius: 8 }));
    // The margins leave room for the tags that hang outside the box.
    this.figures.add(createZiplineDiagram(card.width - 220, card.height - 70, labels).position({ x: card.x + 110, y: card.y + 42 }));
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

  private drawOnGraphPaper(floor: number, labels: ZiplineLabels): void {
    this.figures.add(createZiplineDiagram(420, floor - TOP - 90, labels).position({ x: 270, y: TOP + 50 }));
  }

  /** The "Right answer" mockup: the zip line runs from the office down to the exit. */
  private drawZiplineInstalled(floor: number): void {
    this.scene.add(new Konva.Rect({ width: STAGE_WIDTH, height: STAGE_HEIGHT, fill: colors.panel }));
    this.scene.add(
      new Konva.Rect({ x: 720, y: 60, width: 200, height: 120, fill: colors.rockLight }),
      new Konva.Rect({ x: 740, y: 90, width: 50, height: 90, fill: colors.ink }),
      new Konva.Rect({ x: 820, y: 84, width: 80, height: 50, fill: colors.ice }),
      new Konva.Rect({ x: 700, y: 180, width: 240, height: 8, fill: colors.ink }),
      new Konva.Rect({ x: 40, y: 340, width: 90, height: Math.max(floor - 340, 0), fill: colors.ink }),
      new Konva.Rect({ x: 45, y: 310, width: 80, height: 26, fill: colors.teal }),
      new Konva.Text({ ...textStyles.label, x: 45, y: 310, width: 80, height: 26, text: 'EXIT', align: 'center', verticalAlign: 'middle', fill: colors.white }),
    );
    this.figures.add(
      new Konva.Line({ points: [90, 330, 700, 185], stroke: colors.ink, strokeWidth: 3 }),
      new Konva.Image({ image: image('shopOwnerClothing'), x: 840, y: 115, width: 40, height: 65 }),
      // Under the high end of the zip line, so the line clears the player's hat.
      new Konva.Image({ image: image('playerCelebrating'), x: 420, y: floor - BIG.height, width: 75, height: BIG.height }),
    );
  }
}
// Optional documentation
// - import type { ZiplinePage }: imports only the type, which TypeScript uses for checking and then removes.
// - new Konva.Group({ listening: false }): nothing inside the group reacts to the mouse, so only the dialog box's buttons can be clicked.
// - this.added: the first show() puts the screen's groups on the layers; later pages redraw inside them. After destroy() they're gone, so nothing shows again.
// - new Konva.Image({ image: image('player'), ... }): draws a picture loaded by view/assets; width and height stretch it to that size.
// - Math.max(floor - 340, 0): never a negative height, even if the dialog box were very tall.
