import Konva from 'konva';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Layers } from '../../src/view/stage';
import { drawResultsScreen, type ResultsScreenData } from '../../src/view/ResultsScreen';

let layers: Layers;

beforeEach(() => {
  layers = {
    background: new Konva.Layer(),
    sprites: new Konva.Layer(),
    ui: new Konva.Layer(),
  };
});

const draw = (data: Partial<ResultsScreenData>) =>
  drawResultsScreen(layers, {
    levelResults: [
      { level: 1, correct: 3, total: 5 },
      { level: 2, correct: 4, total: 5 },
      { level: 3, correct: 2, total: 5 },
    ],
    worthReviewing: { level: 3, topic: 'Pythagorean theorem in 2D' },
    ...data,
  });

const texts = (layer: Konva.Layer) =>
  layer.find<Konva.Text>('Text').map((node) => node.text());

describe('drawResultsScreen', () => {
  it('displays the results heading', () => {
    draw({});
    expect(texts(layers.ui)).toContain('Your Results');
  });

  it('displays skipped levels correctly', () => {
    draw({
      levelResults: [
        { level: 1, correct: 0, total: 0, skipped: true },
      ],
    });
  
    expect(texts(layers.ui)).toContain(
      'Level 1: Skipped (you won the math duel)',
    );
  });

  it('displays the correct and total answers for played levels', () => {
    draw({});
  
    expect(texts(layers.ui)).toContain('Level 1: 3 of 5 right');
    expect(texts(layers.ui)).toContain('Level 2: 4 of 5 right');
    expect(texts(layers.ui)).toContain('Level 3: 2 of 5 right');
  });

  it('displays the topic worth reviewing', () => {
    draw({});
  
    expect(texts(layers.ui)).toContain(
      'Worth reviewing: Level 3 — Pythagorean theorem in 2D',
    );
  });

  it('displays a different level when that level is worth reviewing', () => {
    draw({
      worthReviewing: { level: 2, topic: 'Pythagorean theorem in 3D' },
    });
  
    expect(texts(layers.ui)).toContain(
      'Worth reviewing: Level 2 — Pythagorean theorem in 3D',
    );
  });

  it('displays a message when there is nothing to review', () => {
    draw({ worthReviewing: null });
  
    expect(texts(layers.ui)).toContain(
      'Nothing to review: every pick was right!',
    );
  });

  it('removes everything it drew when the screen ends', () => {
    const cleanUp = draw({});
  
    cleanUp();
  
    expect(layers.background.getChildren()).toHaveLength(0);
    expect(layers.ui.getChildren()).toHaveLength(0);
  });
});