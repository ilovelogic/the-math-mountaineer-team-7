import Konva from 'konva';
import { STAGE_WIDTH } from '../stage';
import { colors, text } from '../theme';

/** What the top bar shows on its right-hand side, which changes as the player plays. */
export interface TopBarStatus {
  topic: string;
  level: number;
  points: number;
}

/** What createTopBar gives back: the group to add to a layer, and a way to show new values. */
export interface TopBar {
  group: Konva.Group;
  update(status: TopBarStatus): void;
}

// Sizes from the UI/Top bar component in the mockups.
const HEIGHT = 48;
const EDGE_PADDING = 24;
const GAP = 24;

/**
 * The dark bar across the top of every play screen: the game title on the left,
 * and the topic, level and points on the right, like the chasm mockups. The Hud
 * calls `update` with new values. The bar only shows them and never changes the
 * player's progress itself.
 */
export function createTopBar(title: string, status: TopBarStatus): TopBar {
  const centered = { y: 0, height: HEIGHT, verticalAlign: 'middle' };
  const background = new Konva.Rect({ width: STAGE_WIDTH, height: HEIGHT, fill: colors.ink });
  const titleText = new Konva.Text({ ...text.heading, ...centered, text: title, fill: colors.white, x: EDGE_PADDING });
  const topicText = new Konva.Text({ ...text.body, ...centered, fill: colors.snow });
  const levelText = new Konva.Text({ ...text.body, ...centered, fill: colors.white });
  const pointsText = new Konva.Text({ ...text.label, ...centered, fill: colors.cream });

  const group = new Konva.Group();
  group.add(background, titleText, topicText, levelText, pointsText);

  function update(next: TopBarStatus): void {
    topicText.text(`Topic: ${next.topic}`);
    levelText.text(`Level ${next.level}`);
    pointsText.text(`Points: ${next.points}`);

    // Widths change with the text, so line the items up again from the right edge.
    let right = STAGE_WIDTH - EDGE_PADDING;
    for (const item of [pointsText, levelText, topicText]) {
      item.x(right - item.width());
      right = item.x() - GAP;
    }
  }

  update(status);
  return { group, update };
}
// Optional documentation
// - { ...text.heading, ...centered, ... }: each spread `...` copies the properties of one object into the new one, in order; later properties override earlier ones.
// - verticalAlign: 'middle' with height: HEIGHT: centres each line of text vertically within the bar's 48 px.
// - function update inside createTopBar: a function defined inside another keeps access to its variables, so it can still reach the bar's text nodes after createTopBar has returned.
// - `Topic: ${next.topic}`: a template string; the value inside ${ } is inserted into the text.
// - topicText.text(...) / item.x(...): called with a value, these change the node; Konva redraws it on its own.
// - item.width(): with no width set, a Konva.Text measures its current text, so it reflects the new value right after .text(...).
// - for (const item of [...]): runs the loop body once per item in the array, in order.
