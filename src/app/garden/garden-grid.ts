import { Component, computed, inject } from '@angular/core';
import { factKey, stageOf } from '../game/facts';
import { Level } from '../game/growth';
import { ProgressStore } from '../progress/progress-store';

type CellState = Level | 'locked';

const STATE_NAMES: Record<CellState, string> = {
  seed: 'nasionko',
  sprout: 'kiełek',
  flower: 'kwiatek',
  locked: 'zakryte',
};

const NUMBERS = Array.from({ length: 10 }, (_, i) => i + 1);

@Component({
  selector: 'app-garden-grid',
  styleUrl: './garden-grid.css',
  template: `
    <table>
      <caption class="visually-hidden">
        Ogród tabliczki mnożenia
      </caption>
      <thead>
        <tr>
          <th scope="col"><span class="visually-hidden">razy</span></th>
          @for (n of numbers; track n) {
            <th scope="col">{{ n }}</th>
          }
        </tr>
      </thead>
      <tbody>
        @for (row of rows(); track row.n) {
          <tr>
            <th scope="row">{{ row.n }}</th>
            @for (cell of row.cells; track cell.label) {
              <td [class]="cell.state">
                <span class="visually-hidden">{{ cell.label }}</span>
              </td>
            }
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class GardenGrid {
  private readonly store = inject(ProgressStore);
  protected readonly numbers = NUMBERS;

  protected readonly rows = computed(() => {
    const unlocked = this.store.unlockedStage();
    return NUMBERS.map((r) => ({
      n: r,
      cells: NUMBERS.map((c) => {
        const state: CellState =
          stageOf(r, c) > unlocked ? 'locked' : this.store.factProgress(factKey(r, c)).level;
        return { state, label: `${r} × ${c}, ${STATE_NAMES[state]}` };
      }),
    }));
  });
}
