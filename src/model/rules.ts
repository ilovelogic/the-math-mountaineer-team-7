import { Settings } from '../content/settings';

/** What happens when the player lays a log across the chasm. */
export type PickResult = 'fits' | 'tooShort' | 'tooLong';

/**
 * Points a chasm pick earns. Only the log that fits earns any: a short log
 * falls in, and a long one smashes the item it was worth.
 */
export function pointsFor(result: PickResult, settings: Settings): number {
  if (result === 'fits') return settings.pointsPerChasm;
  return 0;
}
