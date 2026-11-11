import { beforeEach, describe, expect, it } from 'vitest';
import { duelText, type DuelPage } from '../../src/content/duelText';
import { settings } from '../../src/content/settings';
import {
  DUEL_RESULT,
  DuelShopController,
  type DuelQuestionChoices,
  type DuelView,
  type OpponentTimer,
} from '../../src/controller/DuelShopController';
import type { Outcome } from '../../src/controller/Screen';

/**
 * Checks issue #157: the duel plays its pages in the order of the Math duel mockups, each
 * way through it reports the right result, the store owner's timer runs only on the duel
 * page, and fast or late clicks can't skip a page or report twice. A stand-in view
 * records each page and lets the test click its buttons, a stand-in timer finishes when
 * the test says so, and a fake clock moves past the change between pages, so no Konva or
 * waiting is needed.
 */

class FakeDuelView implements DuelView {
  pages: { page: DuelPage; text: string; choices: string[] }[] = [];
  destroyed = false;
  private onPick: ((index: number) => void) | null = null;

  show(page: DuelPage, text: string, choices: string[]): void {
    this.pages.push({ page, text, choices });
  }

  onChoice(cb: (index: number) => void): void {
    this.onPick = cb;
  }

  destroy(): void {
    this.destroyed = true;
  }

  click(index: number): void {
    this.onPick?.(index);
  }

  get current(): DuelPage | undefined {
    return this.pages.at(-1)?.page;
  }
}

class FakeTimer implements OpponentTimer {
  running = false;
  starts = 0;
  private onFinish: (() => void) | null = null;

  start(onFinish: () => void): void {
    this.running = true;
    this.starts++;
    this.onFinish = onFinish;
  }

  stop(): void {
    this.running = false;
  }

  /** The store owner solves it, even if the timer was stopped, to check late calls are ignored. */
  finish(): void {
    this.onFinish?.();
  }
}

// The right answer is the second option, as a duel question from #56 might be.
const QUESTION: DuelQuestionChoices = { options: [12, 13, 15], correct: 1 };
const RIGHT = 1;
const WRONG = 0;

let time: number;
let view: FakeDuelView;
let timer: FakeTimer;
let controller: DuelShopController;
let reports: Outcome[];

beforeEach(() => {
  time = 0;
  view = new FakeDuelView();
  timer = new FakeTimer();
  controller = new DuelShopController(view, QUESTION, timer, () => time);
  reports = [];
  controller.start((outcome) => reports.push(outcome));
});

/** Clicks after the change between pages has passed, as a player reading each page would. */
function clickLater(...indexes: number[]): void {
  for (const index of indexes) {
    time += settings.dialogueTransitionMs;
    view.click(index);
  }
}

const reported = (index: number) => [{ kind: 'choice', index }];

