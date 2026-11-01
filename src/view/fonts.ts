// Inter ships inside the game instead of coming from Google, so it works offline
// and on school networks that block font sites. These imports add its two weights
// to the page; loadFonts then waits for the files to arrive.
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';

// The two weights the theme's text styles use ('normal' is 400). The size is
// required by the browser's API but doesn't matter, since one file covers every size.
const FACES = ['400 16px Inter', '600 16px Inter'];

/**
 * Waits until both weights of Inter are ready, so Konva measures and draws text
 * in the right font from the first frame instead of jumping when it arrives.
 * `main.ts` waits for it once before drawing anything. Like `loadAssets`, it
 * always resolves: a weight that can't be loaded is reported in the console, and
 * its text falls back to the theme's sans-serif rather than stopping the game.
 */
export async function loadFonts(): Promise<void> {
  const loaded = await Promise.all(FACES.map(isLoaded));
  FACES.forEach((face, index) => {
    if (!loaded[index]) console.warn(`The font "${face}" didn't load, so its text uses the fallback font instead.`);
  });
}
// Optional documentation
// - import '@fontsource/inter/400.css': an import with no names, run only for its effect, which adds the font file to the page; Vite bundles the file with the game.
// - Promise.all([...]): waits for every promise in the array and gives back their results in the same order, so both weights load at the same time.
// - FACES.map(isLoaded): makes a new array holding isLoaded's promise for each face.
// - FACES.forEach((face, index) => ...): runs the function once per face, also passing its position, starting at 0.
// - `... ${face} ...`: a template string; the value inside ${ } is inserted into the text.

async function isLoaded(face: string): Promise<boolean> {
  try {
    const matches = await document.fonts.load(face);
    return matches.length > 0;
  } catch {
    // The download itself failed, which counts the same as a missing font.
    return false;
  }
}
// Optional documentation
// - document.fonts.load(face): starts downloading the fonts that match the description and resolves with them once they're ready, or with an empty array if none match.
// - catch { ... }: a catch that doesn't need the error itself, so it leaves out the `(error)` name.
