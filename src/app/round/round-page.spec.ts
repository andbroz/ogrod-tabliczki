import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { expectNoAxeViolations } from '../../testing/axe';
import { seededRandom } from '../../testing/seeded-random';
import { AUTO_ADVANCE_MS, factKey } from '../game/facts';
import { ProgressStore, STORAGE } from '../progress/progress-store';
import { RANDOM } from '../random';
import { RoundPage } from './round-page';

@Component({ template: '' })
class EmptyPage {}

async function setup(before: (store: ProgressStore) => void = () => undefined) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: '', component: EmptyPage },
        { path: 'graj', component: RoundPage },
      ]),
      { provide: STORAGE, useValue: null },
      { provide: RANDOM, useValue: seededRandom(7) },
    ],
  });
  before(TestBed.inject(ProgressStore));
  const harness = await RouterTestingHarness.create('/graj');
  const fixture = harness.fixture;
  const el = fixture.nativeElement as HTMLElement;
  const render = () => fixture.detectChanges();

  const problem = () => {
    const [left, right] = (el.querySelector('h1')?.textContent ?? '').match(/\d+/g)!.map(Number);
    return { left, right, product: left * right };
  };
  const bubbles = () => [...el.querySelectorAll<HTMLButtonElement>('app-answer-bubbles button')];
  const padKey = (label: string) =>
    [...el.querySelectorAll<HTMLButtonElement>('app-number-pad button')].find(
      (b) => b.textContent?.trim() === label || b.getAttribute('aria-label') === label,
    )!;
  const answer = (correct: boolean) => {
    const { product } = problem();
    if (el.querySelector('app-number-pad')) {
      for (const digit of String(correct ? product : product + 1)) padKey(digit).click();
      render();
      padKey('Sprawdź').click();
    } else {
      bubbles()
        .find((b) => (Number(b.textContent) === product) === correct)!
        .click();
    }
    render();
  };
  const liveText = () => el.querySelector('[aria-live]')?.textContent?.trim();
  const progressText = () => el.querySelector('.progress-label')?.textContent?.trim();
  const next = () => el.querySelector<HTMLButtonElement>('button.next');

  return { harness, el, render, problem, bubbles, padKey, answer, liveText, progressText, next };
}

