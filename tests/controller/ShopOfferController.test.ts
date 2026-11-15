import { describe, expect, it } from 'vitest';
import { ACCEPT, DECLINE } from '../../src/content/shopText';
import type { Outcome } from '../../src/controller/Screen';
import { ShopOfferController, type ShopOfferView } from '../../src/controller/ShopOfferController';

/**
 * Checks what GameFlow relies on from the shop offer (#52 and #53): the screen is drawn on
 * start, accept and decline are each reported as a choice, only the first click is
 * reported however fast or many the clicks are, nothing is reported after stop(), and
 * stop() removes the screen. A stand-in view records what the controller asks of it and
 * lets the test click its buttons, so no Konva is needed. What each choice leads to is
 * GameFlow's job, so tests/controller/GameFlow.test.ts covers that.
 */

class FakeShopOfferScreen implements ShopOfferView {
  drawn = false;
  destroyed = false;
  private onPick: ((index: number) => void) | null = null;

  draw(): void {
    this.drawn = true;
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
function startOffer() {
  const view = new FakeShopOfferScreen();
  const controller = new ShopOfferController(view);
  const reports: Outcome[] = [];
  controller.start((outcome) => reports.push(outcome));
  return { view, controller, reports };
}

describe('ShopOfferController', () => {
  it('draws the offer when started', () => {
    expect(startOffer().view.drawn).toBe(true);
  });

  it('reports accept as the ACCEPT choice', () => {
    const { view, reports } = startOffer();
    view.click(ACCEPT);
    expect(reports).toEqual([{ kind: 'choice', index: ACCEPT }]);
  });

  it('reports decline as the DECLINE choice', () => {
    const { view, reports } = startOffer();
    view.click(DECLINE);
    expect(reports).toEqual([{ kind: 'choice', index: DECLINE }]);
  });

  it('reports only the first click of a fast double click', () => {
    const { view, reports } = startOffer();
    view.click(ACCEPT);
    view.click(ACCEPT);
    expect(reports).toHaveLength(1);
  });

  it('keeps the first choice when the other button is clicked next', () => {
    const { view, reports } = startOffer();
    view.click(DECLINE);
    view.click(ACCEPT);
    expect(reports).toEqual([{ kind: 'choice', index: DECLINE }]);
  });

  it('reports nothing after it is stopped, and removes the screen', () => {
    const { view, controller, reports } = startOffer();
    controller.stop();
    view.click(ACCEPT);
    expect(reports).toEqual([]);
    expect(view.destroyed).toBe(true);
  });

  it('reports once even when the report itself stops the screen', () => {
    const view = new FakeShopOfferScreen();
    const controller = new ShopOfferController(view);
    let reports = 0;
    controller.start(() => {
      reports++;
      // GameFlow stops a screen as soon as it reports, and a second click can land meanwhile.
      controller.stop();
      view.click(DECLINE);
    });
    view.click(ACCEPT);
    expect(reports).toBe(1);
  });
});

// Optional documentation
// - class FakeShopOfferScreen implements ShopOfferView: a stand-in with the same methods as the real screen, which records what was called and lets the test press its buttons with click().
// - import { ..., type ShopOfferView }: `type` marks an import used only for type checking, so it adds nothing to the test's code.
// - this.onPick?.(index): calls the controller's handler only if it has registered one.
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
// - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws.
// - expect(value).toBe(expected): throws, failing the test, unless the two values are exactly equal.
// - expect(value).toEqual(expected): passes when the two values have the same contents, even if they're different arrays or objects.
// - expect(list).toHaveLength(n): passes when the array has exactly n items.
