import { PlayerProgress, type SavedProgress } from '../model/PlayerProgress';
import { newSeed } from './GameFlow';
import type { Screen } from './Screen';
import { CONTINUE } from './TitleController';

/**
 * Shows the title screen, then hands `play` the game the player picked: the saved game
 * on Continue, or a new one on New game. The title comes before GameFlow, rather than
 * being one of its steps, so the progress GameFlow plays is decided once and never
 * swapped out underneath the screens that read it.
 *
 * A save that has already reached `lastStep` (the medal) counts as no save, since
 * continuing it would only show the medal again with nothing to click.
 */
export function startGame(
  saved: SavedProgress | null,
  lastStep: number,
  makeTitle: (canContinue: boolean) => Screen,
  play: (progress: PlayerProgress) => void,
): void {
  const resumable = saved !== null && saved.step < lastStep ? saved : null;
  const title = makeTitle(resumable !== null);
  title.start((outcome) => {
    title.stop();
    const continuing = resumable !== null && outcome.kind === 'choice' && outcome.index === CONTINUE;
    play(continuing ? PlayerProgress.fromJSON(resumable) : new PlayerProgress(newSeed()));
  });
}
// Optional documentation
// - makeTitle: (canContinue: boolean) => Screen: a function passed in that builds the title screen, so tests can hand back a stand-in instead of drawing one.
// - play: (progress: PlayerProgress) => void: what to do with the chosen game; main.ts starts GameFlow with it, and tests just record it.
