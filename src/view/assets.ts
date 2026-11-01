import { colors } from './theme';

/**
 * Every image the game uses, by name, with its file under `public/assets/`.
 * To add one, put the file in `public/assets/images/` and add a line here.
 */
export const IMAGE_FILES: Record<string, string> = {
  player: 'images/player.png',
  playerWalking: 'images/player-walking.png',
  playerClimbing: 'images/player-climbing.png',
  playerCelebrating: 'images/player-celebrating.png',
  playerNewOutfit: 'images/player-newoutfit.png',
  playerDiscoOutfit: 'images/player-discooutfit.png',
  friend: 'images/friend.png',
  friendWaving: 'images/friend-waving.png',
  friendSitting: 'images/friend-sitting.png',
  shopOwnerSupplies: 'images/shopowner-supplies.png',
  shopOwnerClothing: 'images/shopowner-clothing.png',
  shopOwnerCelebrating: 'images/shopowner-celebrating.png',
};

/** Every sound the game uses, by name. Add files to `public/assets/sounds/` and list them here. */
export const SOUND_FILES: Record<string, string> = {};

/** How long one file may take before it is given up on, so a slow file never holds up the game. */
const LOAD_TIMEOUT_MS = 10_000;

// A purple box with a "?", the size of a character sprite, so a missing image is easy to spot.
const PLACEHOLDER_IMAGE_SRC =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="65">` +
      `<rect width="40" height="65" fill="${colors.purple}"/>` +
      `<text x="20" y="40" font-family="sans-serif" font-size="24" text-anchor="middle" fill="${colors.ink}">?</text>` +
      `</svg>`,
  );

// A WAV file holding one silent sample, so `.play()` on a missing sound works and is silent.
const PLACEHOLDER_SOUND_SRC = 'data:audio/wav;base64,UklGRiUAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQEAAACA';

const images = new Map<string, HTMLImageElement>();
const sounds = new Map<string, HTMLAudioElement>();
let placeholderImage: HTMLImageElement | undefined;
let placeholderSound: HTMLAudioElement | undefined;

/**
 * Loads every image and sound listed above. `main.ts` waits for it once before
 * drawing anything. It always resolves: a file that fails or takes too long is
 * reported in the console and replaced by a placeholder.
 */
export async function loadAssets(): Promise<void> {
  placeholderImage = await loadImage(PLACEHOLDER_IMAGE_SRC);
  placeholderSound = await loadSound(PLACEHOLDER_SOUND_SRC);
  await Promise.all([
    ...Object.entries(IMAGE_FILES).map(async ([name, file]) => {
      const loaded = await loadImage(assetUrl(file));
      if (loaded) images.set(name, loaded);
      else console.warn(`Image "${name}" (${file}) failed to load, so a placeholder is shown instead.`);
    }),
    ...Object.entries(SOUND_FILES).map(async ([name, file]) => {
      const loaded = await loadSound(assetUrl(file));
      if (loaded) sounds.set(name, loaded);
      else console.warn(`Sound "${name}" (${file}) failed to load, so it will be silent.`);
    }),
  ]);
}
// Optional documentation
// - Object.entries(obj): the object's [name, value] pairs as an array, here [name, file].
// - Promise.all([...]): waits until every promise in the array has finished. None of ours reject, so one bad file can't stop the rest.
// - [...a, ...b]: the spread `...` joins the image and sound arrays into one.

/** The image with this name, ready for `new Konva.Image({ image: image('player') })`. Never throws. */
export function image(name: string): HTMLImageElement {
  const found = images.get(name);
  if (found) return found;
  if (!(name in IMAGE_FILES)) console.warn(`No image is named "${name}". Check the list in view/assets.ts.`);
  return placeholderImage ?? new Image();
}

/** The sound with this name; call `.play()` on it. A missing sound plays silence. Never throws. */
export function sound(name: string): HTMLAudioElement {
  const found = sounds.get(name);
  if (found) return found;
  if (!(name in SOUND_FILES)) console.warn(`No sound is named "${name}". Check the list in view/assets.ts.`);
  return placeholderSound ?? new Audio();
}
// Optional documentation
// - name in IMAGE_FILES: true if the object has a property with that name, so a typo gets its own warning.
// - a ?? b: a, unless a is null or undefined, then b. Here it covers a view asking before loadAssets has run.

/** Public files are served next to the page, and BASE_URL keeps the path right under the GitHub Pages subpath. */
function assetUrl(file: string): string {
  return `${import.meta.env.BASE_URL}assets/${file}`;
}
// Optional documentation
// - import.meta.env.BASE_URL: Vite's `base` setting from vite.config.ts, which is './' for us.

/** Resolves with the image once it has loaded, or undefined if it fails or times out. */
function loadImage(src: string): Promise<HTMLImageElement | undefined> {
  const img = new Image();
  return whenReady(img, 'onload', src);
}

/** Resolves with the sound once it can play all the way through, or undefined if it fails or times out. */
function loadSound(src: string): Promise<HTMLAudioElement | undefined> {
  const audio = new Audio();
  audio.preload = 'auto';
  return whenReady(audio, 'oncanplaythrough', src);
}
// Optional documentation
// - audio.preload = 'auto': asks the browser to download the whole file now rather than when it is first played.

function whenReady<T extends HTMLImageElement | HTMLAudioElement>(
  element: T,
  readyEvent: 'onload' | 'oncanplaythrough',
  src: string,
): Promise<T | undefined> {
  return new Promise((resolve) => {
    const finish = (result: T | undefined) => {
      clearTimeout(timer);
      element[readyEvent] = null;
      element.onerror = null;
      resolve(result);
    };
    const timer = setTimeout(() => finish(undefined), LOAD_TIMEOUT_MS);
    element[readyEvent] = () => finish(element);
    element.onerror = () => finish(undefined);
    element.src = src;
  });
}
// Optional documentation
// - <T extends HTMLImageElement | HTMLAudioElement>: a generic, so the promise gives back the same kind of element it was given.
// - new Promise((resolve) => ...): wraps the browser's onload/onerror callbacks in a promise that loadAssets can await.
// - setTimeout / clearTimeout: gives up after LOAD_TIMEOUT_MS, and cancels that once the file has finished either way.
// - element[readyEvent] = null: removes the handler, so a late event after a timeout does nothing.
// - The handlers are set before `src`, so a file the browser already has cached can't finish before we're listening.
