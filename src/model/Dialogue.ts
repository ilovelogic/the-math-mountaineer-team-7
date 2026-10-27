/** One dialogue box on screen: one speaker's turn. */
export interface DialogueLine {
  speaker: string;
  text: string;
  /** The buttons on a box that ends a scene, as on Level done. */
  choices?: string[];
}

/** Tracks which dialogue box the player is on. */
export class Dialogue {
  private readonly lines: readonly DialogueLine[];
  private index = 0;
  private finished = false;

  /** `transitionMs` is how long clicks are ignored after a box changes, passed in from settings. */
  constructor(lines: readonly DialogueLine[], transitionMs: number) {
    if (lines.length === 0) throw new Error('A dialogue needs at least one line.');
    if (transitionMs < 0) throw new Error('transitionMs cannot be negative.');
    this.lines = [...lines];
  }

  /** The box to show. Stays on the last box once the dialogue is finished. */
  current(): DialogueLine {
    return this.lines[this.index];
  }

  /** True once the player has clicked past the last box. */
  isFinished(): boolean {
    return this.finished;
  }
}