describe('DuelShopController', () => {
  it('starts on the challenge, with its text and two buttons', () => {
    expect(view.pages).toEqual([{ page: 'challenge', ...duelText.challenge }]);
    expect(view.pages[0].choices).toHaveLength(2);
  });

  it('reports not won when the player leaves at the challenge, without starting the timer', () => {
    clickLater(1);
    expect(reports).toEqual(reported(DUEL_RESULT.notWon));
    expect(timer.starts).toBe(0);
  });

  it('plays the whole win path through the tutorial and reports skipping the level', () => {
    clickLater(0, 0, 0, RIGHT, 0, 0);
    expect(view.pages.map((shown) => shown.page)).toEqual(['challenge', 'tutorialOffer', 'tutorial', 'duel', 'won', 'climb']);
    expect(reports).toEqual(reported(DUEL_RESULT.skipLevel));
  });

  it('goes straight to the duel when the tutorial is skipped, showing the options as buttons', () => {
    clickLater(0, 1);
    expect(view.pages.at(-1)).toEqual({ page: 'duel', text: duelText.duel.text, choices: ['12', '13', '15'] });
    expect(timer.running).toBe(true);
  });

  it('reports the normal path when the player wins but turns down the gear', () => {
    clickLater(0, 1, RIGHT, 1);
    expect(reports).toEqual(reported(DUEL_RESULT.normalPath));
  });

  it('loses on a wrong answer, and reports not won when the player leaves', () => {
    clickLater(0, 1, WRONG);
    expect(view.current).toBe('lost');
    expect(timer.running).toBe(false);
    clickLater(1);
    expect(reports).toEqual(reported(DUEL_RESULT.notWon));
  });

  it('shows the solution after a loss, and reports not won from it', () => {
    clickLater(0, 1, WRONG, 0);
    expect(view.current).toBe('solution');
    expect(reports).toEqual([]);
    clickLater(0);
    expect(reports).toEqual(reported(DUEL_RESULT.notWon));
  });

  it('loses when the store owner finishes first', () => {
    clickLater(0, 1);
    timer.finish();
    expect(view.current).toBe('lost');
    expect(timer.running).toBe(false);
  });

  it('runs the timer only on the duel page, and ignores the store owner finishing after an answer', () => {
    clickLater(0, 0);
    expect(timer.starts).toBe(0);
    clickLater(0);
    expect(timer.running).toBe(true);
    clickLater(RIGHT);
    expect(timer.running).toBe(false);
    timer.finish();
    expect(view.current).toBe('won');
  });

  it('ignores a click left over from accepting the shop’s offer', () => {
    view.click(0);
    expect(view.current).toBe('challenge');
  });

  it('ignores a second click that lands just after the page changes', () => {
    clickLater(0);
    view.click(0);
    expect(view.current).toBe('tutorialOffer');
    time += settings.dialogueTransitionMs - 1;
    view.click(0);
    expect(view.current).toBe('tutorialOffer');
    time += 1;
    view.click(0);
    expect(view.current).toBe('tutorial');
  });

  it('ignores a click on a button the page doesn’t have', () => {
    clickLater(5, -1);
    expect(view.current).toBe('challenge');
    clickLater(0, 1, 3);
    expect(view.current).toBe('duel');
    expect(reports).toEqual([]);
  });

  it('stops the timer, removes the screen and reports nothing after stop() in the middle of the duel', () => {
    clickLater(0, 1);
    controller.stop();
    expect(timer.running).toBe(false);
    expect(view.destroyed).toBe(true);
    timer.finish();
    clickLater(RIGHT, 0, 0);
    expect(view.current).toBe('duel');
    expect(reports).toEqual([]);
  });

  it('reports once even when the report itself stops the screen', () => {
    const lateView = new FakeDuelView();
    const late = new DuelShopController(lateView, QUESTION, new FakeTimer(), () => time);
    let count = 0;
    late.start(() => {
      count++;
      // GameFlow stops a screen as soon as it reports, and another click can land meanwhile.
      late.stop();
      lateView.click(1);
    });
    time += settings.dialogueTransitionMs;
    lateView.click(1);
    expect(count).toBe(1);
  });

  it.each([
    ['has no options', { options: [], correct: 0 }],
    ['marks an option that doesn’t exist as correct', { options: [12, 13, 15], correct: 3 }],
  ])('refuses a question that %s', (_, question) => {
    expect(() => new DuelShopController(new FakeDuelView(), question, new FakeTimer())).toThrow(RangeError);
  });
});

// Optional documentation
// - class FakeDuelView implements DuelView: a stand-in with the same methods as the real view, which records each page shown and lets the test press its buttons with click().
// - get current(): a getter, read like a field (view.current), giving the page shown last.
// - this.pages.at(-1)?.page: the last page shown, or undefined if none has been shown yet.
// - () => time: a fake clock; the test moves `time` forward itself instead of waiting.
// - clickLater(...indexes): the rest parameter `...` collects every argument into one array, so a test can click through several pages in one call.
// - { page: 'challenge', ...duelText.challenge }: the spread copies the challenge's text and choices into the expected object.
// - it.each([...])(name, fn): runs the same test once per row; %s in the name is filled in from the row's first item.
// - expect(fn).toThrow(RangeError): passes only if calling fn throws a RangeError.
