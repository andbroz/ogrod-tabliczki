import { Random } from '../random';
import {
  Fact,
  FACTS,
  FactKey,
  LEVEL_WEIGHTS,
  MAX_NEW_FACTS_PER_ROUND,
  ROUND_LENGTH,
  ZERO_RULE_MASTERY,
  ZERO_RULE_REVIEW_CHANCE,
} from './facts';
import { FactProgress } from './growth';

export type Problem =
  | { readonly kind: 'fact'; readonly key: FactKey; readonly left: number; readonly right: number }
  | { readonly kind: 'zero'; readonly left: number; readonly right: number };

export interface RoundInput {
  readonly unlockedFacts: readonly Fact[];
  readonly progress: (key: FactKey) => FactProgress;
  readonly zeroRuleCorrect: number;
}

const MAX_PER_FACT = 2;
const FACTS_BY_KEY = new Map(FACTS.map((f) => [f.key, f]));

export function buildRound(input: RoundInput, random: Random): readonly Problem[] {
  const includeZero =
    input.zeroRuleCorrect < ZERO_RULE_MASTERY || random() < ZERO_RULE_REVIEW_CHANCE;
  const keys: FactKey[] = [];
  while (keys.length < ROUND_LENGTH - (includeZero ? 1 : 0)) {
    keys.push(pickFact(input, keys, random));
  }
  const problems: Problem[] = keys.map((key) => factProblem(FACTS_BY_KEY.get(key)!, random));
  if (includeZero) {
    problems.splice(Math.floor(random() * ROUND_LENGTH), 0, zeroProblem(random));
  }
  return problems;
}

/** Re-asks a wrongly answered fact 2–3 problems later by replacing that slot, if the rules allow. */
export function insertRetry(round: readonly Problem[], index: number): readonly Problem[] {
  const problem = round[index];
  if (problem?.kind !== 'fact') return round;
  const isSame = (p: Problem | undefined) => p?.kind === 'fact' && p.key === problem.key;
  for (const target of [index + 2, index + 3]) {
    if (round[target] === undefined || round[target].kind === 'zero') continue;
    const elsewhere = round.filter((p, i) => i !== target && isSame(p)).length;
    if (elsewhere >= MAX_PER_FACT) return round;
    if (isSame(round[target - 1]) || isSame(round[target + 1])) continue;
    return round.map((p, i) => (i === target ? problem : p));
  }
  return round;
}

function pickFact(input: RoundInput, chosen: readonly FactKey[], random: Random): FactKey {
  const counts = new Map<FactKey, number>();
  for (const key of chosen) counts.set(key, (counts.get(key) ?? 0) + 1);
  const isNew = (key: FactKey) => input.progress(key).attempts === 0;
  const newChosen = [...counts.keys()].filter(isNew).length;

  const available = input.unlockedFacts.filter(
    (f) => (counts.get(f.key) ?? 0) < MAX_PER_FACT && f.key !== chosen.at(-1),
  );
  // Soft limit: only add more new facts when nothing else is left.
  const withinLimit =
    newChosen < MAX_NEW_FACTS_PER_ROUND
      ? available
      : available.filter((f) => counts.has(f.key) || !isNew(f.key));
  const pool = withinLimit.length > 0 ? withinLimit : available;

  return weightedPick(pool, (f) => LEVEL_WEIGHTS[input.progress(f.key).level], random).key;
}

function weightedPick<T>(items: readonly T[], weight: (item: T) => number, random: Random): T {
  let remaining = random() * items.reduce((sum, item) => sum + weight(item), 0);
  for (const item of items) {
    remaining -= weight(item);
    if (remaining < 0) return item;
  }
  return items[items.length - 1];
}

function factProblem({ key, a, b }: Fact, random: Random): Problem {
  return random() < 0.5
    ? { kind: 'fact', key, left: a, right: b }
    : { kind: 'fact', key, left: b, right: a };
}

function zeroProblem(random: Random): Problem {
  const n = 1 + Math.floor(random() * 10);
  return random() < 0.5 ? { kind: 'zero', left: n, right: 0 } : { kind: 'zero', left: 0, right: n };
}
