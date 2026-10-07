import { computed, InjectionToken, inject, Service, signal } from '@angular/core';
import { FACTS, FactKey, Stage, STAGE_TABLES, UNLOCK_THRESHOLD } from '../game/facts';
import { applyAnswer, FactProgress, Level, NEW_FACT } from '../game/growth';

export const STORAGE_KEY = 'ogrod-tabliczki:v1';

type ProgressStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** Browser storage, or null when it can't be accessed (e.g. blocked by privacy settings). */
export const STORAGE = new InjectionToken<Partial<ProgressStorage> | null>('STORAGE', {
  providedIn: 'root',
  factory: () => {
    try {
      return localStorage;
    } catch {
      return null;
    }
  },
});

export interface Progress {
  readonly version: 1;
  /** Only facts that have been answered at least once; the rest are NEW_FACT. */
  readonly facts: Readonly<Partial<Record<FactKey, FactProgress>>>;
  readonly unlockedStage: Stage;
  readonly zeroRuleCorrect: number;
}

const FRESH: Progress = { version: 1, facts: {}, unlockedStage: 1, zeroRuleCorrect: 0 };

@Service()
export class ProgressStore {
  private readonly storage = inject(STORAGE);
  private readonly state = signal<Progress>(this.load());

  readonly unlockedStage = computed(() => this.state().unlockedStage);
  readonly zeroRuleCorrect = computed(() => this.state().zeroRuleCorrect);
  readonly unlockedFacts = computed(() => FACTS.filter((f) => f.stage <= this.unlockedStage()));
  readonly flowerCount = computed(
    () => Object.values(this.state().facts).filter((p) => p?.level === 'flower').length,
  );

  factProgress(key: FactKey): FactProgress {
    return this.state().facts[key] ?? NEW_FACT;
  }

  recordAnswer(key: FactKey, correct: boolean): FactProgress {
    const next = applyAnswer(this.factProgress(key), correct);
    this.update((p) => ({ ...p, facts: { ...p.facts, [key]: next } }));
    return next;
  }

  recordZeroRule(correct: boolean): void {
    if (correct) this.update((p) => ({ ...p, zeroRuleCorrect: p.zeroRuleCorrect + 1 }));
  }

  /** Unlocks at most one stage; returns the newly opened tables, or null. */
  unlockNextStageIfReady(): readonly number[] | null {
    const stage = this.unlockedStage();
    if (stage === 4) return null;
    const unlocked = this.unlockedFacts();
    const grown = unlocked.filter((f) => this.factProgress(f.key).level !== 'seed').length;
    if (grown / unlocked.length < UNLOCK_THRESHOLD) return null;
    const next = (stage + 1) as Stage;
    this.update((p) => ({ ...p, unlockedStage: next }));
    return STAGE_TABLES[next];
  }

  reset(): void {
    this.update(() => FRESH);
  }

  private update(fn: (p: Progress) => Progress): void {
    this.state.update(fn);
    try {
      this.storage?.setItem?.(STORAGE_KEY, JSON.stringify(this.state()));
    } catch {
      // Storage full or blocked: keep playing in memory.
    }
  }

  private load(): Progress {
    try {
      const raw = this.storage?.getItem?.(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      return isProgress(parsed) ? parsed : FRESH;
    } catch {
      return FRESH;
    }
  }
}

const FACT_KEYS = new Set<string>(FACTS.map((f) => f.key));
const LEVELS = new Set<Level>(['seed', 'sprout', 'flower']);

function isCount(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function isFactProgress(value: unknown): value is FactProgress {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Record<string, unknown>;
  return LEVELS.has(p['level'] as Level) && isCount(p['streak']) && isCount(p['attempts']);
}

function isProgress(value: unknown): value is Progress {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Record<string, unknown>;
  const facts = p['facts'];
  return (
    p['version'] === 1 &&
    [1, 2, 3, 4].includes(p['unlockedStage'] as number) &&
    isCount(p['zeroRuleCorrect']) &&
    typeof facts === 'object' &&
    facts !== null &&
    Object.entries(facts).every(([key, fp]) => FACT_KEYS.has(key) && isFactProgress(fp))
  );
}
