import { MedalLimits } from '../model/medals';

/** Values we expect to tweak while playtesting, kept in one place so changing them doesn't mean digging through game code. */
export interface Settings {
  /** How many points the log that fits is worth, matching the +10 in the mockups. */
  pointsPerChasm: number;
  /** The fewest points that earn each medal. These are guesses to tune in playtesting, since the most a player can earn right now is 150 (15 chasms worth 10 each). */
  medalLimits: MedalLimits;
}

export const settings: Settings = {
  pointsPerChasm: 10,
  medalLimits: { diamond: 140, gold: 120, silver: 90, bronze: 60 },
};
