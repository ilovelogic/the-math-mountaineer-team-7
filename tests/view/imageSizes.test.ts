import { Image } from 'canvas';
import Konva from 'konva';
import { describe, expect, it, vi } from 'vitest';
import { duelText, type DuelPage } from '../../src/content/duelText';
import { shopOffers } from '../../src/content/shopText';
import { ziplineText, type ZiplinePage } from '../../src/content/ziplineText';
import { IMAGE_FILES, image } from '../../src/view/assets';
import { DialogueScenery, levelDoneScenery, sceneryForScript } from '../../src/view/DialogueScenery';
import { DuelScreen } from '../../src/view/DuelScreen';
import { ShopOfferScreen } from '../../src/view/ShopOfferScreen';
import { createLayers, STAGE_HEIGHT, STAGE_WIDTH, type Layers } from '../../src/view/stage';
import { TitleScreen } from '../../src/view/TitleScreen';
import { ZiplineScreen } from '../../src/view/ZiplineScreen';

/**
 * Checks issue #202: every image the game draws stays crisp at any window size. Two kinds
 * of image do that in different ways, so each gets its own rule.
 *  - A background fills the stage and is exported at 4x, so its file must be exactly
 *    3840 × 2160, and it must go on the background layer, which smooths it.
 *  - A sprite is pixel art. It must be drawn at a whole or half multiple of its file's
 *    size, the same multiple across and down, so no pixel is squeezed or stretched, and
 *    it must go on the sprites layer, which draws it without smoothing.
 *
 * Instead of the 1 × 1 stand-in other view tests use, `image()` here hands back the real
 * PNG from public/assets, so each drawn image can be compared with its file. The test
 * draws every screen and page that shows an image, then checks every Konva.Image on the
 * three layers. A separate test checks the files themselves, so a stage-sized image no
 * screen draws yet still can't be added at 1x, as the shop scenes once were.
 * Limit: it checks sizes and layers, not how the art looks, which needs a look in the
 * browser at a small and a large window.
 */

vi.mock('../../src/view/assets', async (importOriginal) => {
  const assets = await importOriginal<typeof import('../../src/view/assets')>();
  const loaded = new Map<string, Image>();
  const realImage = (name: string) => {
    if (!loaded.has(name)) {
      const picture = new Image();
      const file = new URL(`../../public/assets/${assets.IMAGE_FILES[name]}`, import.meta.url);
      picture.src = decodeURIComponent(file.pathname);
      loaded.set(name, picture);
    }
    return loaded.get(name);
  };
  return { ...assets, image: realImage };
});

const LAYER_NAMES = ['background', 'sprites', 'ui'] as const;
const isBackground = (node: Konva.Image) => node.width() === STAGE_WIDTH && node.height() === STAGE_HEIGHT;

/** What's wrong with each image drawn on `layers`, as readable lines, or nothing if all is well. */
function problemsWithImages(layers: Layers): string[] {
  const nameOf = new Map(Object.keys(IMAGE_FILES).map((name) => [image(name), name]));
  const problems: string[] = [];
  for (const layerName of LAYER_NAMES) {
    for (const node of layers[layerName].find<Konva.Image>('Image')) {
      const file = node.image() as HTMLImageElement;
      const name = nameOf.get(file);
      const fileSize = `${file.width} × ${file.height}`;
      const drawnSize = `${node.width()} × ${node.height()}`;
      if (isBackground(node)) {
        if (file.width !== STAGE_WIDTH * 4 || file.height !== STAGE_HEIGHT * 4) problems.push(`${name} is ${fileSize}, not a 4x background`);
        if (layerName !== 'background') problems.push(`${name} fills the stage but is on the ${layerName} layer`);
        continue;
      }
      const across = node.width() / file.width;
      const down = node.height() / file.height;
      if (across !== down) problems.push(`${name} (${fileSize}) is drawn at ${drawnSize}, stretched ${across} across but ${down} down`);
      else if (!Number.isInteger(across * 2)) problems.push(`${name} (${fileSize}) is drawn at ${drawnSize}, ${across} times its size`);
      if (layerName !== 'sprites') problems.push(`${name} is a sprite on the ${layerName} layer, which smooths it`);
    }
  }
  return problems;
}

const zipline = { length: 12, width: 3, height: 4, diagonal: 13, options: [11, 13, 15], correct: 1 };
const duel = { a: 5, b: 12, c: 13, options: [12, 13, 15], correct: 1 };

