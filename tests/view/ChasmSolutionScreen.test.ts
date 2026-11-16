import { describe, it, expect } from 'vitest';
import Konva from 'konva';
import { ChasmSolutionScreen } from '../../src/view/ChasmSolutionScreen';
import type { Layers } from '../../src/view/stage';
import { colors } from '../../src/view/theme';

describe('ChasmSolutionScreen', () => {
    function createTestScreen() {
        const layers: Layers = {
            background: new Konva.Layer(),
            sprites: new Konva.Layer(),
            ui: new Konva.Layer(),
            
        };
        

        const chasm = {
            a: 5,
            b: 12,
            c: 13,
            logs: [10, 13, 15],
            correct: 1,
        };

        const steps = [
            '5² + 12² = c²',
            '25 + 144 = 169',
            'c² = 169',
            'c = 13',
        ];

        const screen = new ChasmSolutionScreen(
            layers,
            chasm,
            steps
        );

        return { screen, layers };
    }
    it('draws the solution screen', () => {
        const { screen, layers } = createTestScreen();
    
        screen.draw();
    
        expect(layers.ui.getChildren().length).toBeGreaterThan(0);
    });
    it('shows the solution screen', () => {
        const { screen, layers } = createTestScreen();
    
        screen.draw();
        screen.show();
    
        const controls = layers.ui.findOne('.solution-screen');
        expect(controls).toBeDefined();
        expect(controls?.visible()).toBe(true);
    });
    
    it('hides the solution screen', () => {
        const { screen, layers } = createTestScreen();
    
        screen.draw();
        screen.show();
        screen.hide();
    
        const controls = layers.ui.findOne('.solution-screen');
        expect(controls).toBeDefined();
        expect(controls?.visible()).toBe(false);
    });
    
    it('destroys the solution screen', () => {
        const { screen, layers } = createTestScreen();
    
        screen.draw();
    
        const controls = layers.ui.findOne('.solution-screen');
        expect(controls).toBeDefined();
        screen.destroy();
    
        expect(layers.ui.findOne('.solution-screen')).toBeUndefined();
    });
    it('calls the crossing callback when the button is clicked', () => {
        const { screen, layers } = createTestScreen();
    
        let called = false;
    
        screen.onContinueClicked(() => {
            called = true;
        });
    
        screen.draw();
    
        // Find the dialogue box's button container.
        const buttonContainer = layers.ui.findOne('.dialog-buttons');
    
        expect(buttonContainer).toBeInstanceOf(Konva.Group);
        
        if (buttonContainer instanceof Konva.Group) {
            const button = buttonContainer.getChildren()[0];
            button.fire('click');
        }
        
        expect(called).toBe(true);
    });
    it('draws the solution title', () => {
        const { screen, layers } = createTestScreen();
    
        screen.draw();
    
        const title = layers.ui.findOne('.solution-title');
    
        expect(title).toBeInstanceOf(Konva.Text);

        if (title instanceof Konva.Text) {
            expect(title.text()).toBe('Find the diagonal, c');
        }
    });
    it('draws the steps box', () => {
        const { screen, layers } = createTestScreen();
    
        screen.draw();
    
        const box = layers.ui.findOne('.steps-box');

        expect(box).toBeInstanceOf(Konva.Rect);

        if (box instanceof Konva.Rect) {
            expect(box.fill()).toBe(colors.white);
        }
    });

});