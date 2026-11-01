
import { describe, it, expect } from 'vitest';
import { SaveStore } from '../../src/model/SaveStore';
import type { SavedProgress } from '../../src/model/PlayerProgress';

function fakeStorage(): Storage {
  const data = new Map<string, string>();

  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value); },
    removeItem: (key) => { data.delete(key); },
    clear: () => data.clear(),
    key: (index) => Array.from(data.keys())[index] ?? null,
    get length() { return data.size; },
  };
}

const checkpoint: SavedProgress = {
  version: 1,
  seed: 42,
  level: 1,
  step: 3,
  points: 100,
  topic: 'fractions',
  answers: [],
};

describe('SaveStore', () => {
  it('saves and loads the same progress', () => {
    const store = new SaveStore(fakeStorage());
    store.save(checkpoint);
    expect(store.load()).toEqual(checkpoint);
  });

  it('returns null when nothing is saved', () => {
    const store = new SaveStore(fakeStorage());
    expect(store.load()).toBeNull();
  });

  it('returns null for corrupted JSON', () => {
    const storage = fakeStorage();
    storage.setItem('math-mountaineer-save', 'not json');

    const store = new SaveStore(storage);
    expect(store.load()).toBeNull();
  });

  it('handles unavailable storage without crashing', () => {
    const storage = fakeStorage();
    storage.setItem = () => { throw new Error('Blocked'); };
    storage.getItem = () => { throw new Error('Blocked'); };

    const store = new SaveStore(storage);
    expect(() => store.save(checkpoint)).not.toThrow();
    expect(store.load()).toBeNull();
  });
});
