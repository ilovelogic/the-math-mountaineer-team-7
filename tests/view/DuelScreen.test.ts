import Konva from 'konva';
import { beforeEach, describe, expect, it } from 'vitest';
import { duelExplanation, duelText, type DuelPage } from '../../src/content/duelText';
import { triplesByLevel, type DuelQuestion } from '../../src/model/problems';
import { DuelScreen, PROGRESS_CORNER, TUTORIAL_EXAMPLE } from '../../src/view/DuelScreen';
import type { Layers } from '../../src/view/stage';
import { colors } from '../../src/view/theme';
import { standInLoadedImages } from '../standInImage';

/**
 * Checks issues #158 and #55 and what DuelShopController relies on from the duel screen:
 * each page shows its text and buttons, the tutorial explains the theorem with a general
 * example, the solution works through the duel question's own numbers, the duel page
 * puts the question and its answers on a card and leaves the store owner's progress
 * corner (#57) empty, the lost page shows the right answer, each page draws who the
 * mockup shows, a click reports the button's position, the drawings stay between the top
 * bar and the dialog box, and destroy() removes everything. It draws real Konva nodes
 * into three bare layers. Limit: whether each page looks like its mockup still needs a
 * look with `npm run dev`.
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
/** The duel page's answer buttons, in order. */
const answers = () => layers.ui.findOne<Konva.Group>('.duel-answers')!.getChildren() as Konva.Group[];
const answerLabels = () => answers().map((answer) => answer.findOne<Konva.Text>('Text')!.text());
const card = () => layers.ui.findOne<Konva.Group>('.duel-card');
const cardTexts = () => card()!.find<Konva.Text>('Text').map((node) => node.text());
const dialogBox = () => layers.ui.findOne('.dialog-buttons')!.getParent()!;
const drawn = (name: string) => layers.sprites.find(`.${name}`).length;
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
    expect(steps()).toEqual(['1', 'c² = a² + b²', '2', 'c² = 12² + 16² = 144 + 256 = 400', '3', 'c = √400 = 20']);
  });

  it('uses a tutorial example the game never asks about, so it can’t give away an answer', () => {
    const { a, b, c } = TUTORIAL_EXAMPLE;
    expect(a ** 2 + b ** 2).toBe(c ** 2);
    const asked = triplesByLevel.flat().map((triple) => [...triple].sort((x, y) => x - y).join(','));
    expect(asked).not.toContain([a, b, c].join(','));
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
    const fills = answers().map((answer) => answer.findOne<Konva.Rect>('Rect')!.fill());
    expect(fills).toEqual([colors.white, colors.white, colors.white]);
  });

  it('puts the duel’s question and answers on a card, with the triangle’s legs and x, and hides the dialog box', () => {
    showPage('duel');
    expect(cardTexts()).toEqual(expect.arrayContaining(['Solve for x.', '5', '12', 'x']));
    expect(answerLabels()).toEqual(['12', '13', '15']);
    expect(dialogBox().visible()).toBe(false);
  });

  it('reports each answer’s position when it is clicked on the card', () => {
    showPage('duel');
    answers().forEach((answer) => answer.fire('click'));
    expect(picks).toEqual([0, 1, 2]);
  });

  it('leaves the duel page’s top-left corner empty for the store owner’s progress (#57)', () => {
    showPage('duel');
    const corner = PROGRESS_CORNER;
    const overlapping = [layers.sprites, layers.ui].flatMap((layer) =>
      layer.getChildren().flatMap((group) => (group as Konva.Group).getChildren()).filter((node) => {
        const box = node.getClientRect({ relativeTo: layer });
        return box.x < corner.x + corner.width && box.y < corner.y + corner.height && box.x + box.width > corner.x && box.y + box.height > corner.y;
      }),
    );
    expect(overlapping).toEqual([]);
  });

  it('keeps the duel page’s card and characters below the top bar and above the bottom of the stage', () => {
    showPage('duel');
    for (const node of [card()!, ...layers.sprites.find('Image')]) {
      const box = node.getClientRect({ relativeTo: node.getLayer()! });
      expect(box.y).toBeGreaterThanOrEqual(TOP_BAR_HEIGHT);
      expect(box.y + box.height).toBeLessThanOrEqual(540);
    }
  });

  it('brings the dialog box back on the page after the duel', () => {
    showPage('duel');
    showPage('won');
    expect(dialogBox().visible()).toBe(true);
    expect(card()).toBeUndefined();
    expect(uiTexts()).toContain(duelText.won.text);
  });

  it('shows the right answer on the lost page’s Explanation card', () => {
    showPage('lost');
    const explanation = layers.sprites.findOne<Konva.Group>('.duel-explanation')!;
    expect(explanation.find<Konva.Text>('Text').map((node) => node.text())).toEqual(['Correct answer: 13', duelExplanation.line]);
  });

  it('shows whichever question’s answer it is given on the Explanation card', () => {
    setUp({ a: 8, b: 15, c: 17, options: [16, 17, 19], correct: 1 });
    screen.show('lost', duelText.lost.text, duelText.lost.choices);
    expect(layers.sprites.findOne<Konva.Group>('.duel-explanation')!.findOne<Konva.Text>('Text')!.text()).toBe('Correct answer: 17');
  });

  it.each([
    ['challenge', ['player', 'shopOwnerSupplies']],
    ['tutorialOffer', ['shopOwnerSupplies']],
    ['duel', ['player', 'shopOwnerSupplies']],
    ['lost', ['player', 'shopOwnerCelebrating']],
    ['climb', ['playerClimbing']],
  ] as const)('draws who the %s mockup shows', (page, who) => {
    showPage(page);
    const names = layers.sprites.find('Image').map((node) => node.name());
    expect(names.sort()).toEqual([...who].sort());
  });

  it('shows the bag of climbing gear when the player wins', () => {
    showPage('won');
    expect(drawn('duel-prize')).toBe(1);
  });

  it.each(['challenge', 'tutorialOffer', 'won', 'climb', 'lost'] as const)('keeps the %s page’s drawing between the top bar and the dialog box', (page) => {
    showPage(page);
    for (const node of layers.sprites.getChildren().flatMap((group) => (group as Konva.Group).getChildren())) {
      const box = node.getClientRect({ relativeTo: layers.sprites });
      expect(box.y).toBeGreaterThanOrEqual(TOP_BAR_HEIGHT);
      // Characters stand on the dialog box, whose 2 px border reaches 1 px above its top.
      expect(box.y + box.height).toBeLessThanOrEqual(dialogTop() + 1);
    }
  });

  it.each(['tutorial', 'solution'] as const)('keeps the %s page’s drawing between the top bar and the dialog box', (page) => {
    showPage(page);
    for (const name of ['.duel-triangle', '.duel-steps']) {
      const drawing = layers.sprites.findOne(name)!.getClientRect({ relativeTo: layers.sprites });
      expect(drawing.y).toBeGreaterThanOrEqual(TOP_BAR_HEIGHT);
      expect(drawing.y + drawing.height).toBeLessThan(dialogTop());
    }
  });

  it.each(['challenge', 'tutorialOffer', 'duel', 'won', 'climb', 'lost'] as const)('draws no worked example on the %s page', (page) => {
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
    expect(layers.ui.getChildren()).toEqual([]);
    expect(picks).toEqual([]);
  });
});

// Optional documentation
// - Object.keys(duelText) as DuelPage[]: every page name, so it.each runs a test for each one.
// - layers.sprites.findOne('.duel-triangle'): finds the node named duel-triangle; the dot means "by name".
// - expect.arrayContaining([...]): passes when the array holds every listed item, in any order, among others.
// - getClientRect({ relativeTo }): the node's box measured in the layer's own coordinates, tags included.
// - it.each([...] as const)(name, fn): runs the same test once per row; %s in the name is filled in from the row.
// - box.x < corner.x + corner.width && ...: two boxes overlap only when each starts before the other ends, across and down.
