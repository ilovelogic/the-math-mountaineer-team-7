// Entry point and the only place that wires the game together: it builds the stage,
// shows the title screen, and then starts GameFlow with the game the player picked,
// which plays every step from the intro to the medal. Each step's screen comes from
// the screen factory.
import { steps } from './content/levels';
import { GameFlow } from './controller/GameFlow';
import { createScreenFactory } from './controller/screenFactory';
import { startGame } from './controller/startGame';
import { TitleController } from './controller/TitleController';
import type { PlayerProgress } from './model/PlayerProgress';
import { SaveStore } from './model/SaveStore';
import { loadAssets } from './view/assets';
import { loadFonts } from './view/fonts';
import { Hud } from './view/Hud';
import { createStage } from './view/stage';
import { TitleScreen } from './view/TitleScreen';

// Every image, sound and font is loaded before anything is drawn, so no screen waits
// on a file and Konva never draws text in the fallback font and then has to redraw it.
await Promise.all([loadAssets(), loadFonts()]);

const layers = createStage('game').layers;
const store = new SaveStore(window.localStorage);

/** Plays the game the player picked on the title screen, from the step its progress is on. */
function play(progress: PlayerProgress): void {
  // The Hud is made only now, so the title screen has no top bar, like its mockup.
  const hud = new Hud(layers);
  const flow = new GameFlow(steps, progress, createScreenFactory(layers, progress), {
    hud,
    // Wrapped in an arrow function so `save` still knows which SaveStore it belongs to.
    save: (saved) => store.save(saved),
  });
  flow.run();
}

startGame(store.load(), steps.length - 1, (canContinue) => new TitleController(new TitleScreen(layers), canContinue), play);
// Optional documentation
// - await at the top level of a module: the rest of this file waits for the promise; it's allowed in ES modules, which Vite builds.
// - Promise.all([...]): waits for every promise in the array, so the images and the fonts load at the same time instead of one after the other.
// - window.localStorage: the browser's storage for this site, which keeps its contents after the tab closes.
// - { hud, save: ... }: `hud` alone is shorthand for `hud: hud`.
// - (saved) => store.save(saved): passing `store.save` by itself would lose `this`, and SaveStore's try/catch would then hide the error, so nothing would ever be saved.
// - flow.run(): with no argument, starts at the progress's current step: 0 (the intro) for a new game, or the step a save points at.
// - steps.length - 1: the position of the last step, the medal.
