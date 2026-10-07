import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../testing/axe';
import { polyfillDialog } from '../../testing/dialog';
import { ProgressStore, STORAGE } from '../progress/progress-store';
import { ResetDialog } from './reset-dialog';

async function setup() {
  polyfillDialog();
  TestBed.configureTestingModule({ providers: [{ provide: STORAGE, useValue: null }] });
  const store = TestBed.inject(ProgressStore);
  const fixture = TestBed.createComponent(ResetDialog);
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const dialog = el.querySelector('dialog')!;
  const input = el.querySelector('input')!;
  const button = (label: string) =>
    [...el.querySelectorAll('button')].find((b) => b.textContent?.trim() === label)!;
  const type = async (text: string) => {
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };
  const trigger = document.createElement('button');
  document.body.append(trigger);
  trigger.focus();
  const open = async () => {
    fixture.componentInstance.open();
    await fixture.whenStable();
  };
  return { fixture, store, el, dialog, input, button, type, trigger, open };
}

describe('ResetDialog', () => {
  afterEach(() => document.querySelectorAll('body > button').forEach((b) => b.remove()));

  it('opens as a modal dialog with an accessible name and the question', async () => {
    const { dialog, open } = await setup();
    expect(dialog.open).toBe(false);
    await open();
    expect(dialog.open).toBe(true);
    const title = document.getElementById(dialog.getAttribute('aria-labelledby')!);
    expect(title?.textContent).toContain('Wyczyścić cały ogród?');
  });

  it('labels the confirmation field', async () => {
    const { el, input } = await setup();
    expect(el.querySelector(`label[for="${input.id}"]`)?.textContent).toContain(
      'Wpisz USUŃ, aby potwierdzić',
    );
  });

  it('enables Wyczyść only once USUŃ is typed, in any letter case', async () => {
    const { button, type, open } = await setup();
    await open();
    expect(button('Wyczyść').disabled).toBe(true);
    await type('USU');
    expect(button('Wyczyść').disabled).toBe(true);
    await type('usuń');
    expect(button('Wyczyść').disabled).toBe(false);
    await type('USUŃ');
    expect(button('Wyczyść').disabled).toBe(false);
    await type('USUN');
    expect(button('Wyczyść').disabled).toBe(true);
  });

  it('resets the garden and closes on Wyczyść', async () => {
    const { store, dialog, button, type, open } = await setup();
    store.recordAnswer('2×3', true);
    await open();
    await type('USUŃ');
    button('Wyczyść').click();
    expect(store.factProgress('2×3').attempts).toBe(0);
    expect(dialog.open).toBe(false);
  });

  it('consumes the Enter key so it cannot re-activate the opener after closing', async () => {
    // Without preventDefault, the browser moves focus back to ⚙ on close and the same
    // Enter press then "clicks" it, reopening the dialog.
    const { input, type, open } = await setup();
    await open();
    await type('usuń');
    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    input.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(true);
  });

  it('confirms with Enter in the field once the word matches', async () => {
    const { store, dialog, input, type, open } = await setup();
    store.recordAnswer('2×3', true);
    await open();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(dialog.open).toBe(true);
    await type('usuń');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(store.factProgress('2×3').attempts).toBe(0);
    expect(dialog.open).toBe(false);
  });

  it('closes without resetting on Anuluj and returns focus to the opener', async () => {
    const { store, dialog, button, type, trigger, open } = await setup();
    store.recordAnswer('2×3', true);
    await open();
    await type('USUŃ');
    button('Anuluj').click();
    expect(dialog.open).toBe(false);
    expect(store.factProgress('2×3').attempts).toBe(1);
    expect(document.activeElement).toBe(trigger);
  });

  it('starts empty every time it opens', async () => {
    const { input, button, type, open } = await setup();
    await open();
    await type('USUŃ');
    button('Anuluj').click();
    await open();
    expect(input.value).toBe('');
    expect(button('Wyczyść').disabled).toBe(true);
  });

  it('has no accessibility violations while open', async () => {
    const { el, open } = await setup();
    await open();
    await expectNoAxeViolations(el);
  });
});
