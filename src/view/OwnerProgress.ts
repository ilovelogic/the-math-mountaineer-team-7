import Konva from 'konva';
import { ownerProgressText } from '../content/duelText';
import { settings } from '../content/settings';
import { colors, text } from './theme';

/**
 * Where the panel goes on the duel page: in the top-left corner DuelScreen leaves empty
 * (#55), just under the Hud's "Level 1 of 3" tag, which ends at y = 84.
 */
const PANEL = { x: 24, y: 96, width: 200, height: 64 } as const;
const PIE = { x: 32, y: 32, radius: 22 } as const;
const LABEL_X = 66;
const STATUS_SIZE = 14;

/**
 * The store owner's race to solve the duel question (#57): a pie that fills over
 * `durationMs`, beside "Store owner · Solving…". It has the shape of the controller's
 * `OpponentTimer`, so DuelShopController can start it on the duel page and stop it
 * when the page or the screen ends.
 *
 * The time comes from Konva's animation frames, not the wall clock, so it pauses with
 * them. Nothing is drawn until `start`, and `stop` removes everything, so the panel
 * never lingers on the won or lost page and never animates after the screen ends.
 */
export class OwnerProgress {
  private group: Konva.Group | null = null;
  private animation: Konva.Animation | null = null;
  private onFinish: (() => void) | null = null;

  constructor(
    private readonly layer: Konva.Layer,
    private readonly durationMs: number = settings.ownerSolveMs,
  ) {}

  /** Draws an empty pie and starts filling it. Calls `onFinish` once, when it's full. Starting again restarts the race. */
  start(onFinish: () => void): void {
    this.stop();
    this.onFinish = onFinish;

    const fill = new Konva.Wedge({ ...PIE, angle: 0, rotation: -90, fill: colors.orange, name: 'owner-progress-fill' });
    this.group = new Konva.Group({ ...PANEL, name: 'owner-progress' });
    this.group.add(
      new Konva.Rect({ width: PANEL.width, height: PANEL.height, fill: colors.white, stroke: colors.ink, strokeWidth: 2, cornerRadius: 8 }),
      new Konva.Circle({ ...PIE, fill: colors.panel, stroke: colors.ink, strokeWidth: 2 }),
      fill,
      new Konva.Text({ ...text.label, text: ownerProgressText.name, x: LABEL_X, y: 12 }),
      new Konva.Text({ ...text.body, fontSize: STATUS_SIZE, fill: colors.mutedText, text: ownerProgressText.status, x: LABEL_X, y: 34 }),
    );
    this.layer.add(this.group);

    this.animation = new Konva.Animation((frame) => {
      const done = progressAt(frame.time, this.durationMs);
      fill.angle(360 * done);
      if (done >= 1) this.finish();
    }, this.layer);
    this.animation.start();
  }

  /** Stops the race and removes the panel. Safe to call when it isn't running, and from inside `onFinish`. */
  stop(): void {
    this.onFinish = null;
    this.animation?.stop();
    this.animation = null;
    this.group?.destroy();
    this.group = null;
  }

  /** The store owner is done: stop the frames, keep the full pie showing, and report it once. */
  private finish(): void {
    this.animation?.stop();
    this.animation = null;
    const onFinish = this.onFinish;
    this.onFinish = null;
    onFinish?.();
  }
}

/** How full the store owner's progress is after `elapsedMs`, from 0 to 1. A duration of 0 or less is full right away. */
export function progressAt(elapsedMs: number, durationMs: number): number {
  if (durationMs <= 0) return 1;
  return Math.min(Math.max(elapsedMs / durationMs, 0), 1);
}
// Optional documentation
// - new Konva.Animation((frame) => ..., layer): runs the function before every frame and then redraws `layer`; frame.time is the ms the animation has been running.
// - Konva.Wedge with rotation: -90: a pie slice that starts at 12 o'clock and grows clockwise as its angle goes from 0 to 360.
// - const onFinish = this.onFinish; this.onFinish = null: clearing the callback before calling it means it can only run once, even if it calls stop().
// - this.group?.destroy(): `?.` only calls destroy when the panel is drawn, so stop() is safe before start().
