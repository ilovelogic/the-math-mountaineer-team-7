import Konva from 'konva';
import { colors, text } from '../theme';

export type ButtonStyle = 'primary' | 'secondary';

// Sizes from the UI/Button component in the mockups.
const PADDING_X = 20;
const PADDING_Y = 12;
const CORNER_RADIUS = 6;
const BORDER_WIDTH = 1.5;

const LOOKS = {
  primary: { fill: colors.teal, textColor: colors.white, border: undefined },
  secondary: { fill: colors.white, textColor: colors.ink, border: colors.ink },
};

/**
 * A rounded button that grows to fit its label, like the mockups' Start and
 * Hint buttons. It calls `onClick` when pressed and leaves deciding what that
 * means to whoever created it. Position it by setting the group's x and y.
 */
export function createButton(label: string, onClick: () => void, style: ButtonStyle = 'primary'): Konva.Group {
  const look = LOOKS[style];
  const caption = new Konva.Text({ ...text.label, text: label, fill: look.textColor, x: PADDING_X, y: PADDING_Y });
  const background = new Konva.Rect({
    width: caption.width() + 2 * PADDING_X,
    height: caption.height() + 2 * PADDING_Y,
    cornerRadius: CORNER_RADIUS,
    fill: look.fill,
    stroke: look.border,
    strokeWidth: BORDER_WIDTH,
  });

  const button = new Konva.Group();
  button.add(background, caption);
  button.on('click tap', onClick);
  button.on('mouseenter', () => setCursor(button, 'pointer'));
  button.on('mouseleave', () => setCursor(button, 'default'));
  return button;
}
// Optional documentation
// - style: ButtonStyle = 'primary': a default value, so callers can leave the argument out and get a primary button.
// - LOOKS[style]: looks up the entry named by `style`, so each style's colors live in one place.
// - { ...text.label, text: label, ... }: the spread `...` copies every property of text.label into the new object; the properties after it add to or override them.
// - caption.width(): with no width set, a Konva.Text measures its own text, so the background can be sized around it.
// - cornerRadius: rounds the rectangle's corners by this many pixels.
// - border: undefined (in LOOKS): no border is drawn for a primary button.
// - button.on('click tap', ...): one handler for two events; 'tap' is a touchscreen press, which school Chromebooks often have.

function setCursor(button: Konva.Group, cursor: string): void {
  const stage = button.getStage();
  if (stage) stage.container().style.cursor = cursor;
}
// Optional documentation
// - getStage(): the stage the button is on, or null before it has been added to one.
// - stage.container().style.cursor: the mouse cursor over the game's <div>.
