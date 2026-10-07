import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { expectNoAxeViolations } from '../../testing/axe';
import { polyfillDialog } from '../../testing/dialog';
import { ProgressStore, STORAGE } from '../progress/progress-store';
import { GardenPage } from './garden-page';

async function setup() {
  polyfillDialog();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: STORAGE, useValue: null }],
  });
  const store = TestBed.inject(ProgressStore);
  const fixture = TestBed.createComponent(GardenPage);
  await fixture.whenStable();
  return { store, fixture, el: fixture.nativeElement as HTMLElement };
}

describe('GardenPage', () => {
  it('has a heading and the garden grid', async () => {
    const { el } = await setup();
    expect(el.querySelector('h1')?.textContent).toContain('Ogród Tabliczki');
    expect(el.querySelector('app-garden-grid table')).not.toBeNull();
  });

  it('counts flowers out of 55', async () => {
    const { store, fixture, el } = await setup();
    expect(el.querySelector('.counter')?.textContent).toContain('0 / 55');
    store.recordAnswer('1×1', true);
    store.recordAnswer('1×1', true);
    await fixture.whenStable();
    expect(el.querySelector('.counter')?.textContent).toContain('1 / 55');
    expect(el.querySelector('.counter .visually-hidden')?.textContent).toContain('Kwiatki: 1 z 55');
  });

  it('links the Graj button to the round and focuses it', async () => {
    const { el } = await setup();
    const play = el.querySelector<HTMLAnchorElement>('a.play');
    expect(play?.getAttribute('href')).toBe('/graj');
    expect(play?.textContent).toContain('Graj');
    expect(document.activeElement).toBe(play);
  });

  it('has a reset button that opens the reset dialog', async () => {
    const { fixture, el } = await setup();
    const reset = el.querySelector<HTMLButtonElement>('button.reset')!;
    expect(reset.getAttribute('aria-label')).toBe('Wyczyść ogród');
    reset.click();
    await fixture.whenStable();
    expect(el.querySelector('app-reset-dialog dialog')?.hasAttribute('open')).toBe(true);
  });

  it('has no accessibility violations', async () => {
    const { el } = await setup();
    await expectNoAxeViolations(el);
  });
});
