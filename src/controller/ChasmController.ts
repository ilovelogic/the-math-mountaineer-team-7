import type { Screen, Outcome } from './Screen';
import { checkPick, type Chasm } from '../model/problems'
import type { PickResult } from '../model/rules';



export interface ChasmView {
    draw(): void;
    onLogClicked(cb: (index: number) => void): void;
    onChoiceSelected(cb: (index: number) => void): void;
    showCorrectFeedback(correctLength: number): void;
    showFeedback(result: 'tooShort' | 'tooLong', selectedLength: number, correctLength: number): void;
    showCrossing(correctLength: number): void;
    /** Calls `cb` each time the player clicks Hint. */
    onHintClicked(cb: () => void): void;
    /** Shows the formula card and the hint's line, whose Back button reports as choice 0. */
    showHint(): void;
    /** Hides the formula card and puts the question back. */
    hideHint(): void;
    lock(): void;
    destroy(): void;
}
export interface ChasmSolutionView {
    draw(): void;
    onContinueClicked(cb: () => void): void;
    show(): void;
    hide(): void;
    destroy(): void;
}


export class ChasmController implements Screen {
    private onDone?: (outcome: Outcome) => void;
    private hasPicked = false;
    private stopped = false;
    private pendingIndex: number | null = null;
    private showingCrossing = false;
    private wasCorrect = false;
    private hintOpen = false;


    constructor(
        private readonly screen: ChasmView,
        private readonly solutionScreen: ChasmSolutionView,
        private readonly chasm: Chasm,
        // Plays the pick's sound as soon as the log is picked, since GameFlow only hears
        // about the pick after Continue. Tests that don't check sounds can leave it out.
        private readonly playCue: (cue: PickResult) => void = () => {},
    ) {}

    start(onDone: (outcome: Outcome) => void): void {
        this.onDone = onDone;

        this.screen.draw();
        this.screen.onLogClicked((index) => {
            this.handlePick(index);
        });

        // The hint only helps with working out a pick, so it does nothing once a log is picked.
        // Opening or closing it never reports an outcome, so it can never change the points.
        this.screen.onHintClicked(() => {
            if (this.stopped || this.hasPicked) return;
            this.hintOpen = true;
            this.screen.showHint();
        });

        // Draw solution screen
        this.solutionScreen.draw();
        this.solutionScreen.onContinueClicked(() => {
            this.solutionScreen.hide();
            const correctLength = this.chasm.logs[this.chasm.correct];
            this.showingCrossing = true;
            this.screen.showCrossing(correctLength);
        });

        this.screen.onChoiceSelected((index) => {
            // While the hint is open, the dialog box's only button is Back.
            if (this.hintOpen) {
                if (index === 0) this.closeHint();
                return;
            }
            if (this.pendingIndex === null || (index !== 0 && index !== 1)) return;

            if (index === 1) {
                this.solutionScreen.show();
                return;
            }

            if (this.wasCorrect) {
                this.screen.lock();

                this.onDone?.({
                    kind: 'choice',
                    index: this.pendingIndex
                });
                return;
            }

            if(!this.showingCrossing) {
                const correctLength = this.chasm.logs[this.chasm.correct];

                this.showingCrossing = true;
                this.screen.showCrossing(correctLength);
                return;
            }

            this.screen.lock();

            this.onDone?.({
                kind: 'choice',
                index: this.pendingIndex
            });
        });

    }

    stop(): void {
        this.stopped = true;
        this.screen.destroy();
        this.onDone = undefined;
        this.solutionScreen.destroy();
    }

    private handlePick(index: number): void {
        if (this.stopped || this.hasPicked) {
            return; // Ignore clicks if already picked
        }

        this.hasPicked = true;
        // The logs stay clickable while the hint is open, and picking one closes it.
        if (this.hintOpen) this.closeHint();

        const result = checkPick(this.chasm, index);
        this.playCue(result);

        if (result === 'fits') {
            this.wasCorrect = true;
            this.pendingIndex = index;
            this.screen.showCorrectFeedback(this.chasm.logs[index]);
            return;
        };

        // original selection
        this.wasCorrect = false;
        this.pendingIndex = index;

        // answer was wrong, so get the right and wrong answer values
        const selectedLength = this.chasm.logs[index];
        const correctLength = this.chasm.logs[this.chasm.correct];

        this.screen.showFeedback(result, selectedLength, correctLength);
    }

    private closeHint(): void {
        this.hintOpen = false;
        this.screen.hideHint();
    }

}
// Optional documentation
// - playCue: (cue: PickResult) => void = () => {}: a default value, a function that does nothing, used when no fourth argument is passed.
