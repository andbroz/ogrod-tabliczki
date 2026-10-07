import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { ProgressStore } from '../progress/progress-store';

const CONFIRM_WORD = 'USUŃ';

/** Parent-only reset: a weak reader can't type USUŃ by accident. */
@Component({
  selector: 'app-reset-dialog',
  imports: [FormField],
  styleUrl: './reset-dialog.css',
  template: `
    <dialog #dialog aria-labelledby="reset-title" (close)="restoreFocus()">
      <h2 id="reset-title">Wyczyścić cały ogród?</h2>
      <label for="reset-confirm">Wpisz USUŃ, aby potwierdzić</label>
      <input
        id="reset-confirm"
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
        [formField]="confirmForm.word"
        (keydown.enter)="confirmWithEnter($event)"
      />
      <div class="actions">
        <button type="button" class="cancel" (click)="close()">Anuluj</button>
        <button type="button" class="confirm" [disabled]="!confirmed()" (click)="reset()">
          Wyczyść
        </button>
      </div>
    </dialog>
  `,
})
export class ResetDialog {
  private readonly store = inject(ProgressStore);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly model = signal({ word: '' });
  protected readonly confirmForm = form(this.model);
  protected readonly confirmed = computed(
    () => this.model().word.trim().toLocaleUpperCase('pl') === CONFIRM_WORD,
  );
  private opener: HTMLElement | null = null;

  open(): void {
    this.opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.model.set({ word: '' });
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  protected reset(): void {
    if (!this.confirmed()) return;
    this.store.reset();
    this.close();
  }

  /** Consumes Enter: once focus returns to ⚙, the same key press would otherwise reopen the dialog. */
  protected confirmWithEnter(event: Event): void {
    event.preventDefault();
    this.reset();
  }

  protected restoreFocus(): void {
    this.opener?.focus();
    this.opener = null;
  }
}
