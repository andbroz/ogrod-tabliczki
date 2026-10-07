import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../testing/axe';
import { ProgressStore, STORAGE } from '../progress/progress-store';
import { GardenGrid } from './garden-grid';

function setup() {
  TestBed.configureTestingModule({ providers: [{ provide: STORAGE, useValue: null }] });
  const store = TestBed.inject(ProgressStore);
  const fixture = TestBed.createComponent(GardenGrid);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const cell = (row: number, col: number) =>
    el.querySelectorAll('tbody tr')[row - 1].querySelectorAll('td')[col - 1] as HTMLElement;
  return { store, fixture, el, cell };
}

describe('GardenGrid', () => {
  it('renders a 10 × 10 table with row and column headers 1–10', () => {
    const { el } = setup();
    expect(el.querySelectorAll('tbody td')).toHaveLength(100);
    const colHeaders = [...el.querySelectorAll('thead th[scope="col"]')].map((th) =>
      th.textContent?.trim(),
    );
    expect(colHeaders.slice(1)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
    expect(el.querySelectorAll('tbody th[scope="row"]')).toHaveLength(10);
  });

  it('shows the 36 stage-1 cells as seeds and the other 64 as locked on a fresh garden', () => {
    const { el } = setup();
    expect(el.querySelectorAll('td.seed')).toHaveLength(36);
    expect(el.querySelectorAll('td.locked')).toHaveLength(64);
  });

  it('labels each cell with its fact and state', () => {
    const { cell } = setup();
    expect(cell(2, 7).textContent?.trim()).toBe('2 × 7, nasionko');
    expect(cell(7, 8).textContent?.trim()).toBe('7 × 8, zakryte');
  });

  it('shows the same plant in mirrored cells', () => {
    const { store, fixture, cell } = setup();
    store.recordAnswer('2×3', true);
    store.recordAnswer('2×3', true);
    fixture.detectChanges();
    expect(cell(2, 3).classList).toContain('flower');
    expect(cell(3, 2).classList).toContain('flower');
    expect(cell(3, 2).textContent?.trim()).toBe('3 × 2, kwiatek');
  });

  it('shows sprouts', () => {
    const { store, fixture, cell } = setup();
    store.recordAnswer('1×5', true);
    fixture.detectChanges();
    expect(cell(5, 1).classList).toContain('sprout');
    expect(cell(5, 1).textContent?.trim()).toBe('5 × 1, kiełek');
  });

  it('has no focusable cells', () => {
    const { el } = setup();
    expect(el.querySelectorAll('td[tabindex], td button, td a')).toHaveLength(0);
  });

  it('has no accessibility violations', async () => {
    const { el } = setup();
    await expectNoAxeViolations(el);
  });
});
