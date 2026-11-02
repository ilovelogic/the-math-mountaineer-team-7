import Konva from 'konva';
import { beforeEach, describe, expect, it } from 'vitest';
import { dialogueScripts } from '../../src/content/dialogueScripts';
import { settings } from '../../src/content/settings';
import { DialogueController } from '../../src/controller/DialogueController';
import type { Outcome } from '../../src/controller/Screen';
import type { DialogueLine } from '../../src/model/Dialogue';
import type { Layers } from '../../src/view/stage';

/**
 * Checks issue #18: the controller plays a scene one box per click, ignores clicks
 * during the change between boxes, and tells GameFlow once when the scene ends. The
 * screen is drawn into three bare layers, clicks are faked with `fire('click')`, and
 * the controller gets a fake clock, so no browser or real waiting is needed.
 */

const script: DialogueLine[] = [
  { speaker: 'Narrator', text: 'You are a famous mountaineer.' },
  { speaker: 'Narrator', text: 'An avalanche hit during the trip.' },
];

let layers: Layers;
let time: number;
let outcomes: Outcome[];

beforeEach(() => {
  layers = { background: new Konva.Layer(), sprites: new Konva.Layer(), ui: new Konva.Layer() };
  time = 0;
  outcomes = [];
});

/** Starts a controller for `lines` that reads the fake clock. */
function play(lines: readonly DialogueLine[]): DialogueController {
  const controller = new DialogueController(layers, lines, () => time);
  controller.start((outcome) => outcomes.push(outcome));
  return controller;
}

const shownText = () => layers.ui.find<Konva.Text>('Text')[0].text();
const button = (label: string) =>
  layers.ui.findOne<Konva.Text>((node: Konva.Node) => node instanceof Konva.Text && node.text() === label)!.getParent()!;

/** Clicks a button after the transition has passed, so the click always counts. */
function clickLater(label: string): void {
  time += settings.dialogueTransitionMs;
  button(label).fire('click');
}

describe('controller/DialogueController', () => {
  it('starts on the first box', () => {
    play(script);
    expect(shownText()).toBe(script[0].text);
  });

  it('moves exactly one box per Continue', () => {
    play(script);
    clickLater('Continue');
    expect(shownText()).toBe(script[1].text);
    expect(outcomes).toEqual([]);
  });

  it('ignores a second click during the change between boxes', () => {
    play(script);
    clickLater('Continue');
    time += settings.dialogueTransitionMs - 1;
    button('Continue').fire('click');
    expect(shownText()).toBe(script[1].text);
    expect(outcomes).toEqual([]);
  });

  it('reports the scene done once, after the last box', () => {
    play(script);
    clickLater('Continue');
    clickLater('Continue');
    clickLater('Continue');
    expect(outcomes).toEqual([{ kind: 'done' }]);
  });

  it('plays the intro script through to the end', () => {
    play(dialogueScripts.intro);
    const shown = [shownText()];
    for (let i = 1; i < dialogueScripts.intro.length; i++) {
      clickLater('Continue');
      shown.push(shownText());
    }
    clickLater('Continue');
    expect(shown).toEqual(dialogueScripts.intro.map((line) => line.text));
    expect(outcomes).toEqual([{ kind: 'done' }]);
  });

  it('reports the picked choice when the last box has choices, like Level done', () => {
    play([
      { speaker: 'Narrator', text: 'You earned 80% of the points on Level 1.' },
      { speaker: 'Narrator', text: 'Do you want to restart Level 1?', choices: ['Begin level 1 again', 'Continue on to next level'] },
    ]);
    clickLater('Continue');
    clickLater('Continue on to next level');
    clickLater('Begin level 1 again');
    expect(outcomes).toEqual([{ kind: 'choice', index: 1 }]);
  });

  it('ignores a choice clicked during the change onto its box', () => {
    play([
      { speaker: 'Narrator', text: 'Level 1 done.' },
      { speaker: 'Narrator', text: 'Restart?', choices: ['Begin level 1 again', 'Continue on to next level'] },
    ]);
    clickLater('Continue');
    button('Begin level 1 again').fire('click');
    expect(outcomes).toEqual([]);
    clickLater('Continue on to next level');
    expect(outcomes).toEqual([{ kind: 'choice', index: 1 }]);
  });

  it('never reports after it is stopped', () => {
    const controller = play(script);
    clickLater('Continue');
    const last = button('Continue');
    controller.stop();
    time += settings.dialogueTransitionMs;
    last.fire('click');
    expect(outcomes).toEqual([]);
  });

  it('removes everything it drew when stopped', () => {
    const controller = play(script);
    controller.stop();
    for (const layer of Object.values(layers)) expect(layer.getChildren()).toHaveLength(0);
  });
});

// Optional documentation
// - () => time: the fake clock; each test moves `time` forward itself instead of waiting.
// - outcomes.push(outcome): records every report, so a test can check it came exactly once.
// - layer.find<Konva.Text>('Text')[0]: the first text in the box, which is the line; the button labels come after it.
// - node.fire('click'): runs the node's click handlers as if it had been clicked, without a real mouse.
// - Object.values(layers): the three layers as an array, so one loop checks them all.
