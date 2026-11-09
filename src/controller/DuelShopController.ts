import { duelText, type DuelPage } from '../content/duelText';
import { settings } from '../content/settings';
import type { Outcome, Screen } from './Screen';

/** What DuelShopController needs from its screen, so tests can pass a stand-in. The real view comes with #158 and #55. */
export interface DuelView {
  /** Draws `page` with its text and buttons, replacing the page shown before. */
  show(page: DuelPage, text: string, choices: string[]): void;
  /** Calls `cb` with the clicked button's position on the page being shown. */
  onChoice(cb: (index: number) => void): void;
  destroy(): void;
}

/** The parts of the duel question (#56) the flow needs: the answer options in the order shown, and which one is right. */
export interface DuelQuestionChoices {
  options: readonly number[];
  correct: number;
}

/** The store owner's race to solve the question (#57). `start` calls `onFinish` once the store owner is done. */
export interface OpponentTimer {
  start(onFinish: () => void): void;
  stop(): void;
}

/**
 * How the duel ended, reported as `{ kind: 'choice', index }` for GameFlow to apply (#134):
 * the player won and took the shortcut, won but took the normal path, or didn't win
 * (left before the duel, or lost it).
 */
export const DUEL_RESULT = { skipLevel: 0, normalPath: 1, notWon: 2 } as const;

type DuelResult = (typeof DUEL_RESULT)[keyof typeof DUEL_RESULT];
type Next = DuelPage | { result: DuelResult };

/** Where each button leads, by its position on the page. The duel page is left out, since its answer decides. */
const NEXT: Record<Exclude<DuelPage, 'duel'>, Next[]> = {
  challenge: ['tutorialOffer', { result: DUEL_RESULT.notWon }],
  tutorialOffer: ['tutorial', 'duel'],
  tutorial: ['duel'],
  won: ['climb', { result: DUEL_RESULT.normalPath }],
  climb: [{ result: DUEL_RESULT.skipLevel }],
  lost: ['solution', { result: DUEL_RESULT.notWon }],
  solution: [{ result: DUEL_RESULT.notWon }],
};

/**
 * Plays the math duel at the supply shop, page by page as in the Math duel mockups: the
 * store owner's challenge, the tutorial offer, the duel itself, and the won or lost pages
 * after it. The store owner's timer runs only on the duel page, and finishing first
 * counts as a loss, as does a wrong answer. Clicks just after a page appears are
 * ignored, the first page included, so a fast double click never presses a button on
 * the next page, even one left over from accepting the shop's offer. It reports
 * how the duel ended once, and GameFlow decides what that means.
 */
export class DuelShopController implements Screen {
  private onDone: ((outcome: Outcome) => void) | null = null;
  private page: DuelPage = 'challenge';
  private changedAt = 0;

  /** `now` gives the click time in ms; tests pass a fake clock instead. */
  constructor(
    private readonly view: DuelView,
    private readonly question: DuelQuestionChoices,
    private readonly timer: OpponentTimer,
    private readonly now: () => number = () => performance.now(),
  ) {
    const { options, correct } = question;
    if (options.length === 0) throw new RangeError('The duel question needs at least one option.');
    if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) {
      throw new RangeError(`The correct option ${correct} isn't one of the ${options.length} options.`);
    }
  }

  start(onDone: (outcome: Outcome) => void): void {
    this.onDone = onDone;
    this.view.onChoice((index) => this.pick(index));
    this.go('challenge');
  }

  stop(): void {
    this.onDone = null;
    this.timer.stop();
    this.view.destroy();
  }

  private pick(index: number): void {
    if (!this.onDone) return;
    if (this.now() - this.changedAt < settings.dialogueTransitionMs) return;

    if (this.page === 'duel') {
      if (index < 0 || index >= this.question.options.length) return;
      this.go(index === this.question.correct ? 'won' : 'lost');
      return;
    }

    const next = NEXT[this.page][index];
    if (next === undefined) return;
    if (typeof next === 'string') this.go(next);
    else this.finish(next.result);
  }

  private go(page: DuelPage): void {
    if (this.page === 'duel') this.timer.stop();
    this.page = page;
    this.changedAt = this.now();
    const choices = page === 'duel' ? this.question.options.map(String) : duelText[page].choices;
    this.view.show(page, duelText[page].text, choices);
    if (page === 'duel') this.timer.start(() => this.ownerFinished());
  }

  /** The store owner solved it first. A late call, after the player has answered, changes nothing. */
  private ownerFinished(): void {
    if (this.onDone && this.page === 'duel') this.go('lost');
  }

  private finish(result: DuelResult): void {
    // Clearing the callback before calling it means later clicks find nothing to call,
    // even if GameFlow stops this screen while the report is still being handled.
    const onDone = this.onDone;
    this.onDone = null;
    onDone?.({ kind: 'choice', index: result });
  }
}
// Optional documentation
// - (typeof DUEL_RESULT)[keyof typeof DUEL_RESULT]: the type of any value in DUEL_RESULT, here 0 | 1 | 2.
// - Exclude<DuelPage, 'duel'>: every page name except 'duel', so NEXT must list every other page.
// - typeof next === 'string': a page name moves to that page; otherwise `next` is a result to report.
// - this.question.options.map(String): turns each number into its text, such as 13 into "13", for the buttons.
