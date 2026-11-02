import { describe, it, expect } from 'vitest';
import {ChasmController, type ChasmView } from '../../src/controller/ChasmController';
import type { Outcome } from '../../src/controller/Screen';


// Imitation of ChasmScreen for testing purposes
class FakeChasmScreen implements ChasmView {
    drawCalled = false;
    lockCalled = false;
    destroyCalled = false;

    private clickCallback?: (index: number) => void;

    draw() {
        this.drawCalled = true;
    }

    onLogClicked(cb: (index : number) => void) {
        this.clickCallback = cb;
    }

    lock() {
        this.lockCalled = true;
    }
    destroy() {
        this.destroyCalled = true;
    }

    clickLog(index: number) {
        this.clickCallback?.(index);
    }
}

describe('ChasmController', () => {
    it('draws the screen when started', () => {
        const screen = new FakeChasmScreen();
        const controller = new ChasmController(screen);

        controller.start(() => {});

        expect(screen.drawCalled).toBe(true);
    });

    it('reports the selected log index', () => {
        const screen = new FakeChasmScreen();
        const controller = new ChasmController(screen);

        let result: Outcome | undefined;

        controller.start((outcome) => {
            result = outcome;
        });

        screen.clickLog(2);

        // The reported result should have the right index
        expect(result).toEqual({
            kind: 'choice',
            index: 2,
        });
        // The screen should be locked once start and handlePick are called
        expect(screen.lockCalled).toBe(true);

    });
    it('only accepts the first log picked', () => {
        const screen = new FakeChasmScreen();
        const controller = new ChasmController(screen);

        const results: Outcome[] = [];

        controller.start((outcome) => {
            results.push(outcome);
        });

        screen.clickLog(0);
        screen.clickLog(1);
        screen.clickLog(2);

        // Results should only have the first call index 0 (no overwritting)
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({
            kind: 'choice',
            index: 0,
        });
        expect(screen.lockCalled).toBe(true);
    });
    it('destroys the screen when stopped', () => {
        const screen = new FakeChasmScreen();
        const controller = new ChasmController(screen);

        controller.start(() => {});
        controller.stop();
        // The screen should be destroyed once stop is called
        expect(screen.destroyCalled).toBe(true);
    });
    it('does not report selections after stopping', () => {
        const screen = new FakeChasmScreen();
        const controller = new ChasmController(screen);

        let result: Outcome | undefined;

        controller.start((outcome) => {
            result = outcome;
        });

        controller.stop();
        screen.clickLog(1);
        // After calling stop inputs should no longer be reported
        expect(result).toBeUndefined();
    });
});