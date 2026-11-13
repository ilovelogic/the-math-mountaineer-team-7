import { describe, expect, it } from 'vitest';
import { settings } from '../../src/content/settings';
import { ziplineText, type ZiplinePage } from '../../src/content/ziplineText';
import type { Outcome } from '../../src/controller/Screen';
import { ZiplineShopController, type ZiplineView } from '../../src/controller/ZiplineShopController';

/**
 * Checks issue #61's flow: the zipline shop moves through the Clothing shop mockups'
 * pages, takes one guess, and reports that guess (or that the player left) exactly
 * once, never after stop(). A stand-in view records what each page shows and clicks
 * its buttons, and a fake clock moves past the double-click guard before each click,
 * so no Konva or browser is needed. Limit: how the pages look is checked in
 * tests/view/ZiplineScreen.test.ts and with `npm run dev`.
 */

// The 3-4-12 store, with the right guess, 13, second.
const problem = { length: 12, width: 3, height: 4, diagonal: 13, options: [11, 13, 15], correct: 1 };

class StandInView implements ZiplineView {
  shown: { page: ZiplinePage; text: string; choices: string[] }[] = [];
  destroyed = false;
  private cb: ((index: number) => void) | null = null;

  show(page: ZiplinePage, text: string, choices: string[]) {
    this.shown.push({ page, text, choices });
  }
  onChoice(cb: (index: number) => void) {
    this.cb = cb;
  }
  destroy() {
    this.destroyed = true;
  }
  press(index: number) {
    this.cb?.(index);
  }
  get page() {
    return this.shown.at(-1)?.page;
  }
}

function startShop() {
  const view = new StandInView();
  let time = 0;
  const controller = new ZiplineShopController(view, problem, () => time);
  const outcomes: Outcome[] = [];
  controller.start((outcome) => outcomes.push(outcome));
  /** Presses each button in turn, each one long enough after the page appeared to count. */
  const press = (...indexes: number[]) => {
    for (const index of indexes) {
      time += settings.dialogueTransitionMs;
      view.press(index);
    }
  };
  return { view, controller, outcomes, press, tick: (ms: number) => (time += ms) };
}

describe('ZiplineShopController', () => {
  it('opens on the store owner’s deal, with its text and buttons from content', () => {
    const { view } = startShop();
    expect(view.shown).toEqual([{ page: 'deal', ...ziplineText.deal }]);
  });

  it('goes from the deal to the problem, the tutorial and back, then the guesses in metres', () => {
    const { view, press } = startShop();
    press(0, 0, 0, 1);
    expect(view.shown.map((shown) => shown.page)).toEqual(['deal', 'problem', 'tutorial', 'problem', 'answer']);
    expect(view.shown.at(-1)!.choices).toEqual(['11 m', '13 m', '15 m']);
  });

  it.each([
    [0, 'onwardDressed'],
    [1, 'onwardPacked'],
  ] as const)('reports the right guess after the clothes are put on or packed (button %i)', (button, page) => {
    const { view, outcomes, press } = startShop();
    press(0, 1, 1);
    expect(view.page).toBe('right');
    press(button);
    expect(view.page).toBe(page);
    expect(outcomes).toEqual([]);
    press(0);
    expect(outcomes).toEqual([{ kind: 'choice', index: 1 }]);
  });

  it('reports a wrong guess after the solution, which uses the store’s numbers', () => {
    const { view, outcomes, press } = startShop();
    press(0, 1, 2, 0);
    expect(view.shown.map((shown) => shown.page).slice(-2)).toEqual(['wrong', 'solution']);
    expect(view.shown.at(-1)!.text).toContain('floor² = 12² + 3² = 153');
    expect(view.shown.at(-1)!.text).toContain('x = √169 = 13');
    press(0);
    expect(outcomes).toEqual([{ kind: 'choice', index: 2 }]);
  });

  it('reports a wrong guess right away when the player skips the solution', () => {
    const { outcomes, press } = startShop();
    press(0, 1, 0, 1);
    expect(outcomes).toEqual([{ kind: 'choice', index: 0 }]);
  });

  it('reports done, with no guess, when the player turns down the deal', () => {
    const { outcomes, press } = startShop();
    press(1);
    expect(outcomes).toEqual([{ kind: 'done' }]);
  });

  it('reports only once, and ignores buttons a page doesn’t have', () => {
    const { view, outcomes, press } = startShop();
    press(5, 0, 1, 3, -1);
    expect(view.page).toBe('answer');
    press(1, 2, 0, 0, 0);
    expect(outcomes).toEqual([{ kind: 'choice', index: 1 }]);
  });

  it('ignores clicks just after a page appears, so a double click can’t skip one', () => {
    const { view, press, tick } = startShop();
    view.press(0);
    expect(view.page).toBe('deal');
    press(0);
    tick(settings.dialogueTransitionMs - 1);
    view.press(0);
    expect(view.page).toBe('problem');
  });

  it('removes the screen when stopped, and never reports afterwards', () => {
    const { view, controller, outcomes, press } = startShop();
    controller.stop();
    press(1);
    expect(view.destroyed).toBe(true);
    expect(outcomes).toEqual([]);
  });
});

// Optional documentation
// - class StandInView implements ZiplineView: TypeScript checks the stand-in has every method the controller calls.
// - (...indexes: number[]): a rest parameter, so press(0, 1, 1) receives [0, 1, 1].
// - .at(-1): the last item of an array.
// - it.each([...] as const)('... %i ...', fn): runs the test once per row, putting the row's first value into the name.
// - { page: 'deal', ...ziplineText.deal }: the page name plus the content's text and choices, to compare with what the view was shown.
