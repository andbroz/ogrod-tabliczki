import { applyAnswer, FactProgress, NEW_FACT } from './growth';

describe('applyAnswer', () => {
  it('starts every fact as a seed with no streak', () => {
    expect(NEW_FACT).toEqual({ level: 'seed', streak: 0, attempts: 0 });
  });

  it('turns a seed into a sprout after one correct answer', () => {
    expect(applyAnswer(NEW_FACT, true)).toEqual({ level: 'sprout', streak: 1, attempts: 1 });
  });

  it('turns a sprout into a flower on the second correct answer in a row', () => {
    const sprout: FactProgress = { level: 'sprout', streak: 1, attempts: 1 };
    expect(applyAnswer(sprout, true)).toEqual({ level: 'flower', streak: 2, attempts: 2 });
  });

  it('keeps a flower a flower on further correct answers', () => {
    const flower: FactProgress = { level: 'flower', streak: 2, attempts: 2 };
    expect(applyAnswer(flower, true)).toEqual({ level: 'flower', streak: 3, attempts: 3 });
  });

  it('drops one level and resets the streak on a wrong answer', () => {
    const flower: FactProgress = { level: 'flower', streak: 5, attempts: 5 };
    const sprout: FactProgress = { level: 'sprout', streak: 1, attempts: 1 };
    expect(applyAnswer(flower, false)).toEqual({ level: 'sprout', streak: 0, attempts: 6 });
    expect(applyAnswer(sprout, false)).toEqual({ level: 'seed', streak: 0, attempts: 2 });
  });

  it('keeps a seed a seed on a wrong answer', () => {
    expect(applyAnswer(NEW_FACT, false)).toEqual({ level: 'seed', streak: 0, attempts: 1 });
  });

  it('needs two correct answers in a row to regain a flower after a mistake', () => {
    const flower: FactProgress = { level: 'flower', streak: 2, attempts: 2 };
    const dropped = applyAnswer(flower, false);
    const once = applyAnswer(dropped, true);
    const twice = applyAnswer(once, true);
    expect(dropped.level).toBe('sprout');
    expect(once.level).toBe('sprout');
    expect(twice.level).toBe('flower');
  });
});
