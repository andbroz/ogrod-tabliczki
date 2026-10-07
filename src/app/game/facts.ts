import { Level } from './growth';

export type FactKey = `${number}×${number}`;
export type Stage = 1 | 2 | 3 | 4;

export interface Fact {
  readonly key: FactKey;
  readonly a: number;
  readonly b: number;
  readonly product: number;
  readonly stage: Stage;
}

/** Tables opened by each stage, in unlock order. */
export const STAGE_TABLES: Readonly<Record<Stage, readonly number[]>> = {
  1: [1, 2],
  2: [5, 10],
  3: [3, 4],
  4: [6, 7, 8, 9],
};

// Tuning constants (see SPEC.md). Change only with the spec.
export const UNLOCK_THRESHOLD = 0.8;
export const ROUND_LENGTH = 10;
export const LEVEL_WEIGHTS: Readonly<Record<Level, number>> = { seed: 3, sprout: 3, flower: 1 };
export const MAX_NEW_FACTS_PER_ROUND = 3;
export const ZERO_RULE_MASTERY = 3;
export const ZERO_RULE_REVIEW_CHANCE = 1 / 3;
export const AUTO_ADVANCE_MS = 1200;

export function factKey(x: number, y: number): FactKey {
  return x <= y ? `${x}×${y}` : `${y}×${x}`;
}

export function stageOf(x: number, y: number): Stage {
  const stages = [1, 2, 3, 4] as const;
  return stages.find((s) => STAGE_TABLES[s].includes(x) || STAGE_TABLES[s].includes(y)) ?? 4;
}

export const FACTS: readonly Fact[] = Array.from({ length: 10 }, (_, i) => i + 1).flatMap((a) =>
  Array.from({ length: 11 - a }, (_, j) => {
    const b = a + j;
    return { key: factKey(a, b), a, b, product: a * b, stage: stageOf(a, b) };
  }),
);
