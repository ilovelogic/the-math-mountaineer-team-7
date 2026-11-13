import { dialogueScripts } from '../content/dialogueScripts';
import { shopOffers } from '../content/shopText';
import type { DialogueLine } from '../model/Dialogue';
import { levelDoneLines } from '../model/levelDone';
import { makeZiplineProblem } from '../model/zipline';
import type { ProgressView } from '../model/PlayerProgress';
import { ChasmScreen } from '../view/ChasmScreen';
import { ShopOfferScreen } from '../view/ShopOfferScreen';
import { ZiplineScreen } from '../view/ZiplineScreen';
import type { Layers } from '../view/stage';
import { ChasmController } from './ChasmController';
import { DialogueController } from './DialogueController';
import type { ScreenRequest } from './GameFlow';
import { MedalController } from './MedalController';
import type { Screen } from './Screen';
import { ShopOfferController } from './ShopOfferController';
import { ZiplineShopController } from './ZiplineShopController';

/**
 * Builds the screen for each step GameFlow plays, so GameFlow never needs to know
 * which controller or view a step uses. `main.ts` makes one factory with the stage's
 * layers and the player's progress, and hands it to GameFlow as `makeScreen`. Adding
 * a new kind of screen means adding one case here, and nothing else in GameFlow moves.
 */
export function createScreenFactory(layers: Layers, progress: ProgressView): (request: ScreenRequest) => Screen {
  return (request) => {
    switch (request.kind) {
      case 'title':
        // Until the title screen (#70) exists, a one-box scene with a Start button stands in for it.
        return new DialogueController(layers, dialogueScripts.titlePlaceholder);
      case 'dialogue':
        return new DialogueController(layers, sceneNamed(request.script));
      case 'chasm':
        return new ChasmController(new ChasmScreen(layers, request.chasm), request.chasm);
      case 'levelDone':
        return new DialogueController(layers, levelDoneLines(request.level, request.points, request.possiblePoints));
      case 'medal':
        return new MedalController(layers, progress);
      case 'shopOffer':
        return new ShopOfferController(new ShopOfferScreen(layers, request.shop, shopOffers[request.shop]));
      case 'shopGame': {
        if (request.shop === 'clothing') {
          const problem = makeZiplineProblem(progress.seed);
          return new ZiplineShopController(new ZiplineScreen(layers, problem), problem);
        }
        // The math duel's screen (#55) isn't built yet.
        throw new Error(`The ${request.shop} shop's mini-game isn't built yet.`);
      }
      default: {
        const unhandled: never = request;
        throw new Error(`There is no screen for ${JSON.stringify(unhandled)}.`);
      }
    }
  };
}
// Optional documentation
// - (layers, progress): (request: ScreenRequest) => Screen: the return type is itself a function type, so createScreenFactory returns a function that GameFlow calls once per step.
// - return (request) => { ... }: the function it returns still has access to `layers` and `progress` after createScreenFactory has finished, so each screen it builds draws into the same layers.
// - const unhandled: never = request: `never` is the type with no possible values. If every kind has a case above, `request` can't reach here, so this compiles; add a kind without a case and the build fails on this line.
// - JSON.stringify(unhandled): turns the request into text, so the error shows exactly what was asked for.

// Scene names arrive from content/levels as plain strings, so a typo there would otherwise
// reach DialogueController as `undefined` instead of failing where the mistake is.
function sceneNamed(name: string): readonly DialogueLine[] {
  if (!Object.hasOwn(dialogueScripts, name)) {
    throw new Error(`There is no dialogue scene called "${name}".`);
  }
  return dialogueScripts[name as keyof typeof dialogueScripts];
}
// Optional documentation
// - Object.hasOwn(dialogueScripts, name): true only if `name` is one of dialogueScripts' own scenes. It's used instead of `name in dialogueScripts`, which is also true for names every object has, like "toString".
// - name as keyof typeof dialogueScripts: tells TypeScript the name is one of the scene keys, which the check above has just made sure of.
