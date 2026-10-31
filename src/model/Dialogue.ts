/** One dialogue box on screen: one speaker's turn. */
export interface DialogueLine {
  speaker: string;
  text: string;
  /** The buttons on a box that ends a scene, as on Level done. */
  choices?: string[];
}

/**
 * Tracks which dialogue box the player is on. Each accepted click moves exactly one box,
 * and clicks during the short transition after a box changes are ignored, so a fast
 * double click never skips a box.
 */
export class Dialogue {
  private readonly lines: readonly DialogueLine[];
  private readonly transitionMs: number;
  private index = 0;
  private finished = false;
  /** When the last click was accepted; starts far in the past so the first click always counts. */
  private lastAcceptedAt = -Infinity;

  /** `transitionMs` is how long clicks are ignored after a box changes, passed in from settings. */
  constructor(lines: readonly DialogueLine[], transitionMs: number) {
    if (lines.length === 0) throw new Error('A dialogue needs at least one line.');
    if (transitionMs < 0) throw new Error('transitionMs cannot be negative.');
    this.lines = [...lines];
    this.transitionMs = transitionMs;
  }

  /** The box to show. Stays on the last box once the dialogue is finished. */
  current(): DialogueLine {
    return this.lines[this.index];
  }

  /**
   * Handles one click at time `now` (ms, from the click or frame, never a clock read here):
   * moves to the next box, or finishes on the last one. Returns whether the click was
   * accepted, so the controller knows to redraw or report. A choice click on the last box
   * goes through here too, so it is also ignored during a transition.
   */
  advance(now: number): boolean {
    if (this.finished) return false;
    if (now - this.lastAcceptedAt < this.transitionMs) return false;
    this.lastAcceptedAt = now;
    if (this.index === this.lines.length - 1) {
      this.finished = true;
    } else {
      this.index++;
    }
    return true;
  }

  /** True once the player has clicked past the last box. */
  isFinished(): boolean {
    return this.finished;
  }
}
