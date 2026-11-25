import Konva from 'konva';
import { earnedAllPoints } from '../model/levelDone';
import { image } from './assets';
import { CLOSE_UP_GROUND, ReunionCelebration } from './ReunionCelebration';
import { STAGE_HEIGHT, STAGE_WIDTH, type Layers } from './stage';

/** One character in a scene: its image's name in view/assets, and where it stands. */
export interface SpritePlacement {
  image: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A part of the stage, in the stage's own 960 × 540 units. */
export interface StageArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** What a dialogue scene shows above its dialog box: a background from view/assets, and the characters in front of it. */
export interface Scenery {
  background: string;
  /** The part of the background to stretch over the whole stage, for a close-up. Without it, the whole background shows. */
  closeUp?: StageArea;
  sprites: SpritePlacement[];
  /** Plays the reunion's celebration (#204) in front of the background: the friend hopping, hearts and confetti. */
  celebrate?: boolean;
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

// The reunion's close-up shows the middle of Level 3's glacier at twice its size, as in the
// "Reunion option 4" mockup, with the mountaineer at 2x on the close-up's snow line. The
// friend isn't listed here, since ReunionCelebration draws them hopping.
const REUNION_CLOSE_UP: StageArea = { x: 240, y: 175, width: 480, height: 270 };
const MOUNTAINEER_CLOSE_UP: SpritePlacement = { image: 'playerCelebrating4x', x: 360, y: CLOSE_UP_GROUND - 130, width: 100, height: 130 };

/** The scenery for each scene in content/dialogueScripts that has its own mockup. */
const SCRIPT_SCENERY: Record<string, Scenery> = {
  intro: { background: 'mountainsDay', sprites: [MOUNTAINEER_IN_INTRO, FRIEND_IN_INTRO] },
  howCrossingWorks: { background: 'mountainsDay', sprites: [MOUNTAINEER_ON_LEFT] },
  reunion: { background: 'level3Glacier', closeUp: REUNION_CLOSE_UP, sprites: [MOUNTAINEER_CLOSE_UP], celebrate: true },
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
 * on top and readable. A scene that celebrates, like the reunion, also gets a
 * ReunionCelebration in front of the background. DialogueController draws it when a scene
 * starts and destroys it when the scene ends, which stops the celebration too.
 */
export class DialogueScenery {
  private readonly drawn: Konva.Image[] = [];
  private readonly celebration: ReunionCelebration | null = null;

  constructor(layers: Layers, scenery: Scenery) {
    const picture = image(scenery.background);
    const background = new Konva.Image({ image: picture, width: STAGE_WIDTH, height: STAGE_HEIGHT });
    if (scenery.closeUp) background.crop(inPicturePixels(scenery.closeUp, picture));
    layers.background.add(background);
    this.drawn.push(background);

    for (const sprite of scenery.sprites) {
      const character = new Konva.Image({ ...sprite, image: image(sprite.image) });
      layers.sprites.add(character);
      this.drawn.push(character);
    }

    if (scenery.celebrate) this.celebration = new ReunionCelebration(layers.sprites);
  }
  // Optional documentation
  // - new Konva.Image({ image, width, height }): draws a loaded picture; width and height stretch it, so a 4x background still fills the 960 × 540 stage exactly.
  // - { ...sprite, image: image(sprite.image) }: the spread `...` copies the placement's x, y, width and height, and the `image` after it replaces the name with the loaded picture.
  // - background.crop({ x, y, width, height }): draws only that part of the picture, in the picture's own pixels, stretched to the image's width and height.

  /** Removes everything it drew. It can't be drawn again afterwards. */
  destroy(): void {
    this.drawn.forEach((node) => node.destroy());
    this.celebration?.destroy();
  }
  // Optional documentation
  // - node.destroy(): removes the node from its layer and deletes it for good.
  // - this.celebration?.destroy(): `?.` only calls destroy when the scene has a celebration, and does nothing otherwise.
}

// The close-up is set in stage units, but crop() counts the picture's own pixels, which for a
// 4x background are four times as many, so this scales the area by the picture's real width.
function inPicturePixels(area: StageArea, picture: HTMLImageElement): StageArea {
  const scale = picture.width / STAGE_WIDTH;
  return { x: area.x * scale, y: area.y * scale, width: area.width * scale, height: area.height * scale };
}
