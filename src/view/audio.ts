import type { Medal } from '../model/medals';
import { sound } from './assets';

/** The name of each sound the game plays, matching its entry in `SOUND_FILES`. */
export type Cue = 'fits' | 'tooShort' | 'tooLong' | 'levelDone' | `medal-${Medal}`;

/**
 * Plays the sound for one outcome, starting it over if it's already playing so
 * quick repeat picks are each heard. If the browser refuses to play it, for
 * example before the player has clicked anything, the sound is skipped, since
 * the game works fine without it.
 */
export function play(cue: Cue): void {
    const soundEffect = sound(cue);
    soundEffect.currentTime = 0;
    soundEffect.play().catch( () => {
        // Do nothing; no sound is played and user carries on
    });
}

// Optional documentation
// - `medal-${Medal}`: a template literal type, which is every Medal with "medal-" in front, such as 'medal-gold' or 'medal-none'.
// - soundEffect.play().catch(() => {...}): play() returns a promise that rejects
// later if the browser won't play the sound, and .catch handles that rejection.
// A try/catch can't, because play() has already returned by the time the rejection
// arrives.