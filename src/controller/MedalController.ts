import { settings } from '../content/settings';
import { medalFor, type MedalLimits } from '../model/medals';
import type { ProgressView } from '../model/PlayerProgress';
import { drawMedalScreen } from '../view/MedalScreen';
import type { Layers } from '../view/stage';
import type { Outcome, Screen } from './Screen';

/**
 * The end of the game: works out the medal from the player's points, has the
 * medal screen show it, and reports `done` when the player presses See Results.
 * It reads the points when it starts, so it can be built before the last chasm is scored.
 */
export class MedalController implements Screen {
  private onDone: ((outcome: Outcome) => void) | null = null;
  private erase: (() => void) | null = null;

  constructor(
    private readonly layers: Layers,
    private readonly progress: ProgressView,
    private readonly limits: MedalLimits = settings.medalLimits,
  ) {}

  start(onDone: (outcome: Outcome) => void): void {
    this.onDone = onDone;
    const points = this.progress.points;
    this.erase = drawMedalScreen(this.layers, {
      medal: medalFor(points, this.limits),
      points,
      onSeeResults: () => this.finish(),
    });
  }

  stop(): void {
    this.onDone = null;
    this.erase?.();
    this.erase = null;
  }

  /** Forgets `onDone` before calling it, so a second press can't report again. */
  private finish(): void {
    const onDone = this.onDone;
    this.onDone = null;
    onDone?.({ kind: 'done' });
  }
}