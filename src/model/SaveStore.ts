
import { PlayerProgress, type SavedProgress } from './PlayerProgress';

const SAVE_KEY = 'math-mountaineer-save';

export class SaveStore {
  constructor(private storage: Storage) {}

  save(checkpoint: SavedProgress): void {
    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify(checkpoint));
    } catch {
      // Don't crash if storage is unavailable.
    }
  }

  load(): SavedProgress | null {
    try {
      const saved = this.storage.getItem(SAVE_KEY);

      if (saved === null) {
        return null;
      }

      return PlayerProgress.fromJSON(JSON.parse(saved)).toJSON();
    } catch {
      return null;
    }
  }
}
