import Konva from 'konva';
import { beforeEach, describe, expect, it } from 'vitest';
import { duelText, type DuelPage } from '../../src/content/duelText';
import type { DuelQuestion } from '../../src/model/problems';
import { DuelScreen } from '../../src/view/DuelScreen';
import type { Layers } from '../../src/view/stage';
import { colors } from '../../src/view/theme';
import { standInLoadedImages } from '../standInImage';

/**
 * Checks issue #158 and what DuelShopController relies on from the duel screen: each page
 * shows its text and buttons, the tutorial explains the theorem with a general example,
 * the solution works through the duel question's own numbers, a click reports the
 * button's position, the drawings stay between the top bar and the dialog box, and
 * destroy() removes everything. It draws real Konva nodes into three bare layers.
 * Limit: whether each page looks like its mockup still needs a look with `npm run dev`.
 */

const question: DuelQuestion = { a: 5, b: 12, c: 13, options: [12, 13, 15], correct: 1 };
const TOP_BAR_HEIGHT = 48;
const allPages = Object.keys(duelText) as DuelPage[];

let layers: Layers;
let screen: DuelScreen;
let picks: number[];

function setUp(q: DuelQuestion): void {
  layers = { background: new Konva.Layer(), sprites: new Konva.Layer(), ui: new Konva.Layer() };
  screen = new DuelScreen(layers, q);
  picks = [];
  screen.onChoice((index) => picks.push(index));
}

beforeEach(() => {
  standInLoadedImages();
  setUp(question);
});

/** Shows `page` with its real text, and the options on the duel page, as the controller does. */
function showPage(page: DuelPage): void {
  const choices = page === 'duel' ? question.options.map(String) : duelText[page].choices;
  screen.show(page, duelText[page].text, choices);
}

const uiTexts = () => layers.ui.find<Konva.Text>('Text').map((node) => node.text());
const button = (label: string) => layers.ui.find<Konva.Text>('Text').find((node) => node.text() === label)!.getParent()!;
const triangle = () => layers.sprites.findOne<Konva.Group>('.duel-triangle');
const tags = () => triangle()!.find<Konva.Text>('Text').map((node) => node.text());
const steps = () => layers.sprites.findOne<Konva.Group>('.duel-steps')!.find<Konva.Text>('Text').map((node) => node.text());
const dialogTop = () => button(uiTexts().at(-1)!).getParent()!.getParent()!.getClientRect({ relativeTo: layers.ui }).y;
const drawnCount = () => Object.values(layers).reduce((sum, layer) => sum + layer.find('Shape').length, 0);

describe('DuelScreen', () => {
  it.each(allPages)('shows the %s page’s text and buttons', (page) => {
    showPage(page);
    expect(uiTexts()).toContain(duelText[page].text);
    expect(uiTexts()).toEqual(expect.arrayContaining(page === 'duel' ? ['12', '13', '15'] : duelText[page].choices));
  });

  it('explains the theorem on the tutorial with a general example', () => {
    showPage('tutorial');
    expect(tags()).toEqual(expect.arrayContaining(['a', 'b', 'c']));
    expect(steps()).toEqual(['1', 'c² = a² + b²', '2', 'c² = 5² + 12² = 25 + 144 = 169', '3', 'c = √169 = 13']);
  });

  it('works through the duel question’s own numbers on the solution', () => {
    showPage('solution');
    expect(tags()).toEqual(expect.arrayContaining(['5', '12', 'x = 13']));
    expect(steps()).toContain('x² = 5² + 12² = 25 + 144 = 169');
    expect(steps()).toContain('x = √169 = 13');
  });

  it('uses whichever question it is given, not fixed numbers', () => {
    setUp({ a: 8, b: 15, c: 17, options: [16, 17, 19], correct: 1 });
    screen.show('solution', duelText.solution.text, duelText.solution.choices);
    expect(tags()).toEqual(expect.arrayContaining(['8', '15', 'x = 17']));
    expect(steps()).toContain('x² = 8² + 15² = 64 + 225 = 289');
    expect(steps()).toContain('x = √289 = 17');
  });

  it.each([
    ['tutorial', 'Let’s battle now!'],
    ['solution', 'Back to the trail'],
  ] as const)('reports position 0 when the %s page’s button is clicked', (page, label) => {
    showPage(page);
    button(label).fire('click');
    expect(picks).toEqual([0]);
  });

  it('draws every answer on the duel page as the same plain button, so none looks like the answer', () => {
    showPage('duel');
    const fills = ['12', '13', '15'].map((label) => button(label).findOne<Konva.Rect>('Rect')!.fill());
    expect(fills).toEqual([colors.white, colors.white, colors.white]);
  });

  it.each(['tutorial', 'solution'] as const)('keeps the %s page’s drawing between the top bar and the dialog box', (page) => {
    showPage(page);
    for (const name of ['.duel-triangle', '.duel-steps']) {
      const drawing = layers.sprites.findOne(name)!.getClientRect({ relativeTo: layers.sprites });
      expect(drawing.y).toBeGreaterThanOrEqual(TOP_BAR_HEIGHT);
      expect(drawing.y + drawing.height).toBeLessThan(dialogTop());
    }
  });

  it.each(['challenge', 'tutorialOffer', 'duel', 'won', 'climb', 'lost'] as const)('draws no triangle on the %s page', (page) => {
    showPage(page);
    expect(triangle()).toBeUndefined();
  });

  it('replaces the last page instead of drawing over it', () => {
    showPage('solution');
    const shapesOnOnePage = drawnCount();
    showPage('challenge');
    expect(triangle()).toBeUndefined();
    expect(uiTexts()).not.toContain(duelText.solution.text);
    showPage('solution');
    expect(drawnCount()).toBe(shapesOnOnePage);
  });

  it('removes everything it drew, then reports nothing', () => {
    showPage('tutorial');
    const battle = button('Let’s battle now!');
    screen.destroy();
    battle.fire('click');
    expect(drawnCount()).toBe(0);
    expect(picks).toEqual([]);
  });
});

// Optional documentation
// - Object.keys(duelText) as DuelPage[]: every page name, so it.each runs a test for each one.
// - layers.sprites.findOne('.duel-triangle'): finds the node named duel-triangle; the dot means "by name".
// - expect.arrayContaining([...]): passes when the array holds every listed item, in any order, among others.
// - getClientRect({ relativeTo }): the node's box measured in the layer's own coordinates, tags included.
// - it.each([...] as const)(name, fn): runs the same test once per row; %s in the name is filled in from the row.
