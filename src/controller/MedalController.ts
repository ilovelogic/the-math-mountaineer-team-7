import { settings } from '../content/settings';
import { medalFor, type MedalLimits } from '../model/medals';
import { worthReviewing } from '../model/rules';
import type { ProgressView } from '../model/PlayerProgress';
import { drawMedalScreen, drawResultsScreen } from '../view/MedalScreen';
import type { Layers } from '../view/stage';
import type { Outcome, Screen } from './Screen';

/**
 * The end of the game: works out the medal from the player's points, has the
 * medal screen show it, and reports `done` when the player presses See Results.
 * It reads the points when it starts, so it can be built before the last chasm is scored.
 */
export class MedalController implements Screen {
  //private onDone: ((outcome: Outcome) => void) | null = null;
  private erase: (() => void) | null = null;
  private active = false;
  private showingResults = false;

  constructor(
    private readonly layers: Layers,
    private readonly progress: ProgressView,
    private readonly limits: MedalLimits = settings.medalLimits,
  ) {}

  start(_onDone: (outcome: Outcome) => void): void {
    this.active = true;
    this.showingResults = false;
  
    const points = this.progress.points;
    const medal = medalFor(points, this.limits);
  
    this.erase = drawMedalScreen(this.layers, {
      medal,
      points,
      onSeeResults: () => {
        if (!this.active || this.showingResults) {
          return;
        }
  
        this.showingResults = true;
        this.erase?.();
  
        this.erase = drawResultsScreen(this.layers, {
          medal,
          points,
          results: this.progress.getResults(),
          levelResults: this.progress.getLevelResults(),
          worthReviewing: worthReviewing(this.progress.answers),
        });
      },
    });
  }

  stop(): void {
    this.active = false;
    this.erase?.();
    this.erase = null;
  }

  /** Forgets `onDone` before calling it, so a second press can't report again. To be reintroduced for final button*/
  /**
  private finish(): void {
    const onDone = this.onDone;
    this.onDone = null;
    onDone?.({ kind: 'done' });
  }
  */
}
