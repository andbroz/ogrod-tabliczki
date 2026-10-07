import { Random } from '../random';

const inTable = (n: number) => n >= 1 && n <= 10;

function shuffle<T>(items: readonly T[], random: Random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Two plausible wrong answers for a × b: neighbouring products first, then product ± 1, ± 2. */
export function distractors(a: number, b: number, random: Random): readonly [number, number] {
  const product = a * b;
  const neighbours = [
    [a, b - 1],
    [a, b + 1],
    [a - 1, b],
    [a + 1, b],
  ]
    .filter(([x, y]) => inTable(x) && inTable(y))
    .map(([x, y]) => x * y);
  const pool = [...new Set(shuffle(neighbours, random))].filter((v) => v !== product);
  for (const v of [product - 1, product + 1, product - 2, product + 2]) {
    if (pool.length < 2 && v >= 0 && !pool.includes(v)) pool.push(v);
  }
  return [pool[0], pool[1]];
}

/** The correct product and its two distractors, in random order. */
export function answerOptions(a: number, b: number, random: Random): readonly number[] {
  return shuffle([a * b, ...distractors(a, b, random)], random);
}
