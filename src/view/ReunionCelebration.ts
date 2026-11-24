import Konva from 'konva';
import { image } from './assets';
import { STAGE_WIDTH } from './stage';
import { colors } from './theme';

/**
 * Where the snow meets the characters' feet in the reunion's close-up (#204). The close-up shows
 * Level 3's glacier at twice its size, so the snow line, at y = 370 on the full background, lands
 * here. DialogueScenery stands the mountaineer on it, and the friend hops from it.
 */
export const CLOSE_UP_GROUND = 390;

/** The friend's hop: how high it goes in px, how long they're in the air, and how often they hop, in ms. */
export const HOP = { height: 46, airMs: 500, cycleMs: 700 } as const;

/** Confetti falls between the top bar and the snow, then starts again at the top. */
export const CONFETTI_TOP = 48;
export const CONFETTI_BOTTOM = 410;

/** How long each heart takes to float up and fade, in ms, and how far it rises in px. */
export const HEART_CYCLE_MS = 2400;
const HEART_RISE = 70;

// Positions and sizes from the "Reunion option 4: Close-up with hearts" mockup.
const FRIEND = { x: 500, width: 90, height: 130 };
const SHADOW = { x: 545, radiusX: 27, radiusY: 4 };
const HEARTS = [
  { x: 452, y: 170, pixel: 5, phase: 0 },
  { x: 492, y: 132, pixel: 3, phase: 0.5 },
];

// The heart, one row per string, where every X is one square.
const HEART_PIXELS = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];

const CONFETTI_COLORS = [colors.orange, colors.teal, colors.purple, colors.gold];

/**
 * Small confetti falls slowly behind the characters and large confetti falls faster in front
 * of them, so the close-up has some depth. Speeds are in px per second.
 */
const FAR_CONFETTI = { count: 80, size: 6, minSpeed: 40, maxSpeed: 90 };
const NEAR_CONFETTI = { count: 12, size: 12, minSpeed: 90, maxSpeed: 140 };

/** One piece of confetti, with where it starts and how fast it falls. */
interface Piece {
  node: Konva.Rect;
  startY: number;
  speed: number;
}

/**
 * The moving part of the reunion (#204): the friend hopping for joy, two hearts floating up
 * between the friend and the mountaineer, and confetti falling until the player presses
 * Continue. DialogueScenery draws the still part (the background and the mountaineer) and
 * makes one of these when its scene asks to celebrate, then destroys it with the rest.
 *
 * Everything moves in one Konva.Animation, so there is a single thing to stop. Each frame
 * places every shape from the animation's elapsed time, using the functions below, so
 * nothing builds up from frame to frame and tests can check positions at any moment.
 */
export class ReunionCelebration {
  private readonly farConfetti = new Konva.Group();
  private readonly foreground = new Konva.Group();
  private readonly friend: Konva.Image;
  private readonly hearts: Konva.Group[];
  private readonly pieces: Piece[];
  private readonly animation: Konva.Animation;

  /** `random` places the confetti; tests pass a seeded one so the layout is the same every run. */
  constructor(layer: Konva.Layer, random: () => number = Math.random) {
    const farPieces = Array.from({ length: FAR_CONFETTI.count }, (_, i) => makePiece(FAR_CONFETTI, i, random));
    const nearPieces = Array.from({ length: NEAR_CONFETTI.count }, (_, i) => makePiece(NEAR_CONFETTI, i, random));
    this.pieces = [...farPieces, ...nearPieces];

    this.friend = new Konva.Image({ image: image('friendWaving4x'), name: 'reunion-friend', x: FRIEND.x, width: FRIEND.width, height: FRIEND.height });
    const shadow = new Konva.Ellipse({ ...SHADOW, y: CLOSE_UP_GROUND, fill: colors.ink, opacity: 0.18 });
    this.hearts = HEARTS.map((heart) => drawHeart(heart.pixel));

    this.farConfetti.add(...farPieces.map((piece) => piece.node));
    this.foreground.add(shadow, this.friend, ...this.hearts, ...nearPieces.map((piece) => piece.node));
    layer.add(this.farConfetti, this.foreground);
    this.farConfetti.moveToBottom();

    this.placeAt(0);
    this.animation = new Konva.Animation((frame) => this.placeAt(frame.time), layer);
    this.animation.start();
  }
  // Optional documentation
  // - Array.from({ length: n }, (_, i) => ...): makes a list of n items by calling the function with each index; `_` is the unused first argument.
  // - [...farPieces, ...nearPieces]: the spread `...` joins both lists into one.
  // - name: 'reunion-friend': a label on the node, which tests use to find it with find('.reunion-friend').
  // - new Konva.Ellipse({ x, y, radiusX, radiusY }): an oval centered on (x, y), radiusX wide on each side and radiusY tall.
  // - opacity: 0.18: 0 is invisible and 1 is solid, so the shadow is a light tint on the snow.
  // - group.add(...list): the spread passes every node in the list to add, as separate arguments.
  // - moveToBottom(): moves the group under everything else on its layer, so the small confetti falls behind the mountaineer DialogueScenery drew first.
  // - new Konva.Animation((frame) => ..., layer): runs the function before every frame and then redraws `layer`; frame.time is the ms the animation has been running.

