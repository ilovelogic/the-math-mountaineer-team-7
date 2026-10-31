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



// Pixel-style mountain background

const mountainPeaks = [

  250, 250, 210, 210, 170, 170,

  130, 130, 200, 200, 90, 90,

  160, 160, 200, 200, 160, 160,

  230, 230, 270, 270, 250, 250,

];



mountainPeaks.forEach((top, i) => {

  screen.add(

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

  screen.add(

    new Konva.Rect({

      x: i * 40,

      y: mountainPeaks[i],

      width: 40,

      height: 12,

      fill: colors.white,

    }),

  );

});    



// Dark top bar

screen.add(

  new Konva.Rect({

    x: 0,

    y: 0,

    width: STAGE_WIDTH,

    height: 48,

    fill: colors.ink,

  }),

);

// Text displayed in the top bar
screen.add(
  new Konva.Text({
    ...text.heading,
    x: 24,
    y: 0,
    height: 48,
    verticalAlign: 'middle',
    text: 'Math Mountaineer',
    fill: colors.white,
  }),
  new Konva.Text({
    ...text.label,
    x: STAGE_WIDTH - 200,
    y: 0,
    width: 176,
    height: 48,
    align: 'right',
    verticalAlign: 'middle',
    text: `Points: ${data.points}`,
    fill: colors.white,
  }),
);




const medalColors = {

        diamond: colors.ice,

        gold: colors.gold,

        silver: colors.silver,

        bronze: colors.bronze,

        none: colors.mutedText,

    };



// Medal ribbons

screen.add(

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

// White results panel

screen.add(

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

    

    screen.add(

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



screen.add(resultsButton);


// Medal requirements from Figma
screen.add(
  new Konva.Text({
    ...text.label,
    x: 310, y: 454, width: 620,
    text: 'Medal requirements',
  }),
  new Konva.Text({
    ...text.body,
    x: 310, y: 478, width: 620,
    fontSize: 14,
    text: 'Diamond: 100%   |   Gold: 90–99%   |   Silver: 70–89%',
  }),
  new Konva.Text({
    ...text.body,
    x: 310, y: 502, width: 620,
    fontSize: 14,
    text: 'Bronze: 50–69%   |   No medal: below 50%',
  }),
);

layers.ui.add(screen);



    return () => {

        screen.destroy();

    };

}
