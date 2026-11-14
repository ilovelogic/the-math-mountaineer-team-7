import { dialogueScripts } from '../content/dialogueScripts';
import { shopOffers } from '../content/shopText';
import type { DialogueLine } from '../model/Dialogue';
import { levelDoneLines } from '../model/levelDone';
import type { ProgressView } from '../model/PlayerProgress';
import { solutionSteps } from '../model/problems';
import { ChasmScreen } from '../view/ChasmScreen';
import { ChasmSolutionScreen } from '../view/ChasmSolutionScreen';
import { ShopOfferScreen } from '../view/ShopOfferScreen';
import type { Layers } from '../view/stage';
import { ChasmController } from './ChasmController';
import { DialogueController } from './DialogueController';
import type { ScreenRequest } from './GameFlow';
import { MedalController } from './MedalController';
import type { Screen } from './Screen';
import { ShopOfferController } from './ShopOfferController';


/**
 * Builds the screen for each step GameFlow plays, so GameFlow never needs to know
 * which controller or view a step uses. `main.ts` makes one factory with the stage's
 * layers and the player's progress, and hands it to GameFlow as `makeScreen`. Adding
 * a new kind of screen means adding one case here, and nothing else in GameFlow moves.
 */
export function createScreenFactory(layers: Layers, progress: ProgressView): (request: ScreenRequest) => Screen {
  return (request) => {
    switch (request.kind) {
      case 'dialogue':
        return new DialogueController(layers, sceneNamed(request.script));
      case 'chasm':
        return new ChasmController(
          new ChasmScreen(layers, request.chasm),
          new ChasmSolutionScreen(
            layers,
            request.chasm,
            solutionSteps(request.chasm)
          ), 
          request.chasm
        );
      case 'levelDone':
        return new DialogueController(layers, levelDoneLines(request.level, request.points, request.possiblePoints));
      case 'medal':
        return new MedalController(layers, progress);
      case 'shopOffer':
        return new ShopOfferController(new ShopOfferScreen(layers, request.shop, shopOffers[request.shop]));
      case 'shopGame':
        // The math duel (#55) and the zipline (#61) aren't built yet, so the game's
        // script has no shop steps until one of them fills in this case.
        throw new Error(`The ${request.shop} shop's mini-game isn't built yet.`);
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
