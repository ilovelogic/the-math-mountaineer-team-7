import Konva from 'konva';
import { colors, text } from './theme';

// Sizes from the "Math/Formula card" in the mockups. Its caption is 14 px, a little
// smaller than the body style, so the card stays about the mockup's 423 px wide.
const PADDING_X = 24;
const PADDING_Y = 16;
const LINE_GAP = 8;
const CAPTION_SIZE = 14;

/**
 * A white card with a formula and a one-line caption under it, like the mockups'
 * formula card. It grows to fit its text, and it's drawn from (0, 0), so position
 * it by setting the group's x and y.
 */
export function createFormulaCard(formula: string, caption: string): Konva.Group {
  const formulaText = new Konva.Text({ ...text.formula, text: formula, x: PADDING_X, y: PADDING_Y });
  const captionText = new Konva.Text({
    ...text.body,
    fontSize: CAPTION_SIZE,
    fill: colors.mutedText,
    text: caption,
    x: PADDING_X,
    y: PADDING_Y + formulaText.height() + LINE_GAP,
  });
  const width = Math.max(formulaText.width(), captionText.width()) + 2 * PADDING_X;
  const height = captionText.y() + captionText.height() + PADDING_Y;

  const card = new Konva.Group({ name: 'formula-card' });
  card.add(
    new Konva.Rect({ width, height, fill: colors.white, stroke: colors.ink, strokeWidth: 2, cornerRadius: 8 }),
    formulaText,
    captionText,
  );
  return card;
}
// Optional documentation
// - { ...text.body, fontSize: CAPTION_SIZE, fill: ... }: the spread `...` copies the body style, and the properties after it override its size and color.
// - formulaText.width() / .height(): with no width set, a Konva.Text measures its own text, so the card can be sized around it.
// - Math.max(a, b): the larger of the two, so the card is as wide as its longer line.
// - new Konva.Group({ name: 'formula-card' }): a name lets other code and tests find the card with find('.formula-card').
