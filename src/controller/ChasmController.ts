import type { Screen, Outcome } from './Screen';



export interface ChasmView {
    draw(): void;
    onLogClicked(cb: (index: number) => void): void;
    lock(): void;
    destroy(): void;
}


export class ChasmController implements Screen {
    private onDone?: (outcome: Outcome) => void;
    private hasPicked = false;
    private stopped = false;


    constructor(private readonly screen: ChasmView) {

    }

    start(onDone: (outcome: Outcome) => void): void {
        this.onDone = onDone;

        this.screen.draw();
        this.screen.onLogClicked((index) => {
            this.handlePick(index);
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

        this.screen.lock();

        this.onDone?.({
            kind: 'choice',
            index
        });
    }

}