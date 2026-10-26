import Konva from 'konva';
import { createStage, STAGE_HEIGHT, STAGE_WIDTH } from './view/stage';

const layers = createStage('game').layers;

layers.ui.add(
  new Konva.Text({
    text: 'The Math Mountaineer',
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
    align: 'center',
    verticalAlign: 'middle',
    fontSize: 40,
  }),
);
// Appendix of relevant documentation
// - Konva.Text align: 'center' / verticalAlign: 'middle': centres the text within the box set by `width` and `height`.
