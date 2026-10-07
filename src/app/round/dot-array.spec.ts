import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../testing/axe';
import { DotArray } from './dot-array';

function setup(rows: number, cols: number) {
  const fixture = TestBed.createComponent(DotArray);
  fixture.componentRef.setInput('rows', rows);
  fixture.componentRef.setInput('cols', cols);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const img = el.querySelector('[role="img"]')!;
  return { el, img };
}

describe('DotArray', () => {
  it('draws rows × cols dots, one row per first factor', () => {
    const { el } = setup(7, 8);
    expect(el.querySelectorAll('.row')).toHaveLength(7);
    expect(el.querySelectorAll('.dot')).toHaveLength(56);
    expect(el.querySelectorAll('.row')[0].querySelectorAll('.dot')).toHaveLength(8);
  });

  it.each([
    [7, 8, '7 rzędów po 8 kropek, razem 56'],
    [3, 2, '3 rzędy po 2 kropki, razem 6'],
    [1, 1, '1 rząd po 1 kropce, razem 1'],
    [2, 5, '2 rzędy po 5 kropek, razem 10'],
    [10, 4, '10 rzędów po 4 kropki, razem 40'],
  ])('labels %i × %i in Polish', (rows, cols, label) => {
    const { img } = setup(rows, cols);
    expect(img.getAttribute('aria-label')).toBe(label);
  });

  it('shows empty rows for n × 0', () => {
    const { el, img } = setup(4, 0);
    expect(el.querySelectorAll('.row')).toHaveLength(4);
    expect(el.querySelectorAll('.dot')).toHaveLength(0);
    expect(img.getAttribute('aria-label')).toBe('0 kropek');
  });

  it('shows nothing for 0 × n', () => {
    const { el, img } = setup(0, 5);
    expect(el.querySelectorAll('.row')).toHaveLength(0);
    expect(img.getAttribute('aria-label')).toBe('0 kropek');
  });

  it('has no accessibility violations', async () => {
    const { el } = setup(7, 8);
    await expectNoAxeViolations(el);
  });
});
