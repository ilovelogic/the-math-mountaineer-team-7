import Konva from 'konva';
import { colors, text } from '../theme';

export type LogState = 'default' | 'selected' | 'used';

/** What createLogButton gives back: the group to add to a layer, and a way to change its look later. */
export interface LogButton {
  group: Konva.Group;
  setState(state: LogState): void;
}

// Sizes from the UI/Log button component in the mockups.
const PADDING_X = 16;
const PADDING_Y = 11;
const ICON_WIDTH = 30;
const ICON_HEIGHT = 12;
const ICON_GAP = 8;
const CORNER_RADIUS = 6;

const LOOKS = {
  default: { fill: colors.white, border: colors.ink, borderWidth: 1.5, opacity: 1 },
  selected: { fill: colors.cream, border: colors.orange, borderWidth: 2, opacity: 1 },
  used: { fill: colors.white, border: colors.ink, borderWidth: 1.5, opacity: 0.4 },
};

/**
 * One of the logs the player picks from, with a small log icon and its length,
 * like the mockups' "13 m". It reports clicks through `onClick` and never decides
 * whether the log is right: ChasmController does that, then calls `setState` to
 * show the pick. A used log is faded and ignores clicks.
 */
export function createLogButton(label: string, onClick: () => void): LogButton {
  const caption = new Konva.Text({ ...text.label, text: label, x: PADDING_X + ICON_WIDTH + ICON_GAP, y: PADDING_Y });
  const height = caption.height() + 2 * PADDING_Y;
  const icon = new Konva.Rect({
    x: PADDING_X,
    y: (height - ICON_HEIGHT) / 2,
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    cornerRadius: ICON_HEIGHT / 2,
    fill: colors.wood,
    stroke: colors.woodDark,
    strokeWidth: 1,
  });
  const background = new Konva.Rect({ width: caption.x() + caption.width() + PADDING_X, height, cornerRadius: CORNER_RADIUS });

  let current: LogState = 'default';
  const group = new Konva.Group();
  group.add(background, icon, caption);
  group.on('click tap', () => {
    if (current !== 'used') onClick();
  });

  function setState(state: LogState): void {
    current = state;
    const look = LOOKS[state];
    background.fill(look.fill);
    background.stroke(look.border);
    background.strokeWidth(look.borderWidth);
    group.opacity(look.opacity);
  }

  setState('default');
  return { group, setState };
}
// Optional documentation
// - { ...text.label, text: label, ... }: the spread `...` copies every property of text.label into the new object; the properties after it add to or override them.
// - caption.width() / caption.height(): with no size set, a Konva.Text measures its own text, so the shapes around it can be sized to fit.
// - cornerRadius: rounds a rectangle's corners by this many pixels; half the height makes fully rounded ends, like a log.
// - function setState inside createLogButton: a function defined inside another keeps access to its variables, so it can still reach this button's background, group and `current` after createLogButton has returned.
// - background.fill(...), .stroke(...), .strokeWidth(...): called with a value, these change the shape; Konva redraws it on its own.
// - group.opacity(0.4): 0 is invisible and 1 fully opaque; it fades everything in the group.
// - { group, setState }: shorthand for { group: group, setState: setState }.
