import { describe, expect, it } from 'vitest';

describe('test setup', () => {
  it('runs TypeScript tests', () => {
    const hypotenuse = (a: number, b: number): number => Math.hypot(a, b);
    expect(hypotenuse(3, 4)).toBe(5);
  });
});
