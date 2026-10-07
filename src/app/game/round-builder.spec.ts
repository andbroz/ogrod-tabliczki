import { seededRandom } from '../../testing/seeded-random';
import { Fact, FACTS, FactKey, ROUND_LENGTH } from './facts';
import { FactProgress, Level, NEW_FACT } from './growth';
import { buildRound, insertRetry, Problem, RoundInput } from './round-builder';

const stage1 = FACTS.filter((f) => f.stage === 1);
const byKey = new Map(FACTS.map((f) => [f.key, f]));

function input(
  unlockedFacts: readonly Fact[],
  known: Partial<Record<FactKey, Level>> = {},
  zeroRuleCorrect = 0,
): RoundInput {
  return {
    unlockedFacts,
    zeroRuleCorrect,
    progress: (key): FactProgress => {
      const level = known[key];
      return level ? { level, streak: level === 'flower' ? 2 : 1, attempts: 1 } : NEW_FACT;
    },
  };
}

function factKeys(round: readonly Problem[]): FactKey[] {
  return round.flatMap((p) => (p.kind === 'fact' ? [p.key] : []));
}

function manyRounds(roundInput: RoundInput, runs = 1000): (readonly Problem[])[] {
  const random = seededRandom(42);
  return Array.from({ length: runs }, () => buildRound(roundInput, random));
}

const halfKnown: Partial<Record<FactKey, Level>> = Object.fromEntries(
  stage1.slice(0, 10).map((f, i) => [f.key, i % 2 ? 'flower' : 'sprout']),
);

describe('buildRound', () => {
  it.each([
    ['a fresh garden', input(stage1)],
    ['a half-grown garden', input(stage1, halfKnown)],
    [
      'the whole table in flower',
      input(FACTS, Object.fromEntries(FACTS.map((f) => [f.key, 'flower'])), 9),
    ],
  ])('always builds 10 valid problems for %s', (_, roundInput) => {
    const unlocked = new Set(roundInput.unlockedFacts.map((f) => f.key));
    for (const round of manyRounds(roundInput)) {
      expect(round).toHaveLength(ROUND_LENGTH);
      for (const p of round) {
        if (p.kind === 'zero') {
          expect(p.left * p.right).toBe(0);
          expect(Math.max(p.left, p.right)).toBeGreaterThanOrEqual(1);
          expect(Math.max(p.left, p.right)).toBeLessThanOrEqual(10);
        } else {
          const fact = byKey.get(p.key)!;
          expect(unlocked.has(p.key)).toBe(true);
          expect([p.left, p.right].sort((x, y) => x - y)).toEqual([fact.a, fact.b]);
        }
      }
    }
  });

  it('never asks the same fact twice in a row', () => {
    for (const round of manyRounds(input(stage1, halfKnown))) {
      round.forEach((p, i) => {
        const next = round[i + 1];
        if (p.kind === 'fact' && next?.kind === 'fact') expect(next.key).not.toBe(p.key);
      });
    }
  });

  it('asks each fact at most twice per round', () => {
    for (const round of manyRounds(input(stage1))) {
      const counts = new Map<FactKey, number>();
      for (const key of factKeys(round)) counts.set(key, (counts.get(key) ?? 0) + 1);
      expect(Math.max(...counts.values())).toBeLessThanOrEqual(2);
    }
  });

  it('introduces at most 3 new facts when known facts are available', () => {
    for (const round of manyRounds(input(stage1, halfKnown))) {
      const fresh = new Set(factKeys(round).filter((key) => !halfKnown[key]));
      expect(fresh.size).toBeLessThanOrEqual(3);
    }
  });

  it('adds more new facts only when nothing else is left (the first round)', () => {
    for (const round of manyRounds(input(stage1))) {
      expect(factKeys(round)).toHaveLength(9);
      expect(new Set(factKeys(round)).size).toBeGreaterThan(3);
    }
  });

  it('picks seeds and sprouts more often than flowers', () => {
    const known: Partial<Record<FactKey, Level>> = Object.fromEntries(
      stage1.map((f, i) => [f.key, i % 2 ? 'flower' : 'sprout']),
    );
    const keys = manyRounds(input(stage1, known)).flatMap(factKeys);
    const flowers = keys.filter((k) => known[k] === 'flower').length;
    const sprouts = keys.length - flowers;
    expect(sprouts / flowers).toBeGreaterThan(2);
  });

  it('includes exactly one ×0 problem until the rule is answered correctly 3 times', () => {
    for (const round of manyRounds(input(stage1, {}, 2), 200)) {
      expect(round.filter((p) => p.kind === 'zero')).toHaveLength(1);
    }
  });

  it('includes the ×0 problem in about a third of rounds after that', () => {
    const rounds = manyRounds(input(stage1, halfKnown, 3));
    const withZero = rounds.filter((r) => r.some((p) => p.kind === 'zero')).length;
    expect(withZero / rounds.length).toBeGreaterThan(0.28);
    expect(withZero / rounds.length).toBeLessThan(0.39);
    for (const r of rounds)
      expect(r.filter((p) => p.kind === 'zero').length).toBeLessThanOrEqual(1);
  });
});

describe('insertRetry', () => {
  const fact = (key: FactKey): Problem => {
    const f = byKey.get(key)!;
    return { kind: 'fact', key, left: f.a, right: f.b };
  };
  const zero: Problem = { kind: 'zero', left: 4, right: 0 };
  const keys = ['1×2', '1×3', '1×4', '1×5', '1×6', '1×7', '1×8', '1×9', '1×10', '2×2'] as const;
  const round: readonly Problem[] = keys.map(fact);

  it('re-asks the fact 2 problems later, keeping the round at 10', () => {
    const result = insertRetry(round, 1);
    expect(result).toHaveLength(10);
    expect(result[3]).toEqual(round[1]);
    expect(result.filter((p, i) => i !== 3)).toEqual(round.filter((p, i) => i !== 3));
  });

  it('uses 3 problems later when the slot 2 later is the ×0 problem', () => {
    const withZero = round.map((p, i) => (i === 3 ? zero : p));
    const result = insertRetry(withZero, 1);
    expect(result[3]).toEqual(zero);
    expect(result[4]).toEqual(round[1]);
  });

  it('does nothing when there is no room left', () => {
    expect(insertRetry(round, 8)).toEqual(round);
    expect(insertRetry(round, 9)).toEqual(round);
  });

  it('does nothing when the fact already appears twice', () => {
    const twice = round.map((p, i) => (i === 6 ? round[1] : p));
    expect(insertRetry(twice, 1)).toEqual(twice);
  });

  it('does nothing for a ×0 problem', () => {
    const withZero = round.map((p, i) => (i === 0 ? zero : p));
    expect(insertRetry(withZero, 0)).toEqual(withZero);
  });
});
