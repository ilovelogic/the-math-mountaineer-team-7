import { settings } from '../content/settings';
import { Dialogue, type DialogueLine } from '../model/Dialogue';
import { DialogueBox } from '../view/DialogueBox';
import type { Layers } from '../view/stage';
import type { Outcome, Screen } from './Screen';

/**
 * Plays one dialogue scene, such as the intro or a Level done message, one box per
 * click. Clicks during the short change between boxes are ignored, so a fast double
 * click never skips a box. After the last box it tells GameFlow the scene is done.
 */
export class DialogueController implements Screen {
  private dialogue: Dialogue | null = null;
  private box: DialogueBox | null = null;
  private onDone: ((outcome: Outcome) => void) | null = null;

  /**
   * `lines` is the scene to play, from content/dialogueScripts or model/levelDone.
   * `now` gives the click time in ms; tests pass a fake clock instead.
   */
  constructor(
    private readonly layers: Layers,
    private readonly lines: readonly DialogueLine[],
    private readonly now: () => number = () => performance.now(),
  ) {}

  start(onDone: (outcome: Outcome) => void): void {
    this.onDone = onDone;
    this.dialogue = new Dialogue(this.lines, settings.dialogueTransitionMs);
    this.box = new DialogueBox(this.layers, () => this.pick());
    this.box.show(this.dialogue.current());
  }

  stop(): void {
    this.box?.destroy();
    this.box = null;
  }

  /** Moves on one box, or reports the scene done after the last one. Ignored clicks change nothing. */
  private pick(): void {
    if (!this.dialogue || !this.dialogue.advance(this.now())) return;
    if (!this.dialogue.isFinished()) {
      this.box?.show(this.dialogue.current());
      return;
    }
    this.onDone?.({ kind: 'done' });
  }
}
// Optional documentation
// - implements Screen: TypeScript checks that this class has every method the Screen interface lists, so GameFlow can run it like any other screen.
// - private readonly layers in the constructor's parameters: declares a field and sets it from the argument in one step.
// - now: () => number = () => performance.now(): a parameter with a default; the game leaves it out and gets the browser's clock, in ms since the page opened.
// - this.box?.destroy(): calls destroy only if box isn't null, so stop() is safe before start() or twice.
// - () => this.pick(): an arrow function keeps `this` pointing at the controller when the box calls it later.
