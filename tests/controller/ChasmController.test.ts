import { describe, it, expect, vi } from 'vitest';
import {ChasmController, type ChasmView, type ChasmSolutionView } from '../../src/controller/ChasmController';
import type { Outcome } from '../../src/controller/Screen';

const chasm = {
    a: 3,
    b: 4,
    c: 5,
    logs: [4,5,6],
    correct: 1
};

// Imitation of ChasmScreen for testing purposes
class FakeChasmScreen implements ChasmView {
    drawCalled = false;
    lockCalled = false;
    destroyCalled = false;
    private choiceCallback?: (index: number) => void;
    private logCallback?: (index: number) => void;
    feedback: {result: 'tooShort' | 'tooLong';
        selectedLength: number;
        correctLength: number;
    } | null = null;
    correctFeedback: number | null = null;
    crossingFeedback: number | null = null;



    draw() {
        this.drawCalled = true;
    }

    onLogClicked(cb: (index : number) => void) {
        this.logCallback = cb;
    }

    showFeedback(result: 'tooShort' | 'tooLong', selectedLength: number, correctLength: number): void {
        this.feedback = { result, selectedLength, correctLength };
    }

    onChoiceSelected(cb: (index : number) => void): void {
        this.choiceCallback = cb;
    }
    lock() {
        this.lockCalled = true;
    }
    destroy() {
        this.destroyCalled = true;
    }

    clickLog(index: number) {
        this.logCallback?.(index);
    }

    clickChoice(index: number) {
        this.choiceCallback?.(index);
    }

    showCorrectFeedback(correctLength: number): void {
        this.correctFeedback = correctLength;
    }
    showCrossing(correctLength: number): void {
        this.crossingFeedback = correctLength;
    }
}
class FakeChasmSolutionScreen implements ChasmSolutionView {
    drawCalled = false;
    showCalled = false;
    hideCalled = false;
    destroyCalled = false;
    private continueCallback?: () => void;

    draw(): void {
        this.drawCalled = true;
    }

    onContinueClicked(cb: () => void): void {
        this.continueCallback = cb;
    }

    show(): void {
        this.showCalled = true;
    }

    hide(): void {
        this.hideCalled = true;
    }

    destroy(): void {
        this.destroyCalled = true;
    }

    clickContinue(): void {
        this.continueCallback?.();
    }
}

