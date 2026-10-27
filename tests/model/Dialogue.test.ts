import { describe, expect, it } from 'vitest';
import { Dialogue, type DialogueLine } from '../../src/model/Dialogue';

const TRANSITION_MS = 300;

const script: DialogueLine[] = [
  { speaker: 'Narrator', text: 'You are a famous mountaineer.' },
  { speaker: 'Narrator', text: 'An avalanche hit during the trip.' },
  { speaker: 'Narrator', text: 'Pick the log that is exactly the right length.' },
];

describe('Dialogue', () => {
  it('starts on the first box and is not finished', () => {
    const dialogue = new Dialogue(script, TRANSITION_MS);

    expect(dialogue.current()).toEqual(script[0]);
    expect(dialogue.isFinished()).toBe(false);
  });

  it('throws on an empty script', () => {
    expect(() => new Dialogue([], TRANSITION_MS)).toThrow();
  });

  it('throws on a negative transition', () => {
    expect(() => new Dialogue(script, -1)).toThrow();
  });
});
