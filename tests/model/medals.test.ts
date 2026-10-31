import { describe, expect, it } from 'vitest';
import { medalFor, type MedalLimits } from '../../src/model/medals';

const limits: MedalLimits = {
  diamond: 90,
  gold: 75,
  silver: 60,
  bronze: 40,
};

describe('medalFor', () => {
  
it('throws an error for negative points', () => {
  expect(() => medalFor(-10, limits)).toThrow(
    'Points must be a non-negative number'
  );
});

it('throws an error for incorrect medal limits', () => {
  const invalidLimits = {
    diamond: 100,
    gold: 90,
    silver: 70,
    bronze: 95,
  };

  expect(() => medalFor(80, invalidLimits)).toThrow(
    'Invalid medal limits'
  );
});

it('throws an error for negative medal limits', () => {
  const invalidLimits = {
    diamond: 100,
    gold: 90,
    silver: 70,
    bronze: -5,
  };

  expect(() => medalFor(80, invalidLimits)).toThrow(
    'Invalid medal limits'
  );
});


  it('returns diamond at the correct threshold', () => {
    expect(medalFor(89, limits)).toBe('gold');
    expect(medalFor(90, limits)).toBe('diamond');
    expect(medalFor(91, limits)).toBe('diamond');
  });

  it('returns gold at the correct threshold', () => {
    expect(medalFor(74, limits)).toBe('silver');
    expect(medalFor(75, limits)).toBe('gold');
    expect(medalFor(76, limits)).toBe('gold');
  });

  it('returns silver at the correct threshold', () => {
    expect(medalFor(59, limits)).toBe('bronze');
    expect(medalFor(60, limits)).toBe('silver');
    expect(medalFor(61, limits)).toBe('silver');
  });

  it('returns bronze at the correct threshold', () => {
    expect(medalFor(39, limits)).toBe('none');
    expect(medalFor(40, limits)).toBe('bronze');
    expect(medalFor(41, limits)).toBe('bronze');
  });

  it('returns none for low scores', () => {
    expect(medalFor(0, limits)).toBe('none');
    expect(medalFor(20, limits)).toBe('none');
  });
});
