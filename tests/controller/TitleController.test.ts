import { describe, expect, it } from 'vitest';
import type { Outcome } from '../../src/controller/Screen';
import { CONTINUE, NEW_GAME, TitleController, type TitleView } from '../../src/controller/TitleController';

/**
 * Checks what startGame relies on from the title screen (#70): it draws Continue only when
 * told there's a game to continue, reports New game and Continue as their choices, reports
 * only the first click, and reports nothing after stop(), which removes the screen. A
 * stand-in view records what the controller asks of it and lets the test click its
 * buttons, so no Konva is needed. Which game each choice starts is startGame's job, so
 * tests/controller/startGame.test.ts covers that.
 */

class FakeTitleScreen implements TitleView {
  drawnWithContinue: boolean | null = null;
  destroyed = false;
  private onPick: ((index: number) => void) | null = null;

  draw(canContinue: boolean): void {
    this.drawnWithContinue = canContinue;
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
}

/** Starts a controller on a fresh stand-in, and collects everything it reports. */
function startTitle(canContinue = true) {
  const view = new FakeTitleScreen();
  const controller = new TitleController(view, canContinue);
  const reports: Outcome[] = [];
  controller.start((outcome) => reports.push(outcome));
  return { view, controller, reports };
}

describe('TitleController', () => {
  it('draws Continue only when there is a game to continue', () => {
    expect(startTitle(true).view.drawnWithContinue).toBe(true);
    expect(startTitle(false).view.drawnWithContinue).toBe(false);
  });

  it('reports New game as the NEW_GAME choice', () => {
    const { view, reports } = startTitle();
    view.click(NEW_GAME);
    expect(reports).toEqual([{ kind: 'choice', index: NEW_GAME }]);
  });

  it('reports Continue as the CONTINUE choice', () => {
    const { view, reports } = startTitle();
    view.click(CONTINUE);
    expect(reports).toEqual([{ kind: 'choice', index: CONTINUE }]);
  });

  it('reports only the first click, even if the other button is clicked next', () => {
    const { view, reports } = startTitle();
    view.click(CONTINUE);
    view.click(NEW_GAME);
    expect(reports).toEqual([{ kind: 'choice', index: CONTINUE }]);
  });

  it('reports nothing after it is stopped, and removes the screen', () => {
    const { view, controller, reports } = startTitle();
    controller.stop();
    view.click(NEW_GAME);
    expect(reports).toEqual([]);
    expect(view.destroyed).toBe(true);
  });
});

// Optional documentation
// - class FakeTitleScreen implements TitleView: a stand-in with the same methods as the real screen, which records what was called and lets the test press its buttons with click().
// - import { ..., type TitleView }: `type` marks an import used only for type checking, so it adds nothing to the test's code.
// - function startTitle(canContinue = true): a default value, so tests that don't care get a title with Continue.
// - this.onPick?.(index): calls the controller's handler only if it has registered one.
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
// - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws.
// - expect(value).toBe(expected): throws, failing the test, unless the two values are exactly equal.
// - expect(value).toEqual(expected): passes when the two values have the same contents, even if they're different arrays or objects.
