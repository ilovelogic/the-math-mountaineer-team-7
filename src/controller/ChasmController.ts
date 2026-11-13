import type { Screen, Outcome } from './Screen';
import { checkPick, type Chasm } from '../model/problems'



export interface ChasmView {
    draw(): void;
    onLogClicked(cb: (index: number) => void): void;
    onChoiceSelected(cb: (index: number) => void): void;
    showCorrectFeedback(correctLength: number): void;
    showFeedback(result: 'tooShort' | 'tooLong', selectedLength: number, correctLength: number): void;
    showCrossing(correctLength: number): void;
    lock(): void;
    destroy(): void;
}


export class ChasmController implements Screen {
    private onDone?: (outcome: Outcome) => void;
    private hasPicked = false;
    private stopped = false;
    private pendingIndex: number | null = null;
    private showingCrossing = false;
    private wasCorrect = false;


    constructor(private readonly screen: ChasmView,
        private readonly chasm: Chasm
    ) {}

    start(onDone: (outcome: Outcome) => void): void {
        this.onDone = onDone;

        this.screen.draw();
        this.screen.onLogClicked((index) => {
            this.handlePick(index);
        });

        this.screen.onChoiceSelected((index) => {
            if (this.pendingIndex === null || index !== 0) return;

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
    }

    private handlePick(index: number): void {
        if (this.stopped || this.hasPicked) {
            return; // Ignore clicks if already picked
        }

        this.hasPicked = true;

        const result = checkPick(this.chasm, index);

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

}