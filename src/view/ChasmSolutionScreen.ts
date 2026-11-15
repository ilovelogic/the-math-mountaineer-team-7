import Konva from 'konva';
import type { Layers } from './stage';
import { text, colors } from './theme';
import { createRightTriangle } from './components/rightTriangle';
import type { Chasm } from '../model/problems';
import { STAGE_WIDTH, STAGE_HEIGHT } from './stage';
import { createDialogBox } from './components/dialogBox';

export class ChasmSolutionScreen {
    private readonly controls = new Konva.Group({
        name: 'solution-screen',
    });
    private crossingCallback: (() => void) | null = null;
    private readonly prompt = createDialogBox((index) => {
        if (index === 0) {
            this.crossingCallback?.();
        }
    });

    constructor(
        private readonly layers: Layers,
        private readonly chasm: Chasm,
        private readonly steps: string[],
    ) {}

    draw(): void {
        this.controls.visible(false);
        this.drawBackground();
        this.drawTriangle();
        this.drawStepsBox();
        this.drawSteps();
        this.drawTitle();
        this.prompt.show(
            'Here is how to find the right log for this chasm.',
            ['Cross the chasm using the correct log']
        );
        
        this.controls.add(this.prompt.group);
        this.layers.ui.add(this.controls);


    }

    destroy(): void {
        this.controls.destroy();
    }

    show(): void {
        this.controls.visible(true);
    }

    hide(): void {
        this.controls.visible(false);
    }

    onContinueClicked(cb: () => void): void {
        this.crossingCallback = cb;
    }

    private drawBackground(): void {
        const background = new Konva.Rect({
            x: 0,
            y: 48,
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT - 48,
            fill: 'white',
        });
        this.controls.add(background);

        // Grid lines
        for (let x = 0; x <= STAGE_WIDTH; x += 20) {
            this.controls.add(new Konva.Line({
                points: [x, 48, x, STAGE_HEIGHT],
                stroke: '#DCE8F2',
                strokeWidth: 1,
            }));
        }

        for (let y = 48; y <= STAGE_HEIGHT; y += 20) {
            this.controls.add(new Konva.Line({
                points: [0, y, STAGE_WIDTH, y],
                stroke: '#DCE8F2',
                strokeWidth: 1,
            }));
        }

    }

    private drawTitle(): void {
        const title = new Konva.Text({
            ...text.heading,
            text: 'Find the diagonal, c',
            fontSize: 22,
            x: 80,
            y: 160,
            width: STAGE_WIDTH,
            align: 'center',
        });

        title.name('solution-title');
        this.controls.add(title);
    }

    private drawTriangle(): void {
        const triangle = createRightTriangle({
            width: 250,
            height: 190,
            a: {
                length: this.chasm.a,
                label: `${this.chasm.a} m`,
            },
            b: {
                length: this.chasm.b,
                label: `${this.chasm.b} m`,
            },
            c: `c = ${this.chasm.c} m`,
        });

        triangle.position({ x: 80, y: 150});
        this.controls.add(triangle);
    }

    private drawStepsBox(): void {
        const box = new Konva.Rect({
            x: 440,
            y: 150,
            width: 440,
            height: 200,
            fill: colors.white,
            stroke: colors.ink,
            strokeWidth: 2,
            cornerRadius: 8,
        });


        box.name('steps-box');
        this.controls.add(box);
    }

    private drawSteps(): void {
        this.steps.forEach((step, index) => {
            const y = 205 + index * 50;
    
            const circle = new Konva.Circle({
                x: 475,
                y: y + 12,
                radius: 16,
                fill: '#287C7B',
            });
            circle.name('step-circle');
    
            const number = new Konva.Text({
                text: `${index + 1}`,
                x: 459,
                y: y - 4,
                width: 32,
                height: 32,
                align: 'center',
                verticalAlign: 'middle',
                fill: colors.snow,
                fontSize: 18,
            });
    
            const equation = new Konva.Text({
                ...text.body,
                text: step,
                x: 510,
                y,
                fill: colors.ink,
            });
    
            this.controls.add(circle, number, equation);
        });
    }
}