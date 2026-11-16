import type { Outcome, Screen } from './Screen';

/**
 * The title screen's buttons, by position. New game always comes first, so it keeps
 * position 0 whether or not Continue is shown.
 */
export const NEW_GAME = 0;
export const CONTINUE = 1;

/** What TitleController needs from its screen, so tests can pass a stand-in instead of TitleScreen. */
export interface TitleView {
  /** Draws the title, with a Continue button only when `canContinue` is true. */
  draw(canContinue: boolean): void;
  /** Calls `cb` with the clicked button's position, NEW_GAME or CONTINUE. */
  onChoice(cb: (index: number) => void): void;
  destroy(): void;
}

/**
 * Shows the title screen and reports whether the player picked New game or Continue.
 * Whoever makes it decides whether there's a game to continue, so the title never reads
 * the save itself. Only the first click counts, so a fast double click can't report twice.
 */
export class TitleController implements Screen {
  private onDone: ((outcome: Outcome) => void) | null = null;

  constructor(
    private readonly view: TitleView,
    private readonly canContinue: boolean,
  ) {}

  start(onDone: (outcome: Outcome) => void): void {
    this.onDone = onDone;
    this.view.draw(this.canContinue);
    this.view.onChoice((index) => this.pick(index));
  }

  stop(): void {
    this.onDone = null;
    this.view.destroy();
  }

  private pick(index: number): void {
    // Clearing the callback before calling it means later clicks find nothing to call.
    const onDone = this.onDone;
    this.onDone = null;
    onDone?.({ kind: 'choice', index });
  }
}
// Optional documentation
// - implements Screen: TypeScript checks that this class has every method the Screen interface lists.
// - private readonly view in the constructor's parameters: declares a field and sets it from the argument in one step.
// - (index) => this.pick(index): an arrow function keeps `this` pointing at the controller when the view calls it later.
// - onDone?.(...): calls onDone only if it isn't null, so a click after the first one, or after stop(), does nothing.
