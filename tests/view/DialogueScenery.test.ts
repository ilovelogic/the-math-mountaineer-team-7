import Konva from 'konva';
import { beforeEach, describe, expect, it } from 'vitest';
import { dialogueScripts } from '../../src/content/dialogueScripts';
import { IMAGE_FILES } from '../../src/view/assets';
import { DialogueScenery, levelDoneScenery, sceneryForScript, type Scenery } from '../../src/view/DialogueScenery';
import { STAGE_HEIGHT, STAGE_WIDTH, type Layers } from '../../src/view/stage';
import { standInLoadedImages } from '../standInImage';

/**
 * Checks issue #201: every dialogue scene shows a background, and the characters from its
 * mockup, behind the dialog box. The scene-to-art choices are plain data, so most tests
 * read them straight from `sceneryForScript` and `levelDoneScenery` and compare image
 * names, including the edge between every point and one short. Every name must also be
 * in view/assets, so a typo fails here instead of showing the purple placeholder. The rest
 * draw into three bare layers with a 1 × 1 stand-in picture (see tests/standInImage.ts) and
 * count what lands on each layer.
 * Limit: the stand-in can't show whether the art looks like the mockups, which needs a
 * look with `npm run dev`.
 */

let layers: Layers;

beforeEach(() => {
  standInLoadedImages();
  layers = { background: new Konva.Layer(), sprites: new Konva.Layer(), ui: new Konva.Layer() };
});

const imageNames = (scenery: Scenery) => [scenery.background, ...scenery.sprites.map((sprite) => sprite.image)];

describe('sceneryForScript', () => {
  it('shows the intro on Level 1’s mountains, with the mountaineer and the friend', () => {
    expect(imageNames(sceneryForScript('intro'))).toEqual(['mountainsDay', 'player', 'friend']);
  });

  it('shows how crossing works on Level 1’s mountains, with the mountaineer', () => {
    expect(imageNames(sceneryForScript('howCrossingWorks'))).toEqual(['mountainsDay', 'player']);
  });

  it('gives a scene with no scenery of its own the mountains, so it never plays over a blank screen', () => {
    expect(sceneryForScript('aSceneWrittenLater')).toEqual({ background: 'mountainsDay', sprites: [] });
    expect(sceneryForScript('toString')).toEqual({ background: 'mountainsDay', sprites: [] });
  });
});

describe('levelDoneScenery', () => {
  it('celebrates every point in front of the next level’s background', () => {
    expect(imageNames(levelDoneScenery(1, 50, 50))).toEqual(['level2BareTrees', 'playerCelebrating']);
    expect(imageNames(levelDoneScenery(2, 50, 50))).toEqual(['level3Glacier', 'playerCelebrating']);
  });

  it('keeps a player one point short in front of the level they may restart', () => {
    expect(imageNames(levelDoneScenery(1, 49, 50))).toEqual(['mountainsDay', 'playerWalking']);
    expect(imageNames(levelDoneScenery(2, 49, 50))).toEqual(['level2BareTrees', 'playerWalking']);
  });
});

describe('every scene’s images', () => {
  it('are all listed in view/assets', () => {
    const everyScenery = [
      ...Object.keys(dialogueScripts).map(sceneryForScript),
      ...[1, 2].flatMap((level) => [levelDoneScenery(level, 50, 50), levelDoneScenery(level, 0, 50)]),
    ];
    for (const name of everyScenery.flatMap(imageNames)) {
      expect(Object.keys(IMAGE_FILES), `image "${name}"`).toContain(name);
    }
  });
});

describe('DialogueScenery', () => {
  it('fills the stage with the background and stands each character where the scenery says', () => {
    const scenery = sceneryForScript('intro');
    new DialogueScenery(layers, scenery);

    const background = layers.background.findOne<Konva.Image>('Image')!;
    expect([background.width(), background.height()]).toEqual([STAGE_WIDTH, STAGE_HEIGHT]);
    const characters = layers.sprites.find<Konva.Image>('Image');
    expect(characters.map((node) => [node.x(), node.y(), node.width(), node.height()])).toEqual(
      scenery.sprites.map((sprite) => [sprite.x, sprite.y, sprite.width, sprite.height]),
    );
    expect(layers.ui.getChildren(), 'the ui layer is left for the dialog box').toHaveLength(0);
  });

  it('draws just the background when a scene has no characters', () => {
    new DialogueScenery(layers, { background: 'mountainsDay', sprites: [] });
    expect(layers.background.getChildren()).toHaveLength(1);
    expect(layers.sprites.getChildren()).toHaveLength(0);
  });

  it('removes everything it drew', () => {
    new DialogueScenery(layers, sceneryForScript('intro')).destroy();
    for (const layer of Object.values(layers)) expect(layer.getChildren()).toHaveLength(0);
  });
});

// Optional documentation
// - describe(name, fn): groups related tests under a heading in the test output.
// - it(name, fn): registers one test, which fails if anything inside fn throws.
// - expect(value).toEqual(expected): passes if the two have the same contents, even when they are different arrays or objects.
// - beforeEach(fn): runs fn before every test, so each one draws into fresh layers.
// - standInLoadedImages(): Node has no browser Image, so this gives the scenery an already-loaded 1 × 1 picture to draw (see tests/standInImage.ts).
// - [scenery.background, ...list]: the spread `...` puts the sprites' names after the background's in one array.
// - Object.keys(dialogueScripts).map(sceneryForScript): the scenery for every scene in content, passing each scene's name to sceneryForScript.
// - [1, 2].flatMap(...): runs the function for Levels 1 and 2 and joins the pairs it returns into one list.
// - expect(list, message).toContain(item): passes if the list includes the item; the message names the missing image if it fails.
// - layer.findOne<Konva.Image>('Image')!: the first image on the layer; `!` tells TypeScript one is there.
// - layer.find<Konva.Image>('Image'): every image on the layer, in the order they were added.
// - layer.getChildren(): the nodes added straight to the layer; toHaveLength(n) passes if there are exactly n.
// - Object.values(layers): the three layers as an array, so one loop checks them all.
