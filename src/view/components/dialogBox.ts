import Konva from 'konva';
import { STAGE_HEIGHT, STAGE_WIDTH } from '../stage';
import { colors, text } from '../theme';
import { createButton } from './button';

/** What createDialogBox gives back: the group to add to a layer, and a way to show each new line. */
export interface DialogBox {
  group: Konva.Group;
  show(line: string, choices: string[]): void;
}

// Sizes from the UI/Dialog box component in the mockups (padding includes its 2 px border).
const PADDING_X = 30;
const PADDING_Y = 22;
const GAP = 16;
const BORDER_WIDTH = 2;
const MAX_CHOICES = 3;

/**
 * The white box along the bottom of the screen that shows one line of the story
 * and up to three choices, like the intro mockups. Clicking a choice calls
 * `onChoice` with its position (0 for the first), the same index an Outcome
 * reports, and the controller decides what that choice means. Call `show` for
 * each new line; the box resizes to fit and stays pinned to the bottom of the stage.
 */
export function createDialogBox(onChoice: (index: number) => void): DialogBox {
  const background = new Konva.Rect({ width: STAGE_WIDTH, fill: colors.white, stroke: colors.ink, strokeWidth: BORDER_WIDTH });
  const message = new Konva.Text({ ...text.dialog, x: PADDING_X, y: PADDING_Y, width: STAGE_WIDTH - 2 * PADDING_X });
  const buttons = new Konva.Group({ x: PADDING_X });

  const group = new Konva.Group();
  group.add(background, message, buttons);

  function show(line: string, choices: string[]): void {
    if (choices.length > MAX_CHOICES) {
      throw new RangeError(`The dialog box shows at most ${MAX_CHOICES} choices, but was given ${choices.length}.`);
    }

    message.text(line);
    buttons.destroyChildren();
    let x = 0;
    choices.forEach((choice, index) => {
      const button = createButton(choice, () => onChoice(index), index === 0 ? 'primary' : 'secondary');
      button.x(x);
      buttons.add(button);
      x += button.getClientRect({ relativeTo: buttons }).width + GAP;
    });

    // With no choices, the row takes no space, so the box closes up under the text.
    const rowHeight = choices.length > 0 ? buttons.getClientRect({ relativeTo: group }).height + GAP : 0;
    buttons.y(PADDING_Y + message.height() + GAP);
    const height = PADDING_Y + message.height() + rowHeight + PADDING_Y;
    background.height(height);
    group.y(STAGE_HEIGHT - height);
  }

  return { group, show };
}
// Optional documentation
// - { ...text.dialog, x: ..., width: ... }: the spread `...` copies every property of text.dialog into the new object; the properties after it add to or override them.
// - Konva.Text with a fixed width: long lines wrap onto new lines inside that width, and height() then reports the wrapped height.
// - function show inside createDialogBox: a function defined inside another keeps access to its variables, so it can still reach this box's shapes after createDialogBox has returned.
// - throw new RangeError(...): stops the program with an error saying the value is out of the allowed range; a test can expect it with toThrow.
// - `... ${MAX_CHOICES} ...`: a template string; the value inside ${ } is inserted into the text.
// - buttons.destroyChildren(): removes and deletes every node inside the group, so the old line's buttons don't pile up.
// - choices.forEach((choice, index) => ...): runs the function once per choice, also passing its position, starting at 0.
// - condition ? a : b: gives a when the condition is true and b otherwise.
// - getClientRect({ relativeTo: buttons }): the node's size and position measured in the group's own coordinates, so it stays right when the stage is scaled to fit the window.
// - { group, show }: shorthand for { group: group, show: show }.
