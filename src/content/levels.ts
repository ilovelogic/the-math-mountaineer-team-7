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

/** The game's script: every step in the order it happens. */
export const steps: Step[] = [
  { kind: 'title' },
  { kind: 'dialogue', script: 'intro' },
  { kind: 'dialogue', script: 'tutorial' },
];
