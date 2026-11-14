/**
 * What a screen reports when it finishes. Most screens report which option the player
 * picked; a screen that spans several pages reports one of its own listed results
 * instead. Either way, GameFlow decides what happens next.
 */
export type Outcome =
  | { kind: 'done' }
  /**
   * `index` is the picked option's position, in the order the screen shows them. A screen
   * that spans several pages, such as DuelShopController, instead reports one of its own
   * listed results (DUEL_RESULT), which isn't a button position.
   */
  | { kind: 'choice'; index: number };

/** Every screen controller implements this. GameFlow runs one screen at a time. */
export interface Screen {
  /** Draws the screen and listens for input. Calls `onDone` exactly once. */
  start(onDone: (outcome: Outcome) => void): void;
  /** Removes everything the screen drew and stops listening; never calls `onDone` after this. */
  stop(): void;
}
