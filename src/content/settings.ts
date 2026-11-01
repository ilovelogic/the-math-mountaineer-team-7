/** Values we expect to tweak while playtesting, kept in one place so changing them doesn't mean digging through game code. */
export interface Settings {
  /** How many points the log that fits is worth, matching the +10 in the mockups. */
  pointsPerChasm: number;
}

export const settings: Settings = {
  pointsPerChasm: 10,
};
