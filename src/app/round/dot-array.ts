import { Component, computed, input } from '@angular/core';

/** Polish plural form for 1–10 (and beyond): 1 → one, 2–4 → few, otherwise many. */
function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  return lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14) ? few : many;
}

@Component({
  selector: 'app-dot-array',
  styleUrl: './dot-array.css',
  template: `
    <div class="grid" role="img" [attr.aria-label]="label()">
      @for (r of rowIndexes(); track r) {
        <div class="row">
          @for (c of colIndexes(); track c) {
            <span class="dot"></span>
          }
        </div>
      }
    </div>
  `,
})
export class DotArray {
  readonly rows = input.required<number>();
  readonly cols = input.required<number>();

  protected readonly rowIndexes = computed(() => Array.from({ length: this.rows() }, (_, i) => i));
  protected readonly colIndexes = computed(() => Array.from({ length: this.cols() }, (_, i) => i));
  protected readonly label = computed(() => {
    const rows = this.rows();
    const cols = this.cols();
    if (rows * cols === 0) return '0 kropek';
    const rowWord = plural(rows, 'rząd', 'rzędy', 'rzędów');
    const dotWord = plural(cols, 'kropce', 'kropki', 'kropek');
    return `${rows} ${rowWord} po ${cols} ${dotWord}, razem ${rows * cols}`;
  });
}
