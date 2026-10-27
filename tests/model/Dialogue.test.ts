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

  it('moves exactly one box per click', () => {
    const dialogue = new Dialogue(script, TRANSITION_MS);

    expect(dialogue.advance()).toBe(true);
    expect(dialogue.current()).toEqual(script[1]);
    expect(dialogue.advance()).toBe(true);
    expect(dialogue.current()).toEqual(script[2]);
    expect(dialogue.isFinished()).toBe(false);
  });

  it('finishes after a click on the last box and stays on it', () => {
    const dialogue = new Dialogue(script, TRANSITION_MS);
    dialogue.advance();
    dialogue.advance();

    expect(dialogue.advance()).toBe(true);
    expect(dialogue.isFinished()).toBe(true);
    expect(dialogue.current()).toEqual(script[2]);
  });

  it('ignores clicks after it finishes', () => {
    const dialogue = new Dialogue(script, TRANSITION_MS);
    dialogue.advance();
    dialogue.advance();
    dialogue.advance();

    expect(dialogue.advance()).toBe(false);
    expect(dialogue.current()).toEqual(script[2]);
  });

  it('finishes a one-box script after one click', () => {
    const dialogue = new Dialogue([script[0]], TRANSITION_MS);

    expect(dialogue.advance()).toBe(true);
    expect(dialogue.isFinished()).toBe(true);
  });

  it('throws on an empty script', () => {
    expect(() => new Dialogue([], TRANSITION_MS)).toThrow();
  });

  it('throws on a negative transition', () => {
    expect(() => new Dialogue(script, -1)).toThrow();
  });
});
