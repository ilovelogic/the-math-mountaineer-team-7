// Entry point and the only place that wires the game together: it builds the stage,
// loads the images, sounds and font (with a loading screen if that's slow), shows the
// title screen, and then starts GameFlow with the game the player picked, which plays
// every step from the intro to the medal. Each step's screen comes from the screen factory.
import { steps } from './content/levels';
import { settings } from './content/settings';
import { GameFlow } from './controller/GameFlow';
import { showWhileSlow } from './controller/loading';
import { createScreenFactory } from './controller/screenFactory';
import { startGame, startNewGame } from './controller/startGame';
import { TitleController } from './controller/TitleController';
import type { PlayerProgress } from './model/PlayerProgress';
import { SaveStore } from './model/SaveStore';
import { loadAssets } from './view/assets';
import { play as playSound } from './view/audio';
import { loadFonts } from './view/fonts';
import { Hud } from './view/Hud';
import { showLoadingScreen } from './view/loadingScreen';
import { createStage } from './view/stage';
import { TitleScreen } from './view/TitleScreen';

const layers = createStage('game').layers;

// Every image, sound and font is loaded before the title is drawn, so no screen waits on a
// file. The images and sounds start loading straight away, but the loading screen is drawn
// only once the font is ready, so Konva never draws its text in the fallback font first.
const fontsReady = loadFonts();
await showWhileSlow(loadAssets, () => showLoadingScreen(layers.ui), settings.loadingScreenDelayMs, fontsReady);
await fontsReady;

const store = new SaveStore(window.localStorage);

/** Plays the game the player picked on the title screen, from the step its progress is on. */
function play(progress: PlayerProgress): void {
  // The Hud is made only now, so the title screen has no top bar, like its mockup.
  const hud = new Hud(layers);
  const flow = new GameFlow(steps, progress, createScreenFactory(layers, progress, playSound), {
    hud,
    // Wrapped in an arrow function so `save` still knows which SaveStore it belongs to.
    save: (saved) => store.save(saved),
    load: () => store.load(),
    playCue: playSound,
    // Play again: remove this game's Hud, since the new game makes its own (#194).
    playAgain: () => {
      hud.destroy();
      startNewGame(() => store.clear(), play);
    },
  });
  flow.run();
}

startGame(store.load(), steps.length - 1, (canContinue) => new TitleController(new TitleScreen(layers), canContinue), play);
// Optional documentation
// - import { play as playSound }: imports audio's `play` under another name, since this file already has its own `play`.
// - await at the top level of a module: the rest of this file waits for the promise; it's allowed in ES modules, which Vite builds.
// - const fontsReady = loadFonts(): starts loading the font without waiting for it, so the images and sounds load at the same time; `await fontsReady` waits for it later.
// - showWhileSlow(loadAssets, ...): passes the loadAssets function itself, not its result, so showWhileSlow can start it with its own progress callback.
// - () => showLoadingScreen(layers.ui): a function that draws the loading screen only when it's called, which is only if loading is slow.
// - window.localStorage: the browser's storage for this site, which keeps its contents after the tab closes.
// - { hud, save: ... }: `hud` alone is shorthand for `hud: hud`.
// - (saved) => store.save(saved): passing `store.save` by itself would lose `this`, and SaveStore's try/catch would then hide the error, so nothing would ever be saved.
// - flow.run(): with no argument, starts at the progress's current step: 0 (the intro) for a new game, or the step a save points at.
// - steps.length - 1: the position of the last step, the medal.
