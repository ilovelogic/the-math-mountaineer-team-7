/** Values we expect to tweak while playtesting, kept in one place so changing them doesn't mean digging through game code. */
export interface Settings {
  /** How many points the log that fits is worth, matching the +10 in the mockups. */
  pointsPerChasm: number;
  /** How long clicks are ignored after a dialogue box changes, so a fast double click never skips a box. */
  dialogueTransitionMs: number;
}

export const settings: Settings = {
  pointsPerChasm: 10,
  dialogueTransitionMs: 250,
};
