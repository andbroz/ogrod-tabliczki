import { TestBed } from '@angular/core/testing';
import { FACTS } from '../game/facts';
import { NEW_FACT } from '../game/growth';
import { ProgressStore, STORAGE, STORAGE_KEY } from './progress-store';

class MemoryStorage implements Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  readonly data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

function createStore(storage: Partial<Storage> | null): ProgressStore {
  TestBed.configureTestingModule({ providers: [{ provide: STORAGE, useValue: storage }] });
  return TestBed.inject(ProgressStore);
}

const stage1 = FACTS.filter((f) => f.stage === 1);

describe('ProgressStore', () => {
  it('starts fresh: stage 1 unlocked, every fact a seed, no flowers', () => {
    const store = createStore(new MemoryStorage());
    expect(store.unlockedStage()).toBe(1);
    expect(store.unlockedFacts()).toHaveLength(19);
    expect(store.factProgress('7×8')).toEqual(NEW_FACT);
    expect(store.flowerCount()).toBe(0);
    expect(store.zeroRuleCorrect()).toBe(0);
  });

  it('applies the growth rules when an answer is recorded', () => {
    const store = createStore(new MemoryStorage());
    store.recordAnswer('2×3', true);
    store.recordAnswer('2×3', true);
    expect(store.factProgress('2×3').level).toBe('flower');
    expect(store.flowerCount()).toBe(1);
  });

  it('saves after every answer and restores the same state on reload', () => {
    const storage = new MemoryStorage();
    const first = createStore(storage);
    first.recordAnswer('2×3', true);
    first.recordZeroRule(true);
    first.recordZeroRule(false);

    TestBed.resetTestingModule();
    const second = createStore(storage);
    expect(second.factProgress('2×3')).toEqual({ level: 'sprout', streak: 1, attempts: 1 });
    expect(second.zeroRuleCorrect()).toBe(1);
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).version).toBe(1);
  });

  it.each([
    ['corrupt JSON', '{not json'],
    [
      'an unknown version',
      JSON.stringify({ version: 2, facts: {}, unlockedStage: 1, zeroRuleCorrect: 0 }),
    ],
    [
      'an invalid level',
      JSON.stringify({
        version: 1,
        facts: { '2×3': { level: 'tree', streak: 0, attempts: 0 } },
        unlockedStage: 1,
        zeroRuleCorrect: 0,
      }),
    ],
    [
      'an unknown fact key',
      JSON.stringify({
        version: 1,
        facts: { '0×3': { level: 'seed', streak: 0, attempts: 0 } },
        unlockedStage: 1,
        zeroRuleCorrect: 0,
      }),
    ],
    [
      'an invalid stage',
      JSON.stringify({ version: 1, facts: {}, unlockedStage: 7, zeroRuleCorrect: 0 }),
    ],
  ])('starts fresh when storage holds %s', (_, raw) => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, raw);
    const store = createStore(storage);
    expect(store.unlockedStage()).toBe(1);
    expect(store.factProgress('2×3')).toEqual(NEW_FACT);
  });

  it('keeps working in memory when storage is unavailable', () => {
    const store = createStore(null);
    store.recordAnswer('2×3', true);
    expect(store.factProgress('2×3').level).toBe('sprout');
  });

  it('keeps working in memory when storage throws', () => {
    const throwing: Partial<Storage> = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('quota');
      },
    };
    const store = createStore(throwing);
    expect(() => store.recordAnswer('2×3', true)).not.toThrow();
    expect(store.factProgress('2×3').level).toBe('sprout');
  });

  describe('unlockNextStageIfReady', () => {
    function growToSprout(store: ProgressStore, count: number): void {
      stage1.slice(0, count).forEach((f) => store.recordAnswer(f.key, true));
    }

    it('does nothing below 80% sprouts or flowers', () => {
      const store = createStore(new MemoryStorage());
      growToSprout(store, 15); // 15 / 19 = 79%
      expect(store.unlockNextStageIfReady()).toBeNull();
      expect(store.unlockedStage()).toBe(1);
    });

    it('unlocks exactly one stage at 80% and returns its tables', () => {
      const store = createStore(new MemoryStorage());
      growToSprout(store, 16); // 16 / 19 = 84%
      expect(store.unlockNextStageIfReady()).toEqual([5, 10]);
      expect(store.unlockedStage()).toBe(2);
      expect(store.unlockedFacts()).toHaveLength(34);
    });

    it('does not unlock the next stage again until the new facts grow', () => {
      const store = createStore(new MemoryStorage());
      growToSprout(store, 19);
      store.unlockNextStageIfReady();
      expect(store.unlockNextStageIfReady()).toBeNull(); // 19 / 34 = 56%
      expect(store.unlockedStage()).toBe(2);
    });

    it('never goes past the last stage', () => {
      const store = createStore(new MemoryStorage());
      for (const f of FACTS) store.recordAnswer(f.key, true);
      expect(store.unlockNextStageIfReady()).toEqual([5, 10]);
      expect(store.unlockNextStageIfReady()).toEqual([3, 4]);
      expect(store.unlockNextStageIfReady()).toEqual([6, 7, 8, 9]);
      expect(store.unlockNextStageIfReady()).toBeNull();
      expect(store.unlockedStage()).toBe(4);
    });
  });

  it('reset clears progress and storage', () => {
    const storage = new MemoryStorage();
    const store = createStore(storage);
    store.recordAnswer('2×3', true);
    store.reset();
    expect(store.factProgress('2×3')).toEqual(NEW_FACT);
    expect(store.unlockedStage()).toBe(1);
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).facts).toEqual({});
  });
});
