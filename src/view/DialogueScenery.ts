import Konva from 'konva';
import { earnedAllPoints } from '../model/levelDone';
import { image } from './assets';
import { STAGE_HEIGHT, STAGE_WIDTH, type Layers } from './stage';

/** One character in a scene: its image's name in view/assets, and where it stands. */
export interface SpritePlacement {
  image: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** What a dialogue scene shows above its dialog box: a background from view/assets, and the characters in front of it. */
export interface Scenery {
  background: string;
  sprites: SpritePlacement[];
}

/** Each level's background, Level 1 first, following the note on the Backgrounds section of the mockups' Resources page. */
const LEVEL_BACKGROUNDS = ['mountainsDay', 'level2BareTrees', 'level3Glacier'];

// Positions and sizes from the mockups. Every character stands on the snow, whose top
// edge is at y = 370 in every background, so each one's y is 370 minus its height.
const MOUNTAINEER_IN_INTRO: SpritePlacement = { image: 'player', x: 380, y: 305, width: 40, height: 65 };
const FRIEND_IN_INTRO: SpritePlacement = { image: 'friend', x: 520, y: 305, width: 40, height: 65 };
const MOUNTAINEER_ON_LEFT: SpritePlacement = { image: 'player', x: 240, y: 305, width: 40, height: 65 };
const MOUNTAINEER_CELEBRATING: SpritePlacement = { image: 'playerCelebrating', x: 240, y: 305, width: 50, height: 65 };
const MOUNTAINEER_WALKING: SpritePlacement = { image: 'playerWalking', x: 90, y: 305, width: 40, height: 65 };

/** The scenery for each scene in content/dialogueScripts that has its own mockup. */
const SCRIPT_SCENERY: Record<string, Scenery> = {
  intro: { background: 'mountainsDay', sprites: [MOUNTAINEER_IN_INTRO, FRIEND_IN_INTRO] },
  howCrossingWorks: { background: 'mountainsDay', sprites: [MOUNTAINEER_ON_LEFT] },
};

/**
 * The scenery for a scene from content/dialogueScripts. A scene with no entry above still
 * gets Level 1's mountains, with no one in front of them, so a newly written scene never
 * plays over a blank screen.
 */
export function sceneryForScript(script: string): Scenery {
  if (Object.hasOwn(SCRIPT_SCENERY, script)) return SCRIPT_SCENERY[script];
  return { background: LEVEL_BACKGROUNDS[0], sprites: [] };
}
// Optional documentation
// - Record<string, Scenery>: an object type whose keys are any strings and whose values are all Scenery.
// - Object.hasOwn(SCRIPT_SCENERY, script): true only for the scenes listed above, not for names every object has, like "toString".

/**
 * The scenery for Level done, taking the same numbers as `levelDoneLines` in model/levelDone,
 * like the two Level done mockups. A player with every point is moving on, so they
 * celebrate in front of the next level's background. Anyone else is offered a restart,
 * so they stand in front of the level they just finished.
 */
export function levelDoneScenery(level: number, points: number, possiblePoints: number): Scenery {
  if (earnedAllPoints(points, possiblePoints)) {
    return { background: LEVEL_BACKGROUNDS[level], sprites: [MOUNTAINEER_CELEBRATING] };
  }
  return { background: LEVEL_BACKGROUNDS[level - 1], sprites: [MOUNTAINEER_WALKING] };
}

/**
 * Draws a dialogue scene's background and characters. They go on the background and
 * sprites layers, below the ui layer that holds the dialog box, so the box always stays
 * on top and readable. DialogueController draws it when a scene starts and destroys it
 * when the scene ends.
 */
export class DialogueScenery {
  private readonly drawn: Konva.Image[] = [];

  constructor(layers: Layers, scenery: Scenery) {
    const background = new Konva.Image({ image: image(scenery.background), width: STAGE_WIDTH, height: STAGE_HEIGHT });
    layers.background.add(background);
    this.drawn.push(background);

    for (const sprite of scenery.sprites) {
      const character = new Konva.Image({ ...sprite, image: image(sprite.image) });
      layers.sprites.add(character);
      this.drawn.push(character);
    }
  }
  // Optional documentation
  // - new Konva.Image({ image, width, height }): draws a loaded picture; width and height stretch it, so a 4x background still fills the 960 × 540 stage exactly.
  // - { ...sprite, image: image(sprite.image) }: the spread `...` copies the placement's x, y, width and height, and the `image` after it replaces the name with the loaded picture.

  /** Removes everything it drew. It can't be drawn again afterwards. */
  destroy(): void {
    this.drawn.forEach((node) => node.destroy());
  }
  // Optional documentation
  // - node.destroy(): removes the node from its layer and deletes it for good.
}