describe('RoundPage', () => {
  afterEach(() => vi.useRealTimers());

  it('shows the first problem with 3 bubbles including the correct answer', async () => {
    const { problem, bubbles, progressText } = await setup();
    const { left, right, product } = problem();
    expect(left).toBeGreaterThanOrEqual(0);
    expect(right).toBeGreaterThanOrEqual(0);
    expect(bubbles()).toHaveLength(3);
    expect(bubbles().map((b) => Number(b.textContent))).toContain(product);
    expect(progressText()).toBe('Zadanie 1 z 10');
  });

  it('focuses the first bubble', async () => {
    const { bubbles } = await setup();
    expect(document.activeElement).toBe(bubbles()[0]);
  });

  it('records a correct answer, praises and moves on automatically', async () => {
    const { render, problem, answer, liveText, progressText, bubbles } = await setup();
    vi.useFakeTimers();
    const { left, right } = problem();
    answer(true);

    expect(liveText()).toBe('Dobrze!');
    if (left > 0 && right > 0) {
      expect(TestBed.inject(ProgressStore).factProgress(factKey(left, right)).attempts).toBe(1);
    }
    vi.advanceTimersByTime(AUTO_ADVANCE_MS - 1);
    render();
    expect(progressText()).toBe('Zadanie 1 z 10');

    vi.advanceTimersByTime(1);
    render();
    expect(progressText()).toBe('Zadanie 2 z 10');
    expect(document.activeElement).toBe(bubbles()[0]);
  });

  it('shows the correct answer after a mistake and waits for Dalej', async () => {
    const { el, render, problem, answer, liveText, progressText, next } = await setup();
    vi.useFakeTimers();
    const { left, right, product } = problem();
    answer(false);

    expect(liveText()).toBe(`Prawie! ${left} razy ${right} to ${product}`);
    expect(el.querySelector('.feedback')?.textContent).toContain(`${left} × ${right} = ${product}`);
    expect(document.activeElement).toBe(next());

    vi.advanceTimersByTime(AUTO_ADVANCE_MS * 10);
    render();
    expect(progressText()).toBe('Zadanie 1 z 10');

    next()!.click();
    render();
    expect(progressText()).toBe('Zadanie 2 z 10');
  });

  it('uses the number pad for sprouts, flowers and the ×0 rule', async () => {
    const growAll = (store: ProgressStore) =>
      store.unlockedFacts().forEach((f) => store.recordAnswer(f.key, true));
    const { el, render, answer } = await setup(growAll);
    vi.useFakeTimers();
    for (let i = 0; i < 10; i++) {
      expect(el.querySelector('app-number-pad')).not.toBeNull();
      expect(el.querySelector('app-answer-bubbles')).toBeNull();
      answer(true);
      vi.advanceTimersByTime(AUTO_ADVANCE_MS);
      render();
    }
  });

  it('records ×0 answers in the rule counter, not the garden', async () => {
    const { el, render, problem, answer, next } = await setup();
    const store = TestBed.inject(ProgressStore);
    for (let i = 0; i < 10 && store.zeroRuleCorrect() === 0; i++) {
      const { left, right } = problem();
      const isZero = left === 0 || right === 0;
      if (isZero) expect(el.querySelector('app-number-pad')).not.toBeNull();
      answer(isZero);
      if (!isZero) next()!.click();
      render();
    }
    expect(store.zeroRuleCorrect()).toBe(1);
  });

  it('explains a mistake with a dot array', async () => {
    const { el, problem, answer } = await setup();
    const { left, right } = problem();
    answer(false);
    const dots = el.querySelector('.feedback app-dot-array');
    expect(dots).not.toBeNull();
    expect(dots!.querySelectorAll('.dot')).toHaveLength(left * right);
  });

  it('asks a missed fact again 2–3 problems later', async () => {
    // On a fresh garden the first facts already appear twice, which blocks a retry,
    // so start from a garden where every stage-1 fact has sprouted.
    const growAll = (store: ProgressStore) =>
      store.unlockedFacts().forEach((f) => store.recordAnswer(f.key, true));
    const { render, problem, answer, next } = await setup(growAll);
    const first = problem();
    expect(first.left * first.right).toBeGreaterThan(0); // seed 7 starts with a fact
    answer(false);
    next()!.click();
    render();

    vi.useFakeTimers();
    const later: string[] = [];
    for (let i = 0; i < 3; i++) {
      const { left, right } = problem();
      later.push(factKey(left, right));
      answer(true);
      vi.advanceTimersByTime(AUTO_ADVANCE_MS);
      render();
    }
    // Problems 2, 3, 4 were asked; the retry lands on problem 3 or 4.
    expect(later.slice(1)).toContain(factKey(first.left, first.right));
  });

  it('ignores further taps once a problem is answered', async () => {
    const { answer, bubbles } = await setup();
    answer(false);
    expect(bubbles()).toHaveLength(0);
  });

  it('shows the summary after the 10th problem and can start another round', async () => {
    const { el, render, answer, next, progressText, harness } = await setup();
    for (let i = 0; i < 10; i++) {
      answer(false);
      next()!.click();
      render();
    }
    await harness.fixture.whenStable();
    expect(el.querySelector('app-round-summary')).not.toBeNull();
    expect(el.querySelector('app-answer-bubbles, app-number-pad')).toBeNull();

    el.querySelector<HTMLButtonElement>('button.again')!.click();
    render();
    expect(el.querySelector('app-round-summary')).toBeNull();
    expect(progressText()).toBe('Zadanie 1 z 10');
  });

  it('counts each plant once, by its level at the end of the round', async () => {
    const { el, render, answer, harness } = await setup();
    const store = TestBed.inject(ProgressStore);
    vi.useFakeTimers();
    for (let i = 0; i < 10; i++) {
      answer(true);
      vi.advanceTimersByTime(AUTO_ADVANCE_MS);
      render();
    }
    vi.useRealTimers();
    await harness.fixture.whenStable();
    const grown = store.unlockedFacts().filter((f) => store.factProgress(f.key).attempts > 0);
    const flowers = grown.filter((f) => store.factProgress(f.key).level === 'flower').length;
    const sprouts = grown.length - flowers;
    const text = el.querySelector('app-round-summary')!.textContent!;
    expect(text).toContain(`Nowe kwiatki: ${flowers}`);
    expect(text).toContain(`Nowe kiełki: ${sprouts}`);
  });

  it('opens the next garden beds when a finished round reaches 80%', async () => {
    const almost = (store: ProgressStore) =>
      store
        .unlockedFacts()
        .slice(0, 15)
        .forEach((f) => store.recordAnswer(f.key, true)); // 79%
    const { el, render, answer, harness } = await setup(almost);
    const store = TestBed.inject(ProgressStore);
    vi.useFakeTimers();
    for (let i = 0; i < 10; i++) {
      answer(true);
      vi.advanceTimersByTime(AUTO_ADVANCE_MS);
      render();
    }
    vi.useRealTimers();
    await harness.fixture.whenStable();
    expect(store.unlockedStage()).toBe(2);
    expect(el.querySelector('app-round-summary')!.textContent).toContain('Nowe grządki!');
  });

  it('does not open new beds when the round is left early', async () => {
    const ready = (store: ProgressStore) =>
      store
        .unlockedFacts()
        .slice(0, 16)
        .forEach((f) => store.recordAnswer(f.key, true)); // 84%
    const { el, harness } = await setup(ready);
    el.querySelector<HTMLAnchorElement>('a.leave')!.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/');
    expect(TestBed.inject(ProgressStore).unlockedStage()).toBe(1);
  });

  it('has a way back to the garden at any time', async () => {
    const { el } = await setup();
    const leave = el.querySelector<HTMLAnchorElement>('a.leave');
    expect(leave?.getAttribute('href')).toBe('/');
    expect(leave?.getAttribute('aria-label')).toBe('Wróć do ogrodu');
  });

  it('has no accessibility violations while asking, after a correct and after a wrong answer', async () => {
    const { el, answer, next, render } = await setup();
    await expectNoAxeViolations(el);
    answer(false);
    await expectNoAxeViolations(el);
    next()!.click();
    render();
    answer(true);
    await expectNoAxeViolations(el);
  });
});
