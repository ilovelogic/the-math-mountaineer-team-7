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
  //check if pointss are valid
  if (!Number.isFinite(points) || points < 0) {
    throw new Error('Points must be a non-negative number');
  }

  //check if medal limits are valid
  if (!(limits.diamond > limits.gold && 
    limits.gold > limits.silver &&
    limits.silver > limits.bronze &&
    limits.bronze >= 0)
  ) {
    throw new Error('Invalid medal limits');
  }

  if (points >= limits.diamond) return 'diamond';
  if (points >= limits.gold) return 'gold';
  if (points >= limits.silver) return 'silver';
  if (points >= limits.bronze) return 'bronze';

  return 'none';
}
