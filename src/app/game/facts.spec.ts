import { FACTS, factKey, stageOf } from './facts';

describe('factKey', () => {
  it('puts the smaller factor first', () => {
    expect(factKey(8, 7)).toBe('7×8');
    expect(factKey(7, 8)).toBe('7×8');
  });

  it('handles squares', () => {
    expect(factKey(6, 6)).toBe('6×6');
  });
});

describe('FACTS', () => {
  it('contains the 55 unique facts of the 1–10 table', () => {
    expect(FACTS).toHaveLength(55);
    expect(new Set(FACTS.map((f) => f.key)).size).toBe(55);
  });

  it('stores each fact with a ≤ b, a matching key and its product', () => {
    for (const f of FACTS) {
      expect(f.a).toBeGreaterThanOrEqual(1);
      expect(f.b).toBeLessThanOrEqual(10);
      expect(f.a).toBeLessThanOrEqual(f.b);
      expect(f.key).toBe(factKey(f.a, f.b));
      expect(f.product).toBe(f.a * f.b);
    }
  });

  it('splits the facts into stages of 19, 15, 11 and 10', () => {
    const counts = [1, 2, 3, 4].map((s) => FACTS.filter((f) => f.stage === s).length);
    expect(counts).toEqual([19, 15, 11, 10]);
  });
});

describe('stageOf', () => {
  it('uses the earliest stage containing either factor', () => {
    expect(stageOf(2, 7)).toBe(1);
    expect(stageOf(5, 9)).toBe(2);
    expect(stageOf(3, 8)).toBe(3);
    expect(stageOf(7, 8)).toBe(4);
  });

  it('does not depend on factor order', () => {
    expect(stageOf(9, 4)).toBe(stageOf(4, 9));
  });
});
