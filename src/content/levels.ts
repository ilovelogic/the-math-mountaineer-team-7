/**
 * One step of the game, which GameFlow plays in order and saves a checkpoint after.
 * `script` names a scene in content/dialogue scripts.
 */
export type Step =
  | { kind: 'title' }
  | { kind: 'dialogue'; script: string }
  | { kind: 'chasm'; level: number; topic: string; index: number }
  /** GameFlow picks the "all points" or "under 100%" message from the level's points. */
  | { kind: 'levelDone'; level: number }
  | { kind: 'medal' };

const TOPIC_2D = 'Pythagorean theorem in 2D';

/**
 * The game's script: every step in the order it happens. Each chasm is its own step,
 * so a closed tab loses at most one chasm. Its problem comes from the game's seed plus
 * `level` and `index`, so every game gets different problems.
 */
export const steps: Step[] = [
  { kind: 'title' },
  { kind: 'dialogue', script: 'intro' },
  { kind: 'dialogue', script: 'howCrossingWorks' },

  { kind: 'chasm', level: 1, topic: TOPIC_2D, index: 0 },
  { kind: 'chasm', level: 1, topic: TOPIC_2D, index: 1 },
  { kind: 'chasm', level: 1, topic: TOPIC_2D, index: 2 },
  { kind: 'chasm', level: 1, topic: TOPIC_2D, index: 3 },
  { kind: 'chasm', level: 1, topic: TOPIC_2D, index: 4 },
  { kind: 'levelDone', level: 1 },

  { kind: 'chasm', level: 2, topic: TOPIC_2D, index: 0 },
  { kind: 'chasm', level: 2, topic: TOPIC_2D, index: 1 },
  { kind: 'chasm', level: 2, topic: TOPIC_2D, index: 2 },
  { kind: 'chasm', level: 2, topic: TOPIC_2D, index: 3 },
  { kind: 'chasm', level: 2, topic: TOPIC_2D, index: 4 },
  { kind: 'levelDone', level: 2 },

  // The last level goes straight to the medal, with no Level done message.
  { kind: 'chasm', level: 3, topic: TOPIC_2D, index: 0 },
  { kind: 'chasm', level: 3, topic: TOPIC_2D, index: 1 },
  { kind: 'chasm', level: 3, topic: TOPIC_2D, index: 2 },
  { kind: 'chasm', level: 3, topic: TOPIC_2D, index: 3 },
  { kind: 'chasm', level: 3, topic: TOPIC_2D, index: 4 },
  { kind: 'medal' },
];
