import type { DialogueLine } from '../model/Dialogue';
import { createDialogBox, type DialogBox } from './components/dialogBox';
import type { Layers } from './stage';

/** The button on every box that has no choices of its own, from the "How dialogue works" mockup. */
const CONTINUE = 'Continue';

/**
 * Shows one dialogue line at a time in the shared Dialog box. A box with no choices
 * gets a Continue button; a box that ends a scene, like Level done, shows its own
 * choices instead. Either way a click reports the button's position, and the
 * controller decides what it means.
 */
export class DialogueBox {
  private readonly box: DialogBox;

  constructor(layers: Layers, onPick: (index: number) => void) {
    this.box = createDialogBox(onPick);
    layers.ui.add(this.box.group);
  }

  /** Replaces the box's text and buttons with this line's. The speaker isn't drawn yet, since every line so far is the Narrator's. */
  show(line: DialogueLine): void {
    this.box.show(line.text, line.choices ?? [CONTINUE]);
  }

  /** Removes the box. It can't be shown again afterwards. */
  destroy(): void {
    this.box.group.destroy();
  }
}
// Optional documentation
// - import type { DialogueLine }: imports only the type, which TypeScript uses for checking and then removes, so the view loads no model code.
// - line.choices ?? [CONTINUE]: uses the line's choices if it has them, and a single Continue button if `choices` is missing.
// - group.destroy(): removes the group from its layer and deletes every shape and click handler inside it.
