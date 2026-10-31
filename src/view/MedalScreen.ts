import Konva from 'konva';
import type { Layers } from './stage';
import { STAGE_WIDTH, STAGE_HEIGHT } from './stage';
import { colors, text } from './theme';
import { createButton } from './components/button';
export type MedalType =
    | 'diamond'
    | 'gold'
    | 'silver'
    | 'bronze'
    | 'none';

export interface MedalScreenData {
    medal: MedalType;
    points: number;
    onSeeResults: () => void;
}

export function drawMedalScreen(
    layers: Layers,
    data: MedalScreenData,
): () => void {
    const screen = new Konva.Group();

    screen.add(
        new Konva.Rect({
            x: 0,
            y: 0,
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            fill: colors.skyDay,
        }),
    );

    const medalColors = {
        diamond: colors.ice,
        gold: colors.gold,
        silver: colors.silver,
        bronze: colors.bronze,
        none: colors.mutedText,
    };
    screen.add(
        new Konva.Circle({
            x: STAGE_WIDTH / 2,
            y: 220,
            radius: 75,
            fill: medalColors[data.medal],
            stroke: colors.white,
            strokeWidth: 6,
        }),
    );

    screen.add(
        new Konva.Text({
            ...text.subtitle,
            x: 360,
            y: 205,
            width: 240,
            align: 'center',
            text: data.medal.toUpperCase(),
        }),
    );
    screen.add(
      new Konva.Text({
      ...text.body,
      x: 360,
      y: 315,
      width: 240,
      align: 'center',
      text: `Points: ${data.points}`,
    }),
  );
    
const resultsButton = createButton(
  'See Results',
  data.onSeeResults
);

resultsButton.position({
  x: 400,
  y: 400,
});

screen.add(resultsButton);
layers.ui.add(screen);

    return () => {
        screen.destroy();
    };
}
