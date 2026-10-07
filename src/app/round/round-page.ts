import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { answerOptions } from '../game/distractors';
import { AUTO_ADVANCE_MS, ROUND_LENGTH } from '../game/facts';
import { buildRound } from '../game/round-builder';
import { ProgressStore } from '../progress/progress-store';
import { RANDOM } from '../random';
import { AnswerBubbles } from './answer-bubbles';

interface Feedback {
  readonly correct: boolean;
}

@Component({
  selector: 'app-round-page',
  imports: [AnswerBubbles, RouterLink],
  styleUrl: './round-page.css',
  template: `
    <header class="top">
      <a class="leave" routerLink="/" aria-label="Wróć do ogrodu">✕</a>
      <ol class="dots" aria-hidden="true">
        @for (n of dots; track n) {
          <li [class.done]="n < index()" [class.current]="n === index()"></li>
        }
      </ol>
      <p class="progress-label visually-hidden">Zadanie {{ index() + 1 }} z {{ dots.length }}</p>
    </header>

    <h1 class="problem">{{ problem().left }} × {{ problem().right }} = ?</h1>

    @if (feedback(); as f) {
      <div class="feedback" [class.correct]="f.correct">
        @if (f.correct) {
          <p class="verdict"><span aria-hidden="true">✔</span> Brawo!</p>
        } @else {
          <p class="verdict">Prawie!</p>
          <p class="solution">{{ problem().left }} × {{ problem().right }} = {{ product() }}</p>
          <button #next type="button" class="next" (click)="advance()">
            Dalej <span aria-hidden="true">➜</span>
          </button>
        }
      </div>
    } @else {
      <app-answer-bubbles [options]="options()" (picked)="answer($event)" />
    }

    <p class="visually-hidden" aria-live="polite">{{ announcement() }}</p>
  `,
})
export class RoundPage {
  private readonly store = inject(ProgressStore);
  private readonly random = inject(RANDOM);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  protected readonly dots = Array.from({ length: ROUND_LENGTH }, (_, i) => i);
  private readonly round = signal(
    buildRound(
      {
        unlockedFacts: this.store.unlockedFacts(),
        progress: (key) => this.store.factProgress(key),
        zeroRuleCorrect: this.store.zeroRuleCorrect(),
      },
      this.random,
    ),
  );
  protected readonly index = signal(0);
  protected readonly feedback = signal<Feedback | null>(null);
  protected readonly problem = computed(() => this.round()[this.index()]);
  protected readonly product = computed(() => this.problem().left * this.problem().right);
  protected readonly options = computed(() =>
    answerOptions(this.problem().left, this.problem().right, this.random),
  );
  protected readonly announcement = computed(() => {
    const f = this.feedback();
    if (!f) return '';
    const { left, right } = this.problem();
    return f.correct ? 'Dobrze!' : `Prawie! ${left} razy ${right} to ${this.product()}`;
  });

  private readonly bubbles = viewChild(AnswerBubbles);
  private readonly nextButton = viewChild<ElementRef<HTMLButtonElement>>('next');
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
    this.focusAfterRender(() => this.bubbles()?.focusFirst());
  }

  protected answer(value: number): void {
    if (this.feedback()) return;
    const problem = this.problem();
    const correct = value === this.product();
    if (problem.kind === 'fact') this.store.recordAnswer(problem.key, correct);
    else this.store.recordZeroRule(correct);

    this.feedback.set({ correct });
    if (correct) {
      this.timer = setTimeout(() => this.advance(), AUTO_ADVANCE_MS);
    } else {
      this.focusAfterRender(() => this.nextButton()?.nativeElement.focus());
    }
  }

  protected advance(): void {
    clearTimeout(this.timer);
    if (this.index() === this.round().length - 1) {
      void this.router.navigateByUrl('/');
      return;
    }
    this.index.update((i) => i + 1);
    this.feedback.set(null);
    this.focusAfterRender(() => this.bubbles()?.focusFirst());
  }

  private focusAfterRender(focus: () => void): void {
    afterNextRender(focus, { injector: this.injector });
  }
}