  /** Stops the animation and removes everything it drew. It can't be shown again afterwards. */
  destroy(): void {
    this.animation.stop();
    this.farConfetti.destroy();
    this.foreground.destroy();
  }
  // Optional documentation
  // - animation.stop(): stops calling the function each frame, so the layer is no longer redrawn for it.
  // - group.destroy(): removes the group and every shape in it from the layer for good.

  /** Puts every shape where it belongs `ms` into the celebration. */
  private placeAt(ms: number): void {
    this.friend.y(CLOSE_UP_GROUND - FRIEND.height - hopHeight(ms));
    this.hearts.forEach((heart, i) => {
      const { x, y, phase } = HEARTS[i];
      const progress = heartProgress(ms + phase * HEART_CYCLE_MS);
      heart.position({ x, y: y - HEART_RISE * progress });
      heart.opacity(Math.sin(Math.PI * progress));
    });
    for (const piece of this.pieces) piece.node.y(fallenY(piece.startY, piece.speed, ms));
  }
  // Optional documentation
  // - const { x, y, phase } = HEARTS[i]: unpacks those three properties of the heart into variables with the same names.
  // - heart.position({ x, y }): moves the group so its top-left corner is at (x, y).
  // - Math.sin(Math.PI * progress): 0 at the start and end of the cycle and 1 halfway, so each heart fades in, then out as it rises.
}

/** How high the friend is above the snow `ms` into the celebration: up and down in an arc, then a short rest on the snow. */
export function hopHeight(ms: number): number {
  const intoCycle = ms % HOP.cycleMs;
  if (intoCycle >= HOP.airMs) return 0;
  return HOP.height * Math.sin((Math.PI * intoCycle) / HOP.airMs);
}
// Optional documentation
// - ms % HOP.cycleMs: the remainder after dividing, so the time counts up to one cycle and starts again from 0, which repeats the hop.

/** How far through its float a heart is `ms` into the celebration, from 0 (just appearing) up to, but never reaching, 1. */
export function heartProgress(ms: number): number {
  return (ms % HEART_CYCLE_MS) / HEART_CYCLE_MS;
}

/**
 * Where a piece of confetti that started at `startY` and falls `speed` px per second is `ms`
 * into the celebration. A piece that passes CONFETTI_BOTTOM comes back in at CONFETTI_TOP,
 * so the confetti keeps falling for as long as the scene lasts.
 */
export function fallenY(startY: number, speed: number, ms: number): number {
  const span = CONFETTI_BOTTOM - CONFETTI_TOP;
  const fallen = startY - CONFETTI_TOP + (speed * ms) / 1000;
  return CONFETTI_TOP + (fallen % span);
}

// One piece at a random spot and speed, cycling through the theme's confetti colors. A third
// of them are half as tall, which reads as a piece turned edge-on as it tumbles.
function makePiece(kind: typeof FAR_CONFETTI, index: number, random: () => number): Piece {
  const isEdgeOn = random() < 1 / 3;
  const node = new Konva.Rect({
    x: Math.round(random() * (STAGE_WIDTH - kind.size)),
    width: kind.size,
    height: isEdgeOn ? kind.size / 2 : kind.size,
    fill: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    name: 'reunion-confetti',
  });
  const startY = CONFETTI_TOP + random() * (CONFETTI_BOTTOM - CONFETTI_TOP);
  const speed = kind.minSpeed + random() * (kind.maxSpeed - kind.minSpeed);
  return { node, startY, speed };
}
// Optional documentation
// - typeof FAR_CONFETTI: the type of that object, so either confetti size (which has the same four fields) can be passed in.
// - Math.round(...): rounds to the nearest whole number, so each piece lines up with the screen's pixels.

// A heart drawn from HEART_PIXELS as `pixel`-sized squares in the theme's orange.
function drawHeart(pixel: number): Konva.Group {
  const heart = new Konva.Group({ name: 'reunion-heart' });
  HEART_PIXELS.forEach((row, rowIndex) => {
    [...row].forEach((cell, column) => {
      if (cell !== 'X') return;
      heart.add(new Konva.Rect({ x: column * pixel, y: rowIndex * pixel, width: pixel, height: pixel, fill: colors.orange }));
    });
  });
  return heart;
}
// Optional documentation
// - [...row]: splits the string into a list of its characters, so each one can be checked.
