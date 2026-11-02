import Konva from 'konva';
import { beforeEach, describe, expect, it } from 'vitest';
import { DialogueBox } from '../../src/view/DialogueBox';
import type { Layers } from '../../src/view/stage';

/**
 * Checks what DialogueController relies on from the DialogueBox: it shows a line's
 * text with a Continue button, or the line's own choices when it has them, reports
 * a click by the button's position, and removes itself. The box is drawn into three
 * bare layers and clicks are faked with `fire('click')`, so no browser is needed.
 */

let layers: Layers;
let picks: number[];
let box: DialogueBox;

beforeEach(() => {
  layers = { background: new Konva.Layer(), sprites: new Konva.Layer(), ui: new Konva.Layer() };
  picks = [];
  box = new DialogueBox(layers, (index) => picks.push(index));
});

const texts = () => layers.ui.find<Konva.Text>('Text').map((node) => node.text());
const button = (label: string) =>
  layers.ui.findOne<Konva.Text>((node: Konva.Node) => node instanceof Konva.Text && node.text() === label)!.getParent()!;

describe('view/DialogueBox', () => {
  it('shows a line with no choices along with a Continue button', () => {
    box.show({ speaker: 'Narrator', text: 'You are a famous mountaineer.' });
    expect(texts()).toEqual(['You are a famous mountaineer.', 'Continue']);
  });

  it('shows a line’s own choices instead of Continue', () => {
    box.show({ speaker: 'Narrator', text: 'Restart Level 1?', choices: ['Begin level 1 again', 'Continue on to next level'] });
    expect(texts()).toEqual(['Restart Level 1?', 'Begin level 1 again', 'Continue on to next level']);
  });

  it('reports the position of the button that is clicked', () => {
    box.show({ speaker: 'Narrator', text: 'Restart Level 1?', choices: ['Begin level 1 again', 'Continue on to next level'] });
    button('Continue on to next level').fire('click');
    box.show({ speaker: 'Narrator', text: 'Next box.' });
    button('Continue').fire('click');
    expect(picks).toEqual([1, 0]);
  });

  it('removes everything it drew', () => {
    box.show({ speaker: 'Narrator', text: 'You are a famous mountaineer.' });
    box.destroy();
    expect(layers.ui.getChildren()).toHaveLength(0);
  });
});

// Optional documentation
// - beforeEach(fn): runs fn before every it(...), so each test starts with a fresh box and no picks.
// - layer.find<Konva.Text>('Text'): every text node inside the layer, in the order they were added.
// - findOne(fn)!.getParent()!: the button group around the label; `!` tells TypeScript the node is there.
// - node.fire('click'): runs the node's click handlers as if it had been clicked, without a real mouse.
