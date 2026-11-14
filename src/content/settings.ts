import { MedalLimits } from '../model/medals';

/** Values we expect to tweak while playtesting, kept in one place so changing them doesn't mean digging through game code. */
export interface Settings {
  /** How many points the log that fits is worth, matching the +10 in the mockups. */
  pointsPerChasm: number;
  /**
   * The fewest points that earn each medal: 100%, 90%, 70% and 50% of the 150 points
   * a player can earn right now (15 chasms worth 10 each), matching the Medal
   * requirements card in the mockups. Change them together with that card.
   */
  medalLimits: MedalLimits;
  /** How many points the right answer at the zipline shop is worth, matching the +50 in the "Right answer" mockup. */
  pointsPerZipline: number;
  /** How long clicks are ignored after a dialogue box changes, so a fast double click never skips a box. */
  dialogueTransitionMs: number;
}

export const settings: Settings = {
  pointsPerChasm: 10,
  medalLimits: { diamond: 150, gold: 135, silver: 105, bronze: 75 },
  dialogueTransitionMs: 250,
  pointsPerZipline: 50,
};
