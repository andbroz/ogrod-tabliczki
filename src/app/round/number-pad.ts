import { Component, ElementRef, output, signal, viewChild } from '@angular/core';

const MAX_DIGITS = 3;

@Component({
  selector: 'app-number-pad',
  styleUrl: './number-pad.css',
  host: { '(document:keydown)': 'onKey($event)' },
  template: `
    <output #display class="display" tabindex="-1" aria-label="Twoja odpowiedź">{{
      value()
    }}</output>
    <div class="keys">
      @for (digit of digits; track digit) {
        <button type="button" class="key" (click)="append(digit)">{{ digit }}</button>
      }
      <button type="button" class="key" aria-label="Usuń" (click)="remove()">⌫</button>
      <button type="button" class="key" (click)="append('0')">0</button>
      <button
        type="button"
        class="key confirm"
        aria-label="Sprawdź"
        [disabled]="value() === ''"
        (click)="submit()"
      >
        ✓
      </button>
    </div>
  `,
})
export class NumberPad {
  readonly submitted = output<number>();
  protected readonly value = signal('');
  protected readonly digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  private readonly display = viewChild.required<ElementRef<HTMLOutputElement>>('display');

  /** Focuses the answer field rather than a key, so typing then Enter submits. */
  focus(): void {
    this.display().nativeElement.focus();
  }

  protected append(digit: string): void {
    this.value.update((v) => (v.length < MAX_DIGITS ? v + digit : v));
  }

  protected remove(): void {
    this.value.update((v) => v.slice(0, -1));
  }

  protected submit(): void {
    if (this.value() === '') return;
    this.submitted.emit(Number(this.value()));
    this.value.set('');
  }

  protected onKey(event: KeyboardEvent): void {
    if (/^[0-9]$/.test(event.key)) {
      this.append(event.key);
    } else if (event.key === 'Backspace') {
      this.remove();
    } else if (event.key === 'Enter' && !(event.target instanceof HTMLButtonElement)) {
      // On a focused key, Enter presses that key instead.
      this.submit();
    }
  }
}
