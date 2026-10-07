import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-round-summary',
  imports: [RouterLink],
  styleUrl: './round-summary.css',
  template: `
    <h1 class="visually-hidden">Koniec rundy</h1>
    <ul class="grown">
      @if (flowers() > 0) {
        <li>
          <span aria-hidden="true">+{{ flowers() }} 🌸</span>
          <span class="visually-hidden">Nowe kwiatki: {{ flowers() }}</span>
        </li>
      }
      @if (sprouts() > 0) {
        <li>
          <span aria-hidden="true">+{{ sprouts() }} 🌿</span>
          <span class="visually-hidden">Nowe kiełki: {{ sprouts() }}</span>
        </li>
      }
    </ul>
    @if (tablesText(); as tables) {
      <p class="unlocked">
        Nowe grządki!
        <span class="tables">{{ tables }}</span>
      </p>
    }
    <div class="actions">
      <button #againButton type="button" class="again" (click)="again.emit()">
        <span aria-hidden="true">▶</span> Jeszcze raz
      </button>
      <a class="garden" routerLink="/"><span aria-hidden="true">🌱</span> Ogród</a>
    </div>
  `,
})
export class RoundSummary {
  readonly sprouts = input.required<number>();
  readonly flowers = input.required<number>();
  readonly unlockedTables = input.required<readonly number[] | null>();
  readonly again = output();
  protected readonly tablesText = computed(
    () =>
      this.unlockedTables()
        ?.map((t) => `×${t}`)
        .join(' ') ?? '',
  );
  private readonly againButton = viewChild.required<ElementRef<HTMLButtonElement>>('againButton');

  constructor() {
    afterNextRender(() => this.againButton().nativeElement.focus());
  }
}
