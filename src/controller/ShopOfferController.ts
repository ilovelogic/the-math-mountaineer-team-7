import type { Outcome, Screen } from './Screen';

/** What ShopOfferController needs from its screen, so tests can pass a stand-in instead of ShopOfferScreen. */
export interface ShopOfferView {
  draw(): void;
  /** Calls `cb` with the clicked button's position, ACCEPT or DECLINE from content/shopText. */
  onChoice(cb: (index: number) => void): void;
  destroy(): void;
}

/**
 * Shows a shop's offer and reports which button the player picked. GameFlow reads the
 * choice with ACCEPT and DECLINE: accept plays the shop's mini-game next, and decline
 * skips it, so the player earns nothing from the shop. Only the first click counts, so a
 * fast double click, or a click on the other button, can't report twice.
 */
export class ShopOfferController implements Screen {
  private onDone: ((outcome: Outcome) => void) | null = null;

  constructor(private readonly view: ShopOfferView) {}
  // Optional documentation
  // - implements Screen: TypeScript checks that this class has every method the Screen interface lists, so GameFlow can run it like any other screen.
  // - private readonly view in the constructor's parameters: declares a field and sets it from the argument in one step.

  start(onDone: (outcome: Outcome) => void): void {
    this.onDone = onDone;
    this.view.draw();
    this.view.onChoice((index) => this.pick(index));
  }
  // Optional documentation
  // - (index) => this.pick(index): an arrow function keeps `this` pointing at the controller when the view calls it later.

  stop(): void {
    this.onDone = null;
    this.view.destroy();
  }

  private pick(index: number): void {
    // Clearing the callback before calling it means later clicks find nothing to call,
    // even if GameFlow stops this screen while the report is still being handled.
    const onDone = this.onDone;
    this.onDone = null;
    onDone?.({ kind: 'choice', index });
  }
  // Optional documentation
  // - onDone?.(...): calls onDone only if it isn't null, so a click after the first one, or after stop(), does nothing.
}
