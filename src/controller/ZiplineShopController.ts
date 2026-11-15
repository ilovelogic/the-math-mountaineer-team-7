import { settings } from '../content/settings';
import { ziplineText, type ZiplinePage } from '../content/ziplineText';
import { checkZiplineAnswer, fillZiplineText, type ZiplineProblem } from '../model/zipline';
import type { Outcome, Screen } from './Screen';

/** What ZiplineShopController needs from its screen, so tests can pass a stand-in instead of ZiplineScreen. */
export interface ZiplineView {
  /** Draws `page` with its text and buttons, replacing the page shown before. */
  show(page: ZiplinePage, text: string, choices: string[]): void;
  /** Calls `cb` with the clicked button's position on the page being shown. */
  onChoice(cb: (index: number) => void): void;
  destroy(): void;
}

/** Where each button leads, by its position on the page: another page, or the end of the shop. The answer page is left out, since the guess decides. */
const NEXT: Record<Exclude<ZiplinePage, 'answer'>, (ZiplinePage | 'end')[]> = {
  deal: ['problem', 'end'],
  problem: ['tutorial', 'answer'],
  tutorial: ['problem'],
  right: ['onwardDressed', 'onwardPacked'],
  onwardDressed: ['end'],
  onwardPacked: ['end'],
  wrong: ['solution', 'end'],
  solution: ['end'],
};

/**
 * Plays the zipline challenge at the clothing shop, page by page as in the Clothing shop
 * mockups: the store owner's deal, the problem, the tutorial, the answer, and the right or
 * wrong pages after it. The player gets one guess. When the shop ends, it reports the
 * guess as `{ kind: 'choice', index }`, its position in `problem.options`, for GameFlow
 * to check and score; leaving before guessing reports `{ kind: 'done' }`. Clicks just
 * after a page appears are ignored, the first page included, so a fast double click
 * never presses a button on the next page, even one left over from the shop's offer.
 */
export class ZiplineShopController implements Screen {
  private onDone: ((outcome: Outcome) => void) | null = null;
  private page: ZiplinePage = 'deal';
  private changedAt = 0;
  private guess: number | null = null;

  /** `now` gives the click time in ms; tests pass a fake clock instead. */
  constructor(
    private readonly view: ZiplineView,
    private readonly problem: ZiplineProblem,
    private readonly now: () => number = () => performance.now(),
  ) {}

  start(onDone: (outcome: Outcome) => void): void {
    this.onDone = onDone;
    this.view.onChoice((index) => this.pick(index));
    this.go('deal');
  }

  stop(): void {
    this.onDone = null;
    this.view.destroy();
  }

  private pick(index: number): void {
    if (!this.onDone) return;
    if (this.now() - this.changedAt < settings.dialogueTransitionMs) return;

    if (this.page === 'answer') {
      if (!Number.isInteger(index) || index < 0 || index >= this.problem.options.length) return;
      this.guess = index;
      this.go(checkZiplineAnswer(this.problem, index) ? 'right' : 'wrong');
      return;
    }

    const next = NEXT[this.page][index];
    if (next === undefined) return;
    if (next === 'end') this.finish();
    else this.go(next);
  }

  private go(page: ZiplinePage): void {
    this.page = page;
    this.changedAt = this.now();
    const choices = page === 'answer' ? this.problem.options.map((option) => `${option} m`) : ziplineText[page].choices;
    this.view.show(page, fillZiplineText(ziplineText[page].text, this.problem), choices);
  }

  private finish(): void {
    // Clearing the callback before calling it means later clicks find nothing to call,
    // even if GameFlow stops this screen while the report is still being handled.
    const onDone = this.onDone;
    this.onDone = null;
    onDone?.(this.guess === null ? { kind: 'done' } : { kind: 'choice', index: this.guess });
  }
}
// Optional documentation
// - Exclude<ZiplinePage, 'answer'>: every page name except 'answer', so NEXT must list every other page.
// - (ZiplinePage | 'end')[]: each button leads either to a page or to 'end', which finishes the shop.
// - this.problem.options.map((option) => `${option} m`): turns each guess into its button text, such as 13 into "13 m".
// - condition ? a : b: gives a when the condition is true and b otherwise.
