import Konva from 'konva';
import type { ProgressView } from '../model/PlayerProgress';
import { triplesByLevel } from '../model/problems';
import { createTopBar, type TopBar } from './components/topBar';
import { STAGE_WIDTH, type Layers } from './stage';
import { colors, text } from './theme';

const TITLE = 'The Math Mountaineer';

// Lined up with the top bar: 24 px in from each edge, 8 px under its 48 px.
const EDGE_PADDING = 24;
const BELOW_BAR = 56;
const TAG_PADDING = { x: 10, y: 4 } as const;

/** How long the "+ points" tag floats up and fades out, in seconds, and how far it rises. */
const TAG_SECONDS = 1.2;
const TAG_RISE = 16;

/**
 * Everything the player always sees while playing: the top bar with topic,
 * level and points, a progress line such as "Level 1 of 3 · Chasm 2 of 5", and
 * a "+10 points" tag after a correct pick.
 *
 * GameFlow calls `update` with the latest progress whenever it changes. The Hud
 * takes a `ProgressView`, so it can read the progress but never change it.
 */
export class Hud {
  private readonly group = new Konva.Group({ name: 'hud' });
  private readonly topBar: TopBar;
  private readonly progressLine: Konva.Group;
  private readonly progressText: Konva.Text;
  private readonly pointsTag: Konva.Group;
  private readonly pointsText: Konva.Text;
  private tween: Konva.Tween | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(layers: Layers) {
    this.topBar = createTopBar(TITLE, { topic: '', level: 1, points: 0 });

    this.progressText = new Konva.Text({ ...text.label, x: TAG_PADDING.x, y: TAG_PADDING.y });
    this.progressLine = new Konva.Group({ x: EDGE_PADDING, y: BELOW_BAR, name: 'hud-progress' });
    this.progressLine.add(new Konva.Rect({ fill: colors.panel, stroke: colors.ink, strokeWidth: 1, cornerRadius: 4 }), this.progressText);

    this.pointsText = new Konva.Text({ ...text.label, x: TAG_PADDING.x, y: TAG_PADDING.y });
    this.pointsTag = new Konva.Group({ y: BELOW_BAR, visible: false, name: 'hud-points-gained' });
    this.pointsTag.add(new Konva.Rect({ fill: colors.cream, cornerRadius: 4 }), this.pointsText);

    this.group.add(this.topBar.group, this.progressLine, this.pointsTag);
    layers.ui.add(this.group);
  }

  /**
   * Redraws from the latest progress. Pass `chasm`, counting from 1, while the
   * player is on a chasm; leave it out between chasms, such as during dialogue,
   * and the progress line shows just the level.
   */
  update(progress: ProgressView, chasm?: number): void {
    this.topBar.update({ topic: progress.topic, level: progress.level, points: progress.points });

    const levels = triplesByLevel.length;
    let line = `Level ${progress.level} of ${levels}`;
    if (chasm !== undefined) {
      const chasms = triplesByLevel[progress.level - 1]?.length ?? 0;
      line += ` · Chasm ${chasm} of ${chasms}`;
    }
    this.progressText.text(line);
    fitBackground(this.progressLine, this.progressText);

    // Screens draw into the same layer after the Hud, so keep the Hud on top.
    this.group.moveToTop();
  }

  /** Shows a "+n points" tag under the points that floats up and fades. Does nothing for 0, since a wrong pick earns nothing. */
  showPointsGained(n: number): void {
    if (n <= 0) return;

    this.stopTag();
    this.pointsText.text(`+${n} points`);
    fitBackground(this.pointsTag, this.pointsText);
    this.pointsTag.position({ x: STAGE_WIDTH - EDGE_PADDING - this.pointsTag.width(), y: BELOW_BAR });
    this.pointsTag.opacity(1);
    this.pointsTag.visible(true);
    this.group.moveToTop();

    this.tween = new Konva.Tween({
      node: this.pointsTag,
      duration: TAG_SECONDS,
      y: BELOW_BAR - TAG_RISE,
      opacity: 0,
      easing: Konva.Easings.EaseIn,
    });
    this.tween.play();
    // A timer, not the tween, hides the tag, so it goes away even if the animation is cut short.
    this.hideTimer = setTimeout(() => this.stopTag(), TAG_SECONDS * 1000);
  }

  /** Removes the Hud from the stage. */
  destroy(): void {
    this.stopTag();
    this.group.destroy();
  }

  /** Stops the tag's animation, if one is running, and hides the tag. */
  private stopTag(): void {
    if (this.hideTimer !== null) clearTimeout(this.hideTimer);
    this.hideTimer = null;
    this.tween?.destroy();
    this.tween = null;
    this.pointsTag.visible(false);
  }
}

/** Sizes a tag's rounded background to fit its text, with the same padding on each side. */
function fitBackground(tag: Konva.Group, label: Konva.Text): void {
  const width = label.width() + 2 * TAG_PADDING.x;
  const height = label.height() + 2 * TAG_PADDING.y;
  tag.size({ width, height });
  tag.findOne<Konva.Rect>('Rect')?.size({ width, height });
}
// Optional documentation
// - ProgressView: PlayerProgress without its methods that change anything, so the compiler stops the Hud from changing progress.
// - triplesByLevel[progress.level - 1]?.length ?? 0: `?.` gives undefined instead of throwing when that level doesn't exist, and `?? 0` turns undefined into 0.
// - this.group.moveToTop(): draws the group after everything else in its layer, so it sits in front.
// - new Konva.Tween({ node, duration, y, opacity }): animates the node from its current values to these over `duration` seconds; play() starts it and onFinish runs at the end.
// - this.tween?.destroy(): `?.` only calls destroy when there is a tween; stopping the old one first means two picks in a row don't fight over the same tag.
// - ReturnType<typeof setTimeout>: the type setTimeout returns, which is a number in browsers and an object in Node, so the code compiles for both.
