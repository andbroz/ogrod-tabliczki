import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { expectNoAxeViolations } from '../../testing/axe';
import { RoundSummary } from './round-summary';

async function setup(sprouts: number, flowers: number, unlocked: readonly number[] | null) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(RoundSummary);
  fixture.componentRef.setInput('sprouts', sprouts);
  fixture.componentRef.setInput('flowers', flowers);
  fixture.componentRef.setInput('unlockedTables', unlocked);
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, el, text: () => el.textContent?.replace(/\s+/g, ' ') ?? '' };
}

describe('RoundSummary', () => {
  it('shows how many plants grew', async () => {
    const { text } = await setup(2, 3, null);
    expect(text()).toContain('+3 🌸');
    expect(text()).toContain('Nowe kwiatki: 3');
    expect(text()).toContain('+2 🌿');
    expect(text()).toContain('Nowe kiełki: 2');
  });

  it('leaves out kinds of plants that did not grow', async () => {
    const { text } = await setup(0, 1, null);
    expect(text()).not.toContain('🌿');
    expect(text()).toContain('+1 🌸');
  });

  it('announces newly opened garden beds', async () => {
    const { text } = await setup(1, 0, [3, 4]);
    expect(text()).toContain('Nowe grządki!');
    expect(text()).toContain('×3 ×4');
  });

  it('does not mention new beds when none opened', async () => {
    const { text } = await setup(1, 0, null);
    expect(text()).not.toContain('Nowe grządki');
  });

  it('offers another round (focused) and the way back to the garden', async () => {
    const { fixture, el } = await setup(1, 1, null);
    const again = el.querySelector<HTMLButtonElement>('button.again')!;
    const garden = el.querySelector<HTMLAnchorElement>('a.garden')!;
    expect(again.textContent).toContain('Jeszcze raz');
    expect(document.activeElement).toBe(again);
    expect(garden.textContent).toContain('Ogród');
    expect(garden.getAttribute('href')).toBe('/');

    let clicked = 0;
    fixture.componentInstance.again.subscribe(() => clicked++);
    again.click();
    expect(clicked).toBe(1);
  });

  it('has no accessibility violations', async () => {
    const { el } = await setup(2, 3, [5, 10]);
    await expectNoAxeViolations(el);
  });
});
