// Entry point and the only place that wires the game together: it builds the stage,
// the Hud and the player's progress, and starts GameFlow, which plays every step from
// the title to the medal. Each step's screen comes from the screen factory.
import { steps } from './content/levels';
import { GameFlow, newSeed } from './controller/GameFlow';
import { createScreenFactory } from './controller/screenFactory';
import { PlayerProgress } from './model/PlayerProgress';
import { SaveStore } from './model/SaveStore';
import { loadAssets } from './view/assets';
import { loadFonts } from './view/fonts';
import { Hud } from './view/Hud';
import { createStage } from './view/stage';

import { makeZiplineProblem } from './model/zipline';


// Every image, sound and font is loaded before anything is drawn, so no screen waits
// on a file and Konva never draws text in the fallback font and then has to redraw it.
await Promise.all([loadAssets(), loadFonts()]);

const layers = createStage('game').layers;
const hud = new Hud(layers);

// Every visit starts a new game. A checkpoint is still saved after each step, ready for
// the title screen's Continue (#70) to load.
const progress = new PlayerProgress(newSeed());
const store = new SaveStore(window.localStorage);

// const flow = new GameFlow(steps, progress, createScreenFactory(layers, progress), {
//   hud,
//   // Wrapped in an arrow function so `save` still knows which SaveStore it belongs to.
//   save: (saved) => store.save(saved),
// });

const makeScreen = createScreenFactory(layers, progress);
console.log('Zipline answer:', makeZiplineProblem(progress.seed).diagonal);
const flow = new GameFlow(
  [{ kind: 'shopOffer', shop: 'clothing' }, { kind: 'shopGame', shop: 'clothing' }, ...steps],
  progress,
  (request) => {
    const screen = makeScreen(request);
    return {
      start: (onDone) => screen.start((outcome) => {
        console.log(request.kind, 'reported', outcome);
        onDone(outcome);
      }),
      stop: () => screen.stop(),
    };
  },
  {
    hud,
    save: (saved) => store.save(saved),
  }
);

flow.run();
// Optional documentation
// - await at the top level of a module: the rest of this file waits for the promise; it's allowed in ES modules, which Vite builds.
// - Promise.all([...]): waits for every promise in the array, so the images and the fonts load at the same time instead of one after the other.
// - window.localStorage: the browser's storage for this site, which keeps its contents after the tab closes.
// - { hud, save: ... }: `hud` alone is shorthand for `hud: hud`.
// - (saved) => store.save(saved): passing `store.save` by itself would lose `this`, and SaveStore's try/catch would then hide the error, so nothing would ever be saved.
// - flow.run(): with no argument, starts at the progress's current step, which is 0 (the title) for a new game.
