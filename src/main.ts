// Entry point and the only place that wires the game together: it builds the stage,
// views and controllers and starts GameFlow. Until those land, it draws a placeholder.
import Konva from 'konva';

const WIDTH = 960;
const HEIGHT = 540;

const stage = new Konva.Stage({ container: 'game', width: WIDTH, height: HEIGHT });
const layer = new Konva.Layer();

layer.add(
  new Konva.Text({
    text: 'The Math Mountaineer',
    width: WIDTH,
    height: HEIGHT,
    align: 'center',
    verticalAlign: 'middle',
    fontSize: 40,
  }),
);
stage.add(layer);
