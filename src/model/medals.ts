export type Medal =
  | 'diamond'
  | 'gold'
  | 'silver'
  | 'bronze'
  | 'none';

export interface MedalLimits {
  diamond: number;
  gold: number;
  silver: number;
  bronze: number;
}

export function medalFor(
  points: number,
  limits: MedalLimits
): Medal {
  if (points >= limits.diamond) return 'diamond';
  if (points >= limits.gold) return 'gold';
  if (points >= limits.silver) return 'silver';
  if (points >= limits.bronze) return 'bronze';

  return 'none';
}
