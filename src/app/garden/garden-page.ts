import { afterNextRender, Component, ElementRef, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FACTS } from '../game/facts';
import { ProgressStore } from '../progress/progress-store';
import { GardenGrid } from './garden-grid';
import { ResetDialog } from './reset-dialog';

@Component({
  selector: 'app-garden-page',
  imports: [GardenGrid, ResetDialog, RouterLink],
  styleUrl: './garden-page.css',
  template: `
    <h1><span aria-hidden="true">🌱</span> Ogród Tabliczki</h1>
    <p class="counter">
      <span aria-hidden="true">🌸 {{ store.flowerCount() }} / {{ total }}</span>
      <span class="visually-hidden">Kwiatki: {{ store.flowerCount() }} z {{ total }}</span>
    </p>
    <app-garden-grid />
    <a #play class="play" routerLink="/graj"><span aria-hidden="true">▶</span> Graj</a>
    <button type="button" class="reset" aria-label="Wyczyść ogród" (click)="resetDialog.open()">
      <span aria-hidden="true">⚙</span>
    </button>
    <app-reset-dialog #resetDialog />
  `,
})
export class GardenPage {
  protected readonly store = inject(ProgressStore);
  protected readonly total = FACTS.length;
  private readonly play = viewChild.required<ElementRef<HTMLAnchorElement>>('play');

  constructor() {
    afterNextRender(() => this.play().nativeElement.focus());
  }
}
