/** Numbers the team tunes by hand. Change a value here, not in the code that uses it. */
export interface Settings {
  /** Points for picking the log that fits (the mockups' "+10 points"). */
  pointsPerChasm: number;
}

export const settings: Settings = {
  pointsPerChasm: 10,
};
