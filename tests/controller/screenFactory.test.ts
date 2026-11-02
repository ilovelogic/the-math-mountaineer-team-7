import Konva from 'konva';
import { beforeEach, describe, expect, it } from 'vitest';
import { dialogueScripts } from '../../src/content/dialogueScripts';
import { ChasmController } from '../../src/controller/ChasmController';
import { DialogueController } from '../../src/controller/DialogueController';
import type { ScreenRequest } from '../../src/controller/GameFlow';
import { MedalController } from '../../src/controller/MedalController';
import { createScreenFactory } from '../../src/controller/screenFactory';
import type { Screen } from '../../src/controller/Screen';
import { PlayerProgress } from '../../src/model/PlayerProgress';
import { makeChasm } from '../../src/model/problems';
import type { Layers } from '../../src/view/stage';

/**
 * Checks issue #150: the factory turns each kind of step GameFlow asks for into the
 * right screen, with the right content, and a dialogue step naming a scene that doesn't
 * exist fails with a clear error. Each test builds the factory with three bare layers
 * instead of a real stage, starts the screen it returns, and reads back the text it
 * drew, so a wrong scene or wrong numbers fail even when the screen's type is right. No
 * browser is needed. Limit: whether the screens look right together, and the game plays
 * from start to finish, still needs a check in the browser with `npm run dev`.
 */

let layers: Layers;
let makeScreen: (request: ScreenRequest) => Screen;

beforeEach(() => {
  layers = { background: new Konva.Layer(), sprites: new Konva.Layer(), ui: new Konva.Layer() };
  makeScreen = createScreenFactory(layers, new PlayerProgress(1));
});

// Starts the screen the way GameFlow does, and gives back every piece of text it drew.
function startAndRead(screen: Screen): string[] {
  screen.start(() => {});
  const allLayers = [layers.background, layers.sprites, layers.ui];
  return allLayers.flatMap((layer) => layer.find<Konva.Text>('Text').map((node) => node.text()));
}

describe('createScreenFactory', () => {
  it('plays the title placeholder for the title step, with a Start button', () => {
    const screen = makeScreen({ kind: 'title' });
    expect(screen).toBeInstanceOf(DialogueController);
    expect(startAndRead(screen)).toEqual(expect.arrayContaining(['The Math Mountaineer', 'Start']));
  });

  it('plays the named scene for a dialogue step, starting at its first box', () => {
    const screen = makeScreen({ kind: 'dialogue', script: 'intro' });
    expect(screen).toBeInstanceOf(DialogueController);
    expect(startAndRead(screen)).toContain(dialogueScripts.intro[0].text);
  });

  it('throws a clear error for a dialogue step whose scene does not exist', () => {
    expect(() => makeScreen({ kind: 'dialogue', script: 'intr0' })).toThrow('There is no dialogue scene called "intr0".');
  });

  it('does not mistake a name every object has, like toString, for a scene', () => {
    expect(() => makeScreen({ kind: 'dialogue', script: 'toString' })).toThrow('There is no dialogue scene called "toString".');
  });

  it('draws the chasm it was given, with a button for each of its logs', () => {
    const chasm = makeChasm(1, 1, 0);
    const screen = makeScreen({ kind: 'chasm', chasm });
    expect(screen).toBeInstanceOf(ChasmController);
    const drawn = startAndRead(screen);
    for (const log of chasm.logs) expect(drawn, `log of ${log} m`).toContain(`${log} m`);
  });

  it('congratulates a player who earned every point on the level', () => {
    const screen = makeScreen({ kind: 'levelDone', level: 2, points: 50, possiblePoints: 50 });
    expect(screen).toBeInstanceOf(DialogueController);
    expect(startAndRead(screen)).toContain('Congratulations! You earned all the points on Level 2.');
  });

  it('offers a restart, with both buttons, when the player missed points on the level', () => {
    const drawn = startAndRead(makeScreen({ kind: 'levelDone', level: 1, points: 40, possiblePoints: 50 }));
    expect(drawn).toEqual(
      expect.arrayContaining([
        'Do you want to restart Level 1 so you can get closer to earning your desired medal?',
        'Begin level 1 again',
        'Continue on to next level',
      ]),
    );
  });

  it('shows the medal screen for the medal step', () => {
    const screen = makeScreen({ kind: 'medal', points: 0 });
    expect(screen).toBeInstanceOf(MedalController);
    expect(startAndRead(screen)).toContain('See Results');
  });

  it('builds a new screen for every request, so no two steps share one', () => {
    expect(makeScreen({ kind: 'title' })).not.toBe(makeScreen({ kind: 'title' }));
  });
});

// Optional documentation
// - describe(name, fn): groups related tests under a heading in the test output; Vitest calls fn right away to find the it(...) calls inside.
// - it(name, fn): registers one test; Vitest runs fn after collecting every test, and the test fails if anything inside fn throws.
// - beforeEach(fn): runs fn before every test, so each one starts with fresh layers and a fresh factory.
// - new Konva.Layer(): a layer that isn't on any stage, which is enough for screens to draw into and for tests to read back.
// - allLayers.flatMap(...): runs the function on each of the three layers and joins their lists into one, so text drawn on any layer is found.
// - layer.find<Konva.Text>('Text'): every Text node inside the layer, at any depth; `<Konva.Text>` tells TypeScript what kind of node they are.
// - expect(value).toBeInstanceOf(Class): passes if the value was made by that class, such as `new DialogueController(...)`.
// - expect(list).toEqual(expect.arrayContaining([...])): passes if every listed item appears in the list, in any order and among other items.
// - expect(list).toContain(item): passes if the list includes that exact item.
// - expect(() => ...).toThrow(message): runs the function and passes only if it throws an error with that message.
// - for (const log of chasm.logs): runs the check once for each log length.
// - expect(value, message): the message is shown if the check fails, here naming the log that wasn't drawn.
// - `${log} m`: a template string; the value inside ${ } is inserted into the text, matching the button's label such as "13 m".
// - expect(a).not.toBe(b): passes if a and b are not the very same object.
