import { Settings } from '../content/settings';

/** How a picked log compares to the gap it has to cross. */
export type PickResult = 'fits' | 'tooShort' | 'tooLong';

/**
 * Only the log that fits earns points, since a short log falls into the chasm
 * and a long one smashes the item waiting on the other side.
 */
export function pointsFor(result: PickResult, settings: Settings): number {
  if (result === 'fits') return settings.pointsPerChasm;
  return 0;
}
