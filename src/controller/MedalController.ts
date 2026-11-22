import { settings } from '../content/settings';
import { medalFor, type MedalLimits } from '../model/medals';
import { worthReviewing } from '../model/rules';
import type { ProgressView } from '../model/PlayerProgress';
import { drawMedalScreen } from '../view/MedalScreen';
import { drawResultsScreen } from '../view/ResultsScreen';
import type { Layers } from '../view/stage';
import type { Outcome, Screen } from './Screen';
import { dialogueScripts } from '../content/dialogueScripts';
import { DialogueBox } from '../view/DialogueBox';
/**
 * The end of the game: works out the medal from the player's points,
 * displays the medal screen, and switches to the results screen when
 * the player presses See Results.
 */
export class MedalController implements Screen {
  private erase: (() => void) | null = null;
  private active = false;
  private showingResults = false;
  private dialogueBox: DialogueBox | null = null;

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
          levelResults: this.progress.getLevelResults(),
          worthReviewing: worthReviewing(this.progress.answers),
        });
        this.dialogueBox = new DialogueBox(
          this.layers,
          (_index) => {
            // We'll implement Replay a level later.
          },
        );
        this.dialogueBox.show(dialogueScripts.results[0]);
      },
    });
  }

  stop(): void {
    this.active = false;
    this.erase?.();
    this.erase = null;
    this.dialogueBox?.destroy();
    this.dialogueBox = null;
  }
}
