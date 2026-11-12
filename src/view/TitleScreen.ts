import Konva from 'konva';
import { image } from './assets';
import { createButton } from './components/button';
import { STAGE_HEIGHT, STAGE_WIDTH, type Layers } from './stage';
import { colors, text } from './theme';

const TITLE = 'The Math Mountaineer';
const PITCH = 'Cross the mountains with the Pythagorean theorem to find your friend.';

// Sizes and positions from the "Title screen" mockup. The mockup's small note under the
// buttons is a note for us, not for players, so the card ends 30 px below the buttons.
const CARD = { x: 208, y: 40, width: 544, height: 226 };
const PITCH_BOX = { x: 42, y: 92, width: 460 };
const BUTTONS_Y = 150;
const BUTTON_GAP = 16;
const PLAYER = { x: 380, y: 305, width: 40, height: 65 };
const FRIEND = { x: 520, y: 305, width: 40, height: 65 };

/**
 * The title screen: the mountains, the mountaineer and the friend, and a card with the
 * game's name, a one-line pitch, and its buttons, like the "Title screen" mockup.
 * Clicking a button reports its position, New game first and Continue second (NEW_GAME
 * and CONTINUE in controller/TitleController), and the controller decides what that means.
 */
export class TitleScreen {
  private readonly drawn: Konva.Node[] = [];
  private onPick: ((index: number) => void) | null = null;

  constructor(private readonly layers: Layers) {}

  /** Draws the screen, with a Continue button only when `canContinue` is true. Call it once. */
  draw(canContinue: boolean): void {
    const scene = new Konva.Image({ image: image('mountainsDay'), width: STAGE_WIDTH, height: STAGE_HEIGHT });
    const player = new Konva.Image({ image: image('player'), ...PLAYER });
    const friend = new Konva.Image({ image: image('friend'), ...FRIEND });
    const card = this.drawCard(canContinue);

    this.layers.background.add(scene);
    this.layers.sprites.add(player, friend);
    this.layers.ui.add(card);
    this.drawn.push(scene, player, friend, card);
  }
  // Optional documentation
  // - new Konva.Image({ image, width, height }): draws a loaded picture; width and height stretch it, so the background always fills the stage.
  // - { image: ..., ...PLAYER }: the spread `...` copies PLAYER's x, y, width and height into the options.

  /** Calls `cb` with the clicked button's position each time one is clicked, until `destroy()`. */
  onChoice(cb: (index: number) => void): void {
    this.onPick = cb;
  }

  /** Removes everything this screen drew. It can't be drawn again afterwards. */
  destroy(): void {
    this.onPick = null;
    this.drawn.forEach((node) => node.destroy());
  }
  // Optional documentation
  // - node.destroy(): removes the node from its layer and deletes it, along with any click handlers on it.

  private drawCard(canContinue: boolean): Konva.Group {
    const card = new Konva.Group({ x: CARD.x, y: CARD.y });
    card.add(
      new Konva.Rect({ width: CARD.width, height: CARD.height, fill: colors.white, stroke: colors.ink, strokeWidth: 2, cornerRadius: 6 }),
      new Konva.Text({ ...text.title, text: TITLE, y: 30, width: CARD.width, align: 'center' }),
      new Konva.Text({ ...text.subtitle, text: PITCH, ...PITCH_BOX, align: 'center' }),
    );

    const labels = canContinue ? ['New game', 'Continue'] : ['New game'];
    const buttons = labels.map((label, index) =>
      createButton(label, () => this.onPick?.(index), index === 0 ? 'primary' : 'secondary'),
    );
    // The buttons sit side by side, centered on the card whether there are one or two.
    const rowWidth = buttons.reduce((sum, button) => sum + button.getClientRect().width, 0) + BUTTON_GAP * (buttons.length - 1);
    let x = (CARD.width - rowWidth) / 2;
    for (const button of buttons) {
      button.position({ x, y: BUTTONS_Y });
      card.add(button);
      x += button.getClientRect().width + BUTTON_GAP;
    }
    return card;
  }
  // Optional documentation
  // - align: 'center' with a width: the text is centered inside that width, and wraps onto a new line if it's too long.
  // - labels.map((label, index) => ...): makes one button per label; index is the label's position, which is what a click reports.
  // - this.onPick?.(index): calls onPick only if a controller has set one, so a click before then does nothing.
  // - buttons.reduce((sum, button) => ..., 0): adds up the buttons' widths, starting from 0.
  // - getClientRect().width: how wide the button is drawn, which depends on its label.
  // - button.position({ x, y }): sets where the button sits inside the card.
}
// Optional documentation
// - import { ..., type Layers }: `type` marks an import used only for type checking, so it adds nothing to the built code.
