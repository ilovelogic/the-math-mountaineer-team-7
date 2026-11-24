import Konva from 'konva';
import type { Layers } from './stage';
import { STAGE_WIDTH, STAGE_HEIGHT } from './stage';
import { colors, text } from './theme';
import type { LevelResult } from '../model/PlayerProgress';

export interface ResultsScreenData {
    levelResults: LevelResult[];
    worthReviewing: { level: number; topic: string } | null;
}

export function drawResultsScreen(
    layers: Layers,
    data: ResultsScreenData,
  ): () => void {
    const scenery = new Konva.Group();
    const panel = new Konva.Group();
  
    // Same sky background as the medal screen
    scenery.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width: STAGE_WIDTH,
        height: STAGE_HEIGHT,
        fill: colors.skyDay,
      }),
    );
    // Pixel-style mountain background
    const mountainPeaks = [
      250, 250, 210, 210, 170, 170,
      130, 130, 200, 200, 90, 90,
      160, 160, 200, 200, 160, 160,
      230, 230, 270, 270, 250, 250,
    ];
  
    mountainPeaks.forEach((top, i) => {
      scenery.add(
        new Konva.Rect({
          x: i * 40,
          y: top,
          width: 40,
          height: 370 - top,
          fill: colors.ice,
        }),
      );
    });
  
    // Snow caps on mountain peaks
    [3, 6, 10, 13, 17].forEach((i) => {
      scenery.add(
        new Konva.Rect({
          x: i * 40,
          y: mountainPeaks[i],
          width: 40,
          height: 12,
          fill: colors.white,
        }),
      );
    });
  
    // White results box
    panel.add(
      new Konva.Rect({
        x: 220,
        y: 70,
        width: 560,
        height: 230,
        fill: colors.white,
        cornerRadius: 20,
      })
    );
    // Results heading
    panel.add(
        new Konva.Text({
        ...text.heading,
        fontSize: 30,
        x: 250,
        y: 90,
        width: 500,
        align: 'left',
        text: 'Your Results',
        }),
    );
    
    // Individual level results
    data.levelResults.forEach((result, index) => {
        const levelText = result.skipped
        ? `Level ${result.level}: Skipped (you won the math duel)`
        : `Level ${result.level}: ${result.correct} of ${result.total} right`;
    
        panel.add(
        new Konva.Text({
            ...text.body,
            x: 250,
            y: 145 + index * 32,
            width: 500,
            align: 'left',
            text: levelText,
        }),
        );
    });
    
    // Worth reviewing at the bottom
    const reviewText = data.worthReviewing
        ? `Worth reviewing: Level ${data.worthReviewing.level} — ${data.worthReviewing.topic}`
        : 'Nothing to review: every pick was right!';
    
    panel.add(
        new Konva.Text({
        ...text.body,
        fill: colors.orange,
        fontStyle: data.worthReviewing ? 'normal' : 'bold',
        x: 250,
        y: 240,
        width: 540,
        align: 'left',
        text: reviewText,
        }),
    );

    layers.background.add(scenery);
    layers.ui.add(panel);

    return () => {
      scenery.destroy();
      panel.destroy();
    };
}