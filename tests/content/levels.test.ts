import { describe, expect, it } from 'vitest';
import { steps, type Step } from '../../src/content/levels';
import { makeChasm, triplesByLevel } from '../../src/model/problems';

type ChasmStep = Extract<Step, { kind: 'chasm' }>;
const chasmSteps = steps.filter((step): step is ChasmStep => step.kind === 'chasm');

describe('content/levels', () => {
  it('opens with the title, the intro and the crossing tutorial', () => {
    expect(steps.slice(0, 3)).toEqual([
      { kind: 'title' },
      { kind: 'dialogue', script: 'intro' },
      { kind: 'dialogue', script: 'tutorial' },
    ]);
  });

  it('ends with the medal', () => {
    expect(steps.at(-1)).toEqual({ kind: 'medal' });
  });

  it('has one step per chasm, in order, for every triangle in each level', () => {
    triplesByLevel.forEach((triples, i) => {
      const level = i + 1;
      const indices = chasmSteps.filter((step) => step.level === level).map((step) => step.index);
      expect(indices).toEqual(triples.map((_, index) => index));
    });
  });

  it('follows every level but the last with its Level done step', () => {
    const lastLevel = triplesByLevel.length;
    for (let level = 1; level <= lastLevel; level++) {
      const lastChasm = steps.lastIndexOf(chasmSteps.filter((step) => step.level === level).at(-1)!);
      const next = steps[lastChasm + 1];
      expect(next).toEqual(level === lastLevel ? { kind: 'medal' } : { kind: 'levelDone', level });
    }
  });

  it('gives every chasm step a topic and a problem makeChasm can build', () => {
    for (const step of chasmSteps) {
      expect(step.topic).not.toBe('');
      expect(() => makeChasm(0, step.level, step.index)).not.toThrow();
    }
  });
});
