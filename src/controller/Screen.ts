/**
 * What a screen reports when it finishes. Screens report the player's choice;
 * GameFlow decides what it means.
 */
export type Outcome =
  | { kind: 'done' }
  /** `index` is the picked option's position, in the order the screen shows them. */
  | { kind: 'choice'; index: number };

/** Every screen controller implements this. GameFlow runs one screen at a time. */
export interface Screen {
  /** Draws the screen and listens for input. Calls `onDone` exactly once. */
  start(onDone: (outcome: Outcome) => void): void;
  /** Removes everything the screen drew and stops listening; never calls `onDone` after this. */
  stop(): void;
}
