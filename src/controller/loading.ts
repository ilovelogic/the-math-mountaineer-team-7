import type { LoadingScreen } from '../view/loadingScreen';

/**
 * Runs `load` and shows the loading screen only if it's still going after `delayMs`, so a
 * fast load never flashes the screen for a split second. Once shown, the bar follows
 * `load`'s progress, and the screen is removed as soon as loading finishes. The screen is
 * drawn only after `readyToDraw` resolves too, which `main.ts` uses to wait for the font,
 * so the text never jumps from the fallback font to Inter.
 *
 * `load` must always resolve, as `loadAssets` does, since nothing here catches a failure.
 */
export async function showWhileSlow(
  load: (onProgress: (loaded: number, total: number) => void) => Promise<void>,
  show: () => LoadingScreen,
  delayMs: number,
  readyToDraw: Promise<void>,
): Promise<void> {
  const state: { finished: boolean; screen?: LoadingScreen; latest?: [number, number] } = { finished: false };

  const timer = setTimeout(async () => {
    await readyToDraw;
    if (state.finished) return;
    state.screen = show();
    // Files that finished before the screen appeared still count, so the bar starts where loading is.
    if (state.latest) state.screen.progress(...state.latest);
  }, delayMs);

  await load((loaded, total) => {
    state.latest = [loaded, total];
    state.screen?.progress(loaded, total);
  });
  state.finished = true;
  clearTimeout(timer);
  state.screen?.remove();
}
// Optional documentation
// - load: (onProgress: ...) => Promise<void>: a function passed in that starts loading and reports progress through the callback it's given; main.ts passes loadAssets itself.
// - show: () => LoadingScreen: a function that draws the screen when it's called, so nothing is drawn unless loading turns out to be slow; tests pass a stand-in.
// - state: one object holding what the timer and the progress callback both change. Keeping it in an object, not separate `let` variables, lets TypeScript see that the timer may have set `screen`.
// - setTimeout(async () => ..., delayMs): runs the function once after delayMs; it's async so it can wait for readyToDraw first.
// - clearTimeout(timer): cancels the timer if it hasn't run yet, so a fast load never shows the screen.
// - progress(...state.latest): the spread `...` passes the pair's two numbers as the two arguments.
// - state.screen?.remove(): removes the screen only if it was shown.
