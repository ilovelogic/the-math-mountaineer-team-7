import { describe, expect, it } from 'vitest';
import { dialogueScripts } from '../../src/content/dialogueScripts';
import { steps, TOPIC_3D, type Step } from '../../src/content/levels';
import { settings } from '../../src/content/settings';
import { medalFor } from '../../src/model/medals';
import { makeChasm, triplesByLevel } from '../../src/model/problems';

type ChasmStep = Extract<Step, { kind: 'chasm' }>;
const chasmSteps = steps.filter((step): step is ChasmStep => step.kind === 'chasm');

describe('content/levels', () => {
  it('opens with the intro, the crossing tutorial, then the supply shop and its duel (#134, #192)', () => {
    expect(steps.slice(0, 4)).toEqual([
      { kind: 'dialogue', script: 'intro' },
      { kind: 'dialogue', script: 'howCrossingWorks' },
      { kind: 'shopOffer', shop: 'supplies' },
      { kind: 'shopGame', shop: 'supplies' },
    ]);
  });

  it('puts the supply shop before Level 1’s chasms, so winning its duel can skip them', () => {
    const duel = steps.findIndex((step) => step.kind === 'shopGame' && step.shop === 'supplies');
    expect(duel).toBeLessThan(steps.indexOf(chasmSteps[0]));
  });

  it('ends with the medal', () => {
    expect(steps.at(-1)).toEqual({ kind: 'medal' });
  });

  // #193: a game plays 3 of each level's 5 triangles, so a full game is 9 chasms.
  it('has 3 chasm steps per level, numbered 0 to 2', () => {
    for (let level = 1; level <= triplesByLevel.length; level++) {
      const indices = chasmSteps.filter((step) => step.level === level).map((step) => step.index);
      expect(indices).toEqual([0, 1, 2]);
    }
  });

  it('plays 9 chasms in a full game', () => {
    expect(chasmSteps).toHaveLength(9);
  });

  it('gives diamond for getting every chasm right', () => {
    const perfectPoints = chasmSteps.length * settings.pointsPerChasm;
    expect(perfectPoints).toBe(settings.medalLimits.diamond);
    expect(medalFor(perfectPoints, settings.medalLimits)).toBe('diamond');
  });

  it('makes skipping Level 1 worth a perfect Level 1', () => {
    const levelOneChasms = chasmSteps.filter((step) => step.level === 1).length;
    expect(settings.pointsPerSkippedLevel).toBe(levelOneChasms * settings.pointsPerChasm);
  });

  it('follows every level but the last with its Level done step, and the last with the reunion (#204)', () => {
    const lastLevel = triplesByLevel.length;
    for (let level = 1; level <= lastLevel; level++) {
      const lastChasm = steps.lastIndexOf(chasmSteps.filter((step) => step.level === level).at(-1)!);
      const next = steps[lastChasm + 1];
      expect(next).toEqual(level === lastLevel ? { kind: 'dialogue', script: 'reunion' } : { kind: 'levelDone', level });
    }
  });

  it('offers the clothing shop and its zipline once, right as Level 2 starts (#64)', () => {
    const levelOneDone = steps.findIndex((step) => step.kind === 'levelDone' && step.level === 1);
    expect(steps.slice(levelOneDone + 1, levelOneDone + 4)).toEqual([
      { kind: 'shopOffer', shop: 'clothing' },
      { kind: 'shopGame', shop: 'clothing', topic: TOPIC_3D },
      { kind: 'chasm', level: 2, topic: chasmSteps[0].topic, index: 0 },
    ]);
    const clothingSteps = steps.filter((step) => (step.kind === 'shopOffer' || step.kind === 'shopGame') && step.shop === 'clothing');
    expect(clothingSteps).toHaveLength(2);
  });

  it('reunites the player with their friend in a single box, right before the medal (#204)', () => {
    expect(steps.slice(-2)).toEqual([{ kind: 'dialogue', script: 'reunion' }, { kind: 'medal' }]);
    expect(dialogueScripts.reunion).toHaveLength(1);
    expect(dialogueScripts.reunion[0]).not.toHaveProperty('choices');
  });

  it('gives every chasm step a topic and a problem makeChasm can build', () => {
    for (const step of chasmSteps) {
      expect(step.topic).not.toBe('');
      expect(() => makeChasm(0, step.level, step.index)).not.toThrow();
    }
  });
});

// Optional documentation
// - steps.slice(-2): the last two steps; a negative start counts back from the end.
// - expect(object).not.toHaveProperty('choices'): passes if the box has no choices, so it gets the plain Continue button.
