import { Component, ElementRef, input, output, viewChildren } from '@angular/core';

@Component({
  selector: 'app-answer-bubbles',
  styleUrl: './answer-bubbles.css',
  template: `
    @for (option of options(); track option) {
      <button #bubble type="button" class="bubble" (click)="picked.emit(option)">
        {{ option }}
      </button>
    }
  `,
})
export class AnswerBubbles {
  readonly options = input.required<readonly number[]>();
  readonly picked = output<number>();
  private readonly bubbles = viewChildren<ElementRef<HTMLButtonElement>>('bubble');

  focusFirst(): void {
    this.bubbles()[0]?.nativeElement.focus();
  }
}
