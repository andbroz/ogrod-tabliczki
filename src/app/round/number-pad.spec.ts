import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../testing/axe';
import { NumberPad } from './number-pad';

function setup() {
  const fixture = TestBed.createComponent(NumberPad);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const submitted: number[] = [];
  fixture.componentInstance.submitted.subscribe((v) => submitted.push(v));
  const key = (label: string) =>
    [...el.querySelectorAll<HTMLButtonElement>('button')].find(
      (b) => b.textContent?.trim() === label || b.getAttribute('aria-label') === label,
    )!;
  const press = (...labels: string[]) => {
    for (const label of labels) {
      key(label).click();
      fixture.detectChanges();
    }
  };
  const type = (k: string, target: EventTarget = document.body) => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
    fixture.detectChanges();
  };
  const display = () => el.querySelector('output')?.textContent?.trim();
  return { fixture, el, submitted, key, press, type, display };
}

describe('NumberPad', () => {
  it('has keys 0–9, delete and confirm', () => {
    const { el } = setup();
    const labels = [...el.querySelectorAll('button')].map(
      (b) => b.getAttribute('aria-label') ?? b.textContent?.trim(),
    );
    expect(labels).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Usuń', '0', 'Sprawdź']);
  });

  it('appends digits up to 3', () => {
    const { press, display } = setup();
    press('5', '6', '7', '8');
    expect(display()).toBe('567');
  });

  it('deletes the last digit', () => {
    const { press, display } = setup();
    press('5', '6', 'Usuń');
    expect(display()).toBe('5');
  });

  it('cannot confirm an empty answer', () => {
    const { key, submitted } = setup();
    expect(key('Sprawdź').disabled).toBe(true);
    key('Sprawdź').click();
    expect(submitted).toEqual([]);
  });

  it('emits the typed number on confirm and clears the field', () => {
    const { press, submitted, display } = setup();
    press('5', '6', 'Sprawdź');
    expect(submitted).toEqual([56]);
    expect(display()).toBe('');
  });

  it('accepts 0 as an answer', () => {
    const { press, submitted } = setup();
    press('0', 'Sprawdź');
    expect(submitted).toEqual([0]);
  });

  it('works with the physical keyboard: digits, Backspace and Enter', () => {
    const { type, submitted, display } = setup();
    type('4');
    type('2');
    type('9');
    type('Backspace');
    expect(display()).toBe('42');
    type('Enter');
    expect(submitted).toEqual([42]);
  });

  it('ignores other keys', () => {
    const { type, display } = setup();
    type('a');
    type('-');
    expect(display()).toBe('');
  });

  it('lets Enter on a focused key press that key without submitting', () => {
    const { key, type, submitted, display } = setup();
    type('Enter', key('5'));
    expect(submitted).toEqual([]);
    expect(display()).toBe('');
  });

  it('focuses the answer field, so typing then Enter submits', () => {
    const { fixture, el, type, submitted } = setup();
    fixture.componentInstance.focus();
    expect(document.activeElement).toBe(el.querySelector('output'));
    type('3', document.activeElement!);
    type('Enter', document.activeElement!);
    expect(submitted).toEqual([3]);
  });

  it('has no accessibility violations', async () => {
    const { el, press } = setup();
    await expectNoAxeViolations(el);
    press('5');
    await expectNoAxeViolations(el);
  });
});
