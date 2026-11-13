import Konva from 'konva';
import { beforeEach, describe, expect, it } from 'vitest';
import { ziplineText, type ZiplinePage } from '../../src/content/ziplineText';
import { fillZiplineText } from '../../src/model/zipline';
import type { Layers } from '../../src/view/stage';
import { colors } from '../../src/view/theme';
import { ZiplineScreen } from '../../src/view/ZiplineScreen';
import { standInLoadedImages } from '../standInImage';

/**
 * Checks what ZiplineShopController relies on from the zipline screen (issue #61): each
 * page shows its text and buttons, a click reports the button's position, the store's
 * drawing has the right tags on each page and stays between the top bar and the dialog
 * box, and destroy() removes everything. It draws real Konva nodes into three bare
 * layers, with already-loaded 1 × 1 pictures standing in for the sprites (see
 * tests/standInImage.ts). Limit: whether each page looks like its mockup still needs a
 * look with `npm run dev`.
 */

const problem = { length: 12, width: 3, height: 4, diagonal: 13, options: [11, 13, 15], correct: 1 };
const TOP_BAR_HEIGHT = 48;

let layers: Layers;
let screen: ZiplineScreen;
let picks: number[];

beforeEach(() => {
  standInLoadedImages();
  layers = { background: new Konva.Layer(), sprites: new Konva.Layer(), ui: new Konva.Layer() };
  screen = new ZiplineScreen(layers, problem);
  picks = [];
  screen.onChoice((index) => picks.push(index));
});

/** Shows `page` with its real text, and the guesses on the answer page, as the controller does. */
function showPage(page: ZiplinePage) {
  const choices = page === 'answer' ? ['11 m', '13 m', '15 m'] : ziplineText[page].choices;
  screen.show(page, fillZiplineText(ziplineText[page].text, problem), choices);
}

const uiTexts = () => layers.ui.find<Konva.Text>('Text').map((node) => node.text());
const button = (label: string) => layers.ui.find<Konva.Text>('Text').find((node) => node.text() === label)!.getParent()!;
const diagram = () => layers.sprites.findOne<Konva.Group>('.zipline-diagram');
const tags = () => diagram()!.find<Konva.Text>('Text').map((node) => node.text());
const dialogTop = () => button(uiTexts().at(-1)!).getParent()!.getParent()!.getClientRect({ relativeTo: layers.ui }).y;
const drawnCount = () => Object.values(layers).reduce((sum, layer) => sum + layer.find('Shape').length, 0);

const allPages = Object.keys(ziplineText) as ZiplinePage[];

describe('ZiplineScreen', () => {
  it.each(allPages)('shows the %s page’s text and buttons', (page) => {
    showPage(page);
    const { text, choices } = ziplineText[page];
    expect(uiTexts()).toContain(fillZiplineText(text, problem));
    expect(uiTexts()).toEqual(expect.arrayContaining(page === 'answer' ? ['11 m', '13 m', '15 m'] : choices));
  });

  it('reports the position of the button that is clicked', () => {
    showPage('answer');
    button('15 m').fire('click');
    button('11 m').fire('click');
    expect(picks).toEqual([2, 0]);
  });

  it('draws every guess as the same plain button, so none looks like the answer', () => {
    showPage('answer');
    const fills = ['11 m', '13 m', '15 m'].map((label) => button(label).findOne<Konva.Rect>('Rect')!.fill());
    expect(fills).toEqual([colors.white, colors.white, colors.white]);
  });

  it.each([
    ['problem', ['width', 'length', 'height']],
    ['tutorial', ['width', 'length', 'height', 'x']],
    ['answer', ['3 m', '12 m', '4 m', 'x']],
    ['solution', ['3 m', '12 m', '4 m', 'x']],
  ] as const)('tags the store on the %s page with %j', (page, expected) => {
    showPage(page);
    expect(tags()).toEqual(expected);
  });

  it.each(['deal', 'wrong', 'right', 'onwardDressed', 'onwardPacked'] as const)('draws no store diagram on the %s page', (page) => {
    showPage(page);
    expect(diagram()).toBeUndefined();
  });

  it.each(['problem', 'tutorial', 'answer', 'solution'] as const)('keeps the %s page’s drawing between the top bar and the dialog box', (page) => {
    showPage(page);
    const drawing = diagram()!.getClientRect({ relativeTo: layers.sprites });
    expect(drawing.y).toBeGreaterThanOrEqual(TOP_BAR_HEIGHT);
    expect(drawing.y + drawing.height).toBeLessThan(dialogTop());
    // The problem and answer pages show the drawing on a white card, which must fit too.
    const card = layers.background.findOne('.zipline-card')?.getClientRect({ relativeTo: layers.background });
    if (card) expect(card.y + card.height).toBeLessThan(dialogTop());
  });

  it('replaces the last page instead of drawing over it', () => {
    showPage('answer');
    const shapesOnOnePage = drawnCount();
    showPage('problem');
    showPage('answer');
    expect(drawnCount()).toBe(shapesOnOnePage);
    expect(uiTexts().filter((text) => text === ziplineText.problem.text)).toEqual([]);
  });

  it('removes everything it drew, then shows nothing and reports nothing', () => {
    showPage('deal');
    const sure = button('Sure!');
    screen.destroy();
    sure.fire('click');
    showPage('problem');
    expect(picks).toEqual([]);
    for (const layer of Object.values(layers)) expect(layer.getChildren()).toHaveLength(0);
  });
});

// Optional documentation
// - Object.keys(ziplineText) as ZiplinePage[]: every page name, so a new page is tested without editing this list.
// - it.each([...])('... %s ... %j', fn): runs the test once per row; %s puts in the first value as text and %j the second as JSON.
// - getParent(): the group a node sits in; a button's label sits in the button, which sits in the dialog box's row of buttons.
// - getClientRect({ relativeTo }): where a node is drawn and how big it is, measured from what's inside it, in that layer's coordinates.
// - layer.find('Shape'): every drawn shape inside the layer, however deep in groups.
