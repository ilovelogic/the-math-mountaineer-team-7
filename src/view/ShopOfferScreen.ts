import Konva from 'konva';
import type { Shop } from '../content/levels';
import type { ShopOffer } from '../content/shopText';
import { image } from './assets';
import { createDialogBox } from './components/dialogBox';
import { STAGE_HEIGHT, STAGE_WIDTH, type Layers } from './stage';

/** Each shop's outside scene (sky, mountains and the shop building), flattened into one image from the mockups. */
const BACKGROUNDS: Record<Shop, string> = {
  supplies: 'shopSuppliesOutside',
  clothing: 'shopClothingOutside',
};

/** Where the player stands in both offer mockups, on the path to the left of the shop. */
const PLAYER = { x: 240, y: 305, width: 40, height: 65 };

/**
 * The outside of a shop, with the player walking up to it and the shop's offer in the
 * dialog box, like the "Supply shop offer" and "Clothing shop offer" mockups. Clicking a
 * button reports its position, accept first and decline second (ACCEPT and DECLINE in
 * content/shopText), and ShopOfferController decides what that means.
 */
export class ShopOfferScreen {
  private readonly drawn: Konva.Node[] = [];
  private onPick: ((index: number) => void) | null = null;

  constructor(
    private readonly layers: Layers,
    private readonly shop: Shop,
    private readonly offer: ShopOffer,
  ) {}
  // Optional documentation
  // - private readonly layers in the constructor's parameters: declares a field and sets it from the argument in one step.

  /** Draws the scene and the offer. Call it once. */
  draw(): void {
    const scene = new Konva.Image({ image: image(BACKGROUNDS[this.shop]), width: STAGE_WIDTH, height: STAGE_HEIGHT });
    const player = new Konva.Image({ image: image('player'), ...PLAYER });
    const box = createDialogBox((index) => this.onPick?.(index));
    box.show(this.offer.text, [this.offer.accept, this.offer.decline]);

    this.layers.background.add(scene);
    this.layers.sprites.add(player);
    this.layers.ui.add(box.group);
    this.drawn.push(scene, player, box.group);
  }
  // Optional documentation
  // - new Konva.Image({ image, width, height }): draws a loaded picture; width and height stretch it, so the background always fills the stage.
  // - { image: ..., ...PLAYER }: the spread `...` copies PLAYER's x, y, width and height into the options.
  // - this.onPick?.(index): calls onPick only if a controller has set one, so a click before then does nothing.

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
}
// Optional documentation
// - import { ..., type Layers }: `type` marks an import used only for type checking, so it adds nothing to the built code.
