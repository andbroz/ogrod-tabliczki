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
import { RouterLink } from '@angular/router';
import { answerOptions } from '../game/distractors';
import { AUTO_ADVANCE_MS, FactKey, ROUND_LENGTH } from '../game/facts';
import { Level } from '../game/growth';
import { buildRound, insertRetry, Problem } from '../game/round-builder';
import { ProgressStore } from '../progress/progress-store';
import { RANDOM } from '../random';
import { AnswerBubbles } from './answer-bubbles';
import { DotArray } from './dot-array';
import { NumberPad } from './number-pad';
import { RoundSummary } from './round-summary';

interface Feedback {
  readonly correct: boolean;
}

interface Summary {
  readonly sprouts: number;
  readonly flowers: number;
  readonly unlockedTables: readonly number[] | null;
}

const LEVEL_RANK: Record<Level, number> = { seed: 0, sprout: 1, flower: 2 };

@Component({
  selector: 'app-round-page',
  imports: [AnswerBubbles, DotArray, NumberPad, RoundSummary, RouterLink],
  styleUrl: './round-page.css',
  template: `
    @if (summary(); as s) {
      <app-round-summary
        [sprouts]="s.sprouts"
        [flowers]="s.flowers"
        [unlockedTables]="s.unlockedTables"
        (again)="start()"
      />
    } @else {
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
            <app-dot-array [rows]="problem().left" [cols]="problem().right" />
            <button #next type="button" class="next" (click)="advance()">
              Dalej <span aria-hidden="true">➜</span>
            </button>
          }
        </div>
      } @else if (usePad()) {
        <app-number-pad (submitted)="answer($event)" />
      } @else {
        <app-answer-bubbles [options]="options()" (picked)="answer($event)" />
      }
    }

    <p class="visually-hidden" aria-live="polite">{{ announcement() }}</p>
  `,
})
export class RoundPage {
  private readonly store = inject(ProgressStore);
  private readonly random = inject(RANDOM);
  private readonly injector = inject(Injector);

  protected readonly dots = Array.from({ length: ROUND_LENGTH }, (_, i) => i);
  private readonly round = signal<readonly Problem[]>([]);
  /** Level of each fact in the round when it started, to report what grew. */
  private startLevels = new Map<FactKey, Level>();
  protected readonly index = signal(0);
  protected readonly feedback = signal<Feedback | null>(null);
  protected readonly summary = signal<Summary | null>(null);
  protected readonly problem = computed(() => this.round()[this.index()]);
  protected readonly product = computed(() => this.problem().left * this.problem().right);
  /** Seeds are answered with bubbles; sprouts, flowers and the ×0 rule are typed. */
  protected readonly usePad = computed(() => {
    const p = this.problem();
    return p.kind === 'zero' || this.store.factProgress(p.key).level !== 'seed';
  });
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
  private readonly pad = viewChild(NumberPad);
  private readonly nextButton = viewChild<ElementRef<HTMLButtonElement>>('next');
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
    this.start();
  }

  protected start(): void {
    const round = buildRound(
      {
        unlockedFacts: this.store.unlockedFacts(),
        progress: (key) => this.store.factProgress(key),
        zeroRuleCorrect: this.store.zeroRuleCorrect(),
      },
      this.random,
    );
    this.startLevels = new Map(
      round.flatMap((p) =>
        p.kind === 'fact' ? [[p.key, this.store.factProgress(p.key).level]] : [],
      ),
    );
    this.round.set(round);
    this.index.set(0);
    this.feedback.set(null);
    this.summary.set(null);
    this.focusAfterRender(() => this.focusInput());
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
      this.round.update((r) => insertRetry(r, this.index()));
      this.focusAfterRender(() => this.nextButton()?.nativeElement.focus());
    }
  }

  protected advance(): void {
    clearTimeout(this.timer);
    if (this.index() === this.round().length - 1) {
      this.finish();
      return;
    }
    this.index.update((i) => i + 1);
    this.feedback.set(null);
    this.focusAfterRender(() => this.focusInput());
  }

  private finish(): void {
    let sprouts = 0;
    let flowers = 0;
    for (const [key, before] of this.startLevels) {
      const after = this.store.factProgress(key).level;
      if (LEVEL_RANK[after] <= LEVEL_RANK[before]) continue;
      if (after === 'flower') flowers++;
      else sprouts++;
    }
    this.summary.set({ sprouts, flowers, unlockedTables: this.store.unlockNextStageIfReady() });
  }

  private focusInput(): void {
    this.bubbles()?.focusFirst();
    this.pad()?.focus();
  }

  private focusAfterRender(focus: () => void): void {
    afterNextRender(focus, { injector: this.injector });
  }
}
