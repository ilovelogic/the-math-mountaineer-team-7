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
  // The Hud draws the top bar on the ui layer, so the sky and mountains go on the
  // background layer and the medal on sprites, where they can't cover it.
  const scenery = new Konva.Group();
  const medal = new Konva.Group();
  const panel = new Konva.Group();

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

  const medalColors = {
    gold: colors.gold,
    silver: colors.silver,
    bronze: colors.bronze,
  };

  if (data.medal === 'none') {
    // Like "No medal" in the mockups' Medal requirements card: an empty dashed outline with no ribbons.
    medal.add(
      new Konva.Circle({
        x: STAGE_WIDTH / 2,
        y: 220,
        radius: 75,
        stroke: colors.mutedText,
        strokeWidth: 4,
        dash: [12, 10],
      }),
    );
  } else {
    // Medal ribbons
    medal.add(
      new Konva.Rect({
        x: 445,
        y: 110,
        width: 30,
        height: 100,
        fill: colors.teal,
      }),
      new Konva.Rect({
        x: 485,
        y: 110,
        width: 30,
        height: 100,
        fill: colors.orange,
      }),
    );

    if (data.medal === 'diamond') {
      // The mockups draw the diamond medal as an outlined diamond rather than a circle.
      medal.add(
        new Konva.RegularPolygon({
          x: STAGE_WIDTH / 2,
          y: 220,
          sides: 4,
          radius: 75,
          fill: colors.ice,
          stroke: colors.ink,
          strokeWidth: 3,
        }),
      );
    } else {
      medal.add(
        new Konva.Circle({
          x: STAGE_WIDTH / 2,
          y: 220,
          radius: 75,
          fill: medalColors[data.medal],
          stroke: colors.white,
          strokeWidth: 6,
        }),
      );
    }
  }

  // White results panel
  panel.add(
    new Konva.Rect({
      x: 0,
      y: 389,
      width: STAGE_WIDTH,
      height: 151,
      fill: colors.white,
      stroke: colors.ink,
      strokeWidth: 2,
    }),
  );

  panel.add(
    new Konva.Text({
      ...text.body,
      x: 30,
      y: 414,
      width: 900,
      align: 'left',
      text: data.medal === 'none'
        ? `You finished with ${data.points} points and earned no medal.`
        : `You finished with ${data.points} points and earned a ${data.medal} medal. Points decide the medal: diamond, gold, silver or bronze.`,
    }),
  );

  const resultsButton = createButton(
    'See Results',
    data.onSeeResults
  );

  resultsButton.position({
    x: 30,
    y: 475,
  });

  panel.add(resultsButton);

  // Medal requirements from Figma
  panel.add(
    new Konva.Text({
      ...text.label,
      x: 310, y: 454, width: 620,
      text: 'Medal requirements',
    }),
    new Konva.Text({
      ...text.body,
      x: 310, y: 478, width: 620,
      text: 'Diamond: 100%   |   Gold: 90–99%   |   Silver: 70–89%',
    }),
    new Konva.Text({
      ...text.body,
      x: 310, y: 502, width: 620,
      text: 'Bronze: 50–69%   |   No medal: below 50%',
    }),
  );

  layers.background.add(scenery);
  layers.sprites.add(medal);
  layers.ui.add(panel);

  return () => {
    scenery.destroy();
    medal.destroy();
    panel.destroy();
  };
}