describe('ChasmController', () => {
    it('draws the screen when started', () => {
        const screen = new FakeChasmScreen();
        const solutionScreen = new FakeChasmSolutionScreen();
        const controller = new ChasmController(screen, solutionScreen, chasm);

        controller.start(vi.fn());

        expect(screen.drawCalled).toBe(true);
    });

    it('reports the selected log index', () => {
        const screen = new FakeChasmScreen();
        const solutionScreen = new FakeChasmSolutionScreen();
        const controller = new ChasmController(screen, solutionScreen, chasm);
        const onDone = vi.fn();
    
        controller.start(onDone);
        screen.clickLog(1);
    
        expect(onDone).not.toHaveBeenCalled();
    
        screen.clickChoice(0);
    
        expect(onDone).toHaveBeenCalledWith({
            kind: 'choice',
            index: 1
        });
    });
    it('only accepts the first log picked', () => {
        const screen = new FakeChasmScreen();
        const solutionScreen = new FakeChasmSolutionScreen();
const   controller = new ChasmController(screen, solutionScreen, chasm);
        const onDone = vi.fn();
    
        controller.start(onDone);
    
        screen.clickLog(0); // Too short
        screen.clickLog(1); // Correct
        screen.clickLog(2); // Too long
    
        // Feedback should still correspond to the first selection
        expect(screen.feedback).toEqual({
            result: 'tooShort',
            selectedLength: 4,
            correctLength: 5
        });
    
        // Game should not advance before Continue
        expect(onDone).not.toHaveBeenCalled();
    });
    it('destroys the screen when stopped', () => {
        const screen = new FakeChasmScreen();
        const solutionScreen = new FakeChasmSolutionScreen();
        const controller = new ChasmController(screen, solutionScreen, chasm);

        controller.start(() => {});
        controller.stop();
        // The screen should be destroyed once stop is called
        expect(screen.destroyCalled).toBe(true);
        expect(solutionScreen.destroyCalled).toBe(true);
    });
    it('does not report selections after stopping', () => {
        const screen = new FakeChasmScreen();
        const solutionScreen = new FakeChasmSolutionScreen();
        const controller = new ChasmController(screen, solutionScreen, chasm);

        let result: Outcome | undefined;

        controller.start((outcome) => {
            result = outcome;
        });

        controller.stop();
        screen.clickLog(1);
        // After calling stop inputs should no longer be reported
        expect(result).toBeUndefined();
    });
    it('displays feedback when a log is too short', () => {
        const screen = new FakeChasmScreen();
        const solutionScreen = new FakeChasmSolutionScreen();
        const controller = new ChasmController(screen, solutionScreen, chasm);
        const onDone = vi.fn();

        controller.start(onDone);
        screen.clickLog(0);

        expect(screen.feedback).toEqual({
            result: 'tooShort',
            selectedLength: 4,
            correctLength: 5
        });
        expect(onDone).not.toHaveBeenCalled();
        expect(screen.lockCalled).toBe(false);
        expect(screen.feedback).toEqual({
            result: 'tooShort',
            selectedLength: 4,
            correctLength: 5
        });
    });
    it('displays feedback when a log is too long', () => {
        const screen = new FakeChasmScreen();
        const solutionScreen = new FakeChasmSolutionScreen();
        const controller = new ChasmController(screen, solutionScreen, chasm);
        const onDone = vi.fn();
    
        controller.start(onDone);
        screen.clickLog(2);
    
        expect(screen.feedback).toEqual({
            result: 'tooLong',
            selectedLength: 6, 
            correctLength: 5
        });
    
        expect(onDone).not.toHaveBeenCalled();
    });
    it('reports the original selection after Continue is clicked', () => {
        const screen = new FakeChasmScreen();
        const solutionScreen = new FakeChasmSolutionScreen();
        const controller = new ChasmController(screen, solutionScreen, chasm);
        const onDone = vi.fn();
    
        controller.start(onDone);
    
        screen.clickLog(0);

        screen.clickChoice(0);

        expect(onDone).not.toHaveBeenCalled();

        screen.clickChoice(0);

        expect(onDone).toHaveBeenCalledWith({
            kind: 'choice',
            index: 0
        });
    });
    it('does not advance when Continue is clicked without a selection', () => {
        const screen = new FakeChasmScreen();
        const solutionScreen = new FakeChasmSolutionScreen();
        const controller = new ChasmController(screen, solutionScreen, chasm);
        const onDone = vi.fn();
    
        controller.start(onDone);
    
        screen.clickChoice(0);
    
        expect(onDone).not.toHaveBeenCalled();
    });

    it('displays feedback when a log is correct', () => {
        const screen = new FakeChasmScreen();
        const solutionScreen = new FakeChasmSolutionScreen();
        const controller = new ChasmController(screen, solutionScreen, chasm);
        const onDone = vi.fn();
    
        controller.start(onDone);
        screen.clickLog(1);
    
        expect(screen.correctFeedback).toBe(5);
        expect(onDone).not.toHaveBeenCalled();
    });
    it('reports the correct selection after Continue is clicked', () => {
        const screen = new FakeChasmScreen();
        const solutionScreen = new FakeChasmSolutionScreen();
        const controller = new ChasmController(screen, solutionScreen, chasm);
        const onDone = vi.fn();
    
        controller.start(onDone);
        screen.clickLog(1);
    
        screen.clickChoice(0);
    
        expect(onDone).toHaveBeenCalledWith({
            kind: 'choice',
            index: 1
        });
    });
    it('displays crossing confirmation with the correct log length', () => {
        const screen = new FakeChasmScreen();
        const solutionScreen = new FakeChasmSolutionScreen();
        const controller = new ChasmController(screen, solutionScreen, chasm);
    
        controller.start(vi.fn());
        screen.clickLog(0); // Incorrect log
    
        screen.clickChoice(0); // Choose to cross using correct log
    
        expect(screen.crossingFeedback).toBe(5);
    });
    it('opens the solution screen and returns to crossing after Continue', () => {
        const screen = new FakeChasmScreen();
        const solutionScreen = new FakeChasmSolutionScreen();
        const controller = new ChasmController(screen, solutionScreen, chasm);
        const onDone = vi.fn();
    
        controller.start(onDone);
    
        // Player initially picks an incorrect log
        screen.clickLog(0);
    
        // Player chooses to see the solution
        screen.clickChoice(1);
    
        expect(solutionScreen.showCalled).toBe(true);
        expect(onDone).not.toHaveBeenCalled();
    
        // Player presses Continue on the solution screen
        solutionScreen.clickContinue();
    
        expect(solutionScreen.hideCalled).toBe(true);
        expect(screen.crossingFeedback).toBe(5);
        expect(onDone).not.toHaveBeenCalled();
    
        // Player continues after seeing the crossing screen
        screen.clickChoice(0);
    
        expect(onDone).toHaveBeenCalledWith({
            kind: 'choice',
            index: 0
        });
    });
});