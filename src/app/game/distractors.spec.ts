import { answerOptions, distractors } from './distractors';
import { FACTS } from './facts';
import { seededRandom } from '../../testing/seeded-random';

describe('distractors', () => {
  it('always returns 2 distinct, non-negative wrong answers for every fact', () => {
    const random = seededRandom(1);
    for (const { a, b, product } of FACTS) {
      for (let run = 0; run < 20; run++) {
        const [x, y] = distractors(a, b, random);
        expect(x).not.toBe(y);
        expect([x, y]).not.toContain(product);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('prefers neighbouring products, so the wrong answers are plausible', () => {
    const random = seededRandom(2);
    for (let run = 0; run < 50; run++) {
      for (const value of distractors(7, 8, random)) {
        expect([49, 63, 48, 64]).toContain(value);
      }
    }
  });

  it('falls back to product ± 1 and ± 2 when there are too few neighbours', () => {
    const random = seededRandom(3);
    for (let run = 0; run < 50; run++) {
      // 1×1 has only one neighbouring product (2), so one value comes from the fallback.
      const values = distractors(1, 1, random);
      expect(values).toContain(2);
      expect([0, 2, 3]).toEqual(expect.arrayContaining([...values]));
    }
  });
});

describe('answerOptions', () => {
  it('returns the product and its 2 distractors in varying order', () => {
    const random = seededRandom(4);
    const firsts = new Set<number>();
    for (let run = 0; run < 50; run++) {
      const options = answerOptions(7, 8, random);
      expect(options).toHaveLength(3);
      expect(options).toContain(56);
      firsts.add(options[0]);
    }
    expect(firsts.size).toBeGreaterThan(1);
  });

  it('offers 0 among the options for a ×0 problem', () => {
    expect(answerOptions(6, 0, seededRandom(5))).toContain(0);
  });
});
