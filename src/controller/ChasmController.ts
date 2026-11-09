import type { Screen, Outcome } from './Screen';
import { checkPick, type Chasm } from '../model/problems'



export interface ChasmView {
    draw(): void;
    onLogClicked(cb: (index: number) => void): void;
    onChoiceSelected(cb: () => void): void;
    showFeedback(result: 'tooShort' | 'tooLong', selectedLength: number, correctLength: number): void;
    lock(): void;
    destroy(): void;
}


export class ChasmController implements Screen {
    private onDone?: (outcome: Outcome) => void;
    private hasPicked = false;
    private stopped = false;
    private pendingIndex: number | null = null;


    constructor(private readonly screen: ChasmView,
        private readonly chasm: Chasm
    ) {}

    start(onDone: (outcome: Outcome) => void): void {
        this.onDone = onDone;

        this.screen.draw();
        this.screen.onLogClicked((index) => {
            this.handlePick(index);
        });

        this.screen.onChoiceSelected(() => {
            if (this.pendingIndex === null) return;

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
            this.screen.lock();
            this.onDone?.({
                kind: 'choice',
                index
            });

            return;
        }
        this.pendingIndex = index;

        const selectedLength = this.chasm.logs[index];
        const correctLength = this.chasm.logs[this.chasm.correct];

        this.screen.showFeedback(result, selectedLength, correctLength);
    }

}