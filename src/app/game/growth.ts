export type Level = 'seed' | 'sprout' | 'flower';

export interface FactProgress {
  readonly level: Level;
  readonly streak: number;
  readonly attempts: number;
}

export const NEW_FACT: FactProgress = { level: 'seed', streak: 0, attempts: 0 };

const DOWN: Record<Level, Level> = { flower: 'sprout', sprout: 'seed', seed: 'seed' };

export function applyAnswer(p: FactProgress, correct: boolean): FactProgress {
  const attempts = p.attempts + 1;
  if (!correct) return { level: DOWN[p.level], streak: 0, attempts };
  const streak = p.streak + 1;
  const level = streak >= 2 ? 'flower' : p.level === 'seed' ? 'sprout' : p.level;
  return { level, streak, attempts };
}