/** Every screen and page that draws an image, each drawn onto fresh layers. */
const SCREENS: Record<string, (layers: Layers) => void> = {
  title: (layers) => new TitleScreen(layers).draw(true),
  'supplies shop offer': (layers) => new ShopOfferScreen(layers, 'supplies', shopOffers.supplies).draw(),
  'clothing shop offer': (layers) => new ShopOfferScreen(layers, 'clothing', shopOffers.clothing).draw(),
  'intro scene': (layers) => new DialogueScenery(layers, sceneryForScript('intro')),
  'how crossing works scene': (layers) => new DialogueScenery(layers, sceneryForScript('howCrossingWorks')),
  'Level done with every point': (layers) => new DialogueScenery(layers, levelDoneScenery(1, 50, 50)),
  'Level done one point short': (layers) => new DialogueScenery(layers, levelDoneScenery(1, 49, 50)),
};
for (const page of Object.keys(ziplineText) as ZiplinePage[]) {
  SCREENS[`zipline ${page} page`] = (layers) => new ZiplineScreen(layers, zipline).show(page, ziplineText[page].text, ziplineText[page].choices);
}
for (const page of Object.keys(duelText) as DuelPage[]) {
  SCREENS[`duel ${page} page`] = (layers) => new DuelScreen(layers, duel).show(page, duelText[page].text, duelText[page].choices);
}

describe('image sizes', () => {
  it.each(Object.keys(SCREENS))('draws every image on the %s crisp', (screen) => {
    const layers = createLayers();
    SCREENS[screen](layers);
    expect(problemsWithImages(layers)).toEqual([]);
  });

  it('finds both backgrounds and sprites to check, so the tests above can’t pass by finding nothing', () => {
    const drawn: Konva.Image[] = [];
    for (const draw of Object.values(SCREENS)) {
      const layers = createLayers();
      draw(layers);
      drawn.push(...LAYER_NAMES.flatMap((layerName) => layers[layerName].find<Konva.Image>('Image')));
    }
    expect(drawn.filter(isBackground).length).toBeGreaterThan(0);
    expect(drawn.filter((node) => !isBackground(node)).length).toBeGreaterThan(0);
  });

  it('exports every image as big as the stage at 4x, even one no screen draws yet', () => {
    const blurry = Object.keys(IMAGE_FILES).filter((name) => {
      const file = image(name);
      const isSmallerThanStage = file.width < STAGE_WIDTH && file.height < STAGE_HEIGHT;
      const isFourTimesStage = file.width === STAGE_WIDTH * 4 && file.height === STAGE_HEIGHT * 4;
      return !isSmallerThanStage && !isFourTimesStage;
    });
    expect(blurry).toEqual([]);
  });
});

// Optional documentation
// - new Image() from 'canvas': node-canvas's version of the browser's Image; setting `src` to a file's path loads it from disk right away, so `width` and `height` are the PNG's real size.
// - vi.mock(path, factory): replaces that module for every file in this test, including the screens, with what `factory` returns. Vitest moves the call above the imports, so it takes effect first.
// - importOriginal<typeof import(...)>(): loads the real module, so the mock can keep everything and swap out only `image`.
// - new URL(path, import.meta.url): a path worked out from this test file's own folder, so it works wherever the tests are run from.
// - decodeURIComponent(file.pathname): the URL's path as a plain file path, turning escapes like %20 back into spaces.
// - { ...assets, image: realImage }: copies every export of the real module, then replaces `image`.
// - ['background', 'sprites', 'ui'] as const: `as const` tells TypeScript these are exactly those three names, so layers[layerName] is known to be a Konva.Layer.
// - new Map(pairs): a lookup table built from [key, value] pairs, here from each loaded picture back to its name.
// - layer.find<Konva.Image>('Image'): every image node anywhere inside the layer, including inside groups.
// - node.image() as HTMLImageElement: the picture the node draws; `as` tells TypeScript its type, since Konva also allows canvases and videos.
// - Number.isInteger(across * 2): true when `across` is a whole or half number, such as 1, 1.5 or 3.
// - Record<string, (layers: Layers) => void>: an object whose keys are names and whose values are functions that draw onto the given layers.
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
// - it.each(list)(name, fn): registers one test per item in the list; %s in the name is replaced by the item.
// - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws.
// - expect(value).toEqual([]): throws, failing the test, unless the list is empty; a failure prints every problem found.
// - drawn.push(...list): adds every item of the list to the end of `drawn`.
// - .flatMap(fn): runs fn on each layer name and joins the lists it returns into one list.
// - .filter(fn): keeps the items for which fn returns true.
// - expect(value).toBeGreaterThan(0): throws unless the value is more than 0.
