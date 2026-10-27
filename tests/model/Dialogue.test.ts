import { describe, expect, it } from 'vitest';
import { Dialogue, type DialogueLine } from '../../src/model/Dialogue';

const TRANSITION_MS = 300;

const script: DialogueLine[] = [
  { speaker: 'Narrator', text: 'You are a famous mountaineer.' },
  { speaker: 'Narrator', text: 'An avalanche hit during the trip.' },
  { speaker: 'Narrator', text: 'Pick the log that is exactly the right length.' },
];

/** Clicks once per transition, so every click is accepted. */
function clickThrough(dialogue: Dialogue, clicks: number): void {
  for (let i = 0; i < clicks; i++) dialogue.advance(i * TRANSITION_MS);
}

describe('Dialogue', () => {
  it('starts on the first box and is not finished', () => {
    const dialogue = new Dialogue(script, TRANSITION_MS);

    expect(dialogue.current()).toEqual(script[0]);
    expect(dialogue.isFinished()).toBe(false);
  });

  it('moves exactly one box per click', () => {
    const dialogue = new Dialogue(script, TRANSITION_MS);

    expect(dialogue.advance(0)).toBe(true);
    expect(dialogue.current()).toEqual(script[1]);
    expect(dialogue.advance(TRANSITION_MS)).toBe(true);
    expect(dialogue.current()).toEqual(script[2]);
    expect(dialogue.isFinished()).toBe(false);
  });

  it('finishes after a click on the last box and stays on it', () => {
    const dialogue = new Dialogue(script, TRANSITION_MS);
    clickThrough(dialogue, 2);

    expect(dialogue.advance(2 * TRANSITION_MS)).toBe(true);
    expect(dialogue.isFinished()).toBe(true);
    expect(dialogue.current()).toEqual(script[2]);
  });

  it('ignores clicks after it finishes', () => {
    const dialogue = new Dialogue(script, TRANSITION_MS);
    clickThrough(dialogue, 3);

    expect(dialogue.advance(10 * TRANSITION_MS)).toBe(false);
    expect(dialogue.current()).toEqual(script[2]);
  });

  it('finishes a one-box script after one click', () => {
    const dialogue = new Dialogue([script[0]], TRANSITION_MS);

    expect(dialogue.advance(0)).toBe(true);
    expect(dialogue.isFinished()).toBe(true);
  });

  it('ignores a fast second click during the transition', () => {
    const dialogue = new Dialogue(script, TRANSITION_MS);
    dialogue.advance(1000);

    expect(dialogue.advance(1000 + 50)).toBe(false);
    expect(dialogue.current()).toEqual(script[1]);
  });

  it('accepts a click exactly when the transition ends', () => {
    const dialogue = new Dialogue(script, TRANSITION_MS);
    dialogue.advance(1000);

    expect(dialogue.advance(1000 + TRANSITION_MS - 1)).toBe(false);
    expect(dialogue.advance(1000 + TRANSITION_MS)).toBe(true);
    expect(dialogue.current()).toEqual(script[2]);
  });

  it('never skips a box over 200 rapid clicks', () => {
    const longScript: DialogueLine[] = Array.from({ length: 20 }, (_, i) => ({
      speaker: 'Narrator',
      text: `Box ${i + 1}`,
    }));
    const dialogue = new Dialogue(longScript, TRANSITION_MS);
    const shown = [dialogue.current().text];

    for (let i = 0; i < 200; i++) {
      if (dialogue.advance(i * 10)) shown.push(dialogue.current().text);
    }

    // Clicks every 10 ms over 1990 ms: one is accepted at 0, 300, ..., 1800 ms.
    expect(shown).toEqual(longScript.slice(0, 8).map((line) => line.text));
  });

  it('passes the last box’s choices through unchanged', () => {
    const levelDone: DialogueLine[] = [
      {
        speaker: 'Narrator',
        text: 'You earned 80% of the points on Level 1.',
        choices: ['Begin level 1 again', 'Continue on to next level'],
      },
    ];
    const dialogue = new Dialogue(levelDone, TRANSITION_MS);

    expect(dialogue.current().choices).toEqual(['Begin level 1 again', 'Continue on to next level']);
  });

  it('throws on an empty script', () => {
    expect(() => new Dialogue([], TRANSITION_MS)).toThrow();
  });

  it('throws on a negative transition', () => {
    expect(() => new Dialogue(script, -1)).toThrow();
  });
});
