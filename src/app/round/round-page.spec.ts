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

async function setup() {
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
  const harness = await RouterTestingHarness.create('/graj');
  const fixture = harness.fixture;
  const el = fixture.nativeElement as HTMLElement;
  const render = () => fixture.detectChanges();

  const problem = () => {
    const [left, right] = (el.querySelector('h1')?.textContent ?? '').match(/\d+/g)!.map(Number);
    return { left, right, product: left * right };
  };
  const bubbles = () => [...el.querySelectorAll<HTMLButtonElement>('app-answer-bubbles button')];
  const answer = (correct: boolean) => {
    const { product } = problem();
    bubbles()
      .find((b) => (Number(b.textContent) === product) === correct)!
      .click();
    render();
  };
  const liveText = () => el.querySelector('[aria-live]')?.textContent?.trim();
  const progressText = () => el.querySelector('.progress-label')?.textContent?.trim();
  const next = () => el.querySelector<HTMLButtonElement>('button.next');

  return { harness, el, render, problem, bubbles, answer, liveText, progressText, next };
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

  it('ignores further taps once a problem is answered', async () => {
    const { answer, bubbles } = await setup();
    answer(false);
    expect(bubbles()).toHaveLength(0);
  });

  it('returns to the garden after the 10th problem', async () => {
    const { render, answer, next, harness } = await setup();
    for (let i = 0; i < 10; i++) {
      answer(false);
      next()!.click();
      render();
    }
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/');
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
