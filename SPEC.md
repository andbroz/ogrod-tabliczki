# Spec: Ogród Tabliczki

Source idea: [docs/ideas/ogrod-tabliczki.md](docs/ideas/ogrod-tabliczki.md)

## Assumptions
1. One child, one device; progress is stored only in that browser's `localStorage`.
2. The app is client-only: SSR, Express and hydration are removed from the scaffold.
3. Offline support uses the Angular service worker (`@angular/pwa`); it is active only in production builds.
4. Modern evergreen browsers (Chrome, Edge, Safari, Firefox, iPadOS Safari). No IE or legacy support.
5. The UI is Polish only (`lang="pl"`), with no i18n framework; copy lives in templates.
6. All randomness goes through an injectable random source so the game logic is deterministic in tests.
7. The SVG art is drawn by hand for this project; no external assets, fonts or CDNs.

## Objective
A garden-themed game that helps a **7–9-year-old weak reader** practise the multiplication table **1–10 × 1–10**, plus the rule "× 0 = 0", alone and happily.

**Success:** the child returns to it voluntarily and the garden fills up with flowers.

### User stories
- **US-1** As the child, I open the app and immediately see my garden (100 cells) and how many flowers I have, without reading anything.
- **US-2** As the child, I press one big **Graj** button and get a short round of 10 problems.
- **US-3** As the child, I answer a new fact by tapping one of 3 big answer bubbles.
- **US-4** As the child, I answer a fact I already know a bit by typing on a big number pad (or a keyboard).
- **US-5** As the child, when I get it wrong I see dots that show *why*, plus the right answer, and I continue when I'm ready.
- **US-6** As the child, at the end of a round I see which plants grew, and when new garden beds open up.
- **US-7** As the parent, I can reset the garden, and the child can't do it by accident.
- **US-8** As the parent, the app works offline after the first visit and sends no data anywhere.

## Domain Rules

### Facts
- A **fact** is an unordered pair `{a, b}` with `1 ≤ a ≤ b ≤ 10`. That gives **55 facts**. Key format: `"a×b"` with `a ≤ b` (e.g. `"7×8"`).
- In the garden, the cells for row `r`, column `c` and row `c`, column `r` show the **same** fact.
- In a round, a fact is shown as `a × b` or `b × a`, chosen at random.

### Growth (per fact)
State: `level ∈ {seed, sprout, flower}` and `streak` (consecutive correct answers), both starting at `seed` / `0`.

| Event | Effect |
|---|---|
| Correct | `streak += 1`; if `streak ≥ 2` → `flower`; else if `seed` → `sprout` |
| Wrong | `streak = 0`; level drops one step (`flower → sprout`, `sprout → seed`, `seed` stays) |

**Input mode** depends on the level when the problem is shown: `seed` → **answer bubbles**; `sprout`/`flower` → **number pad**.

Because of these rules, a flower always needs 2 correct answers in a row, and the second one is always typed. Nothing changes when the child doesn't play.

### Stages (unlocking)
A fact belongs to the first stage that contains **either** of its factors.

| Stage | Tables | New facts |
|---|---|---|
| 1 | ×1, ×2 | 19 |
| 2 | ×5, ×10 | 15 |
| 3 | ×3, ×4 | 11 |
| 4 | ×6, ×7, ×8, ×9 | 10 |

- Stage 1 is unlocked at the start.
- The next stage unlocks **at the end of a round** when **≥ 80%** of the facts in the unlocked stages are `sprout` or `flower`.
- At most one stage unlocks per round.
- Locked facts appear in the garden as covered soil.
- The stage table and the threshold are constants in one file.

### Round composition (10 problems)
1. Candidates are the facts in the unlocked stages.
2. Weighted random pick, with weights `seed` = 3, `sprout` = 3, `flower` = 1, so flowers come back as review.
3. A round introduces at most **3 never-attempted facts** while other candidates remain. This is a soft limit: when only never-attempted facts are left (e.g. the very first round), more are added so the round still has 10 problems.
4. The same fact never appears twice in a row and appears at most twice per round.
5. **Retry of mistakes:** a fact answered wrong is asked again **once**, 2–3 problems later in the same round, if slots remain. The retry uses the normal growth rules and input mode, and it replaces a regular pick, so the round stays at 10. A retry never replaces the ×0 problem, never puts the same fact back to back, and respects the limit of 2 appearances per fact.
6. **×0 rule problem:** `n × 0` or `0 × n` with `n` from 1 to 10, answered on the number pad.
   - It's included in 1 slot per round until the child has answered 3 ×0 problems correctly in total.
   - After that, it's included with a probability of 1/3 per round.
   - It doesn't affect the garden.

### Answer bubbles (seed facts)
- Three bubbles: the correct product and 2 distractors, in shuffled order.
- Distractors are picked from the neighbouring products `a×(b±1)` and `(a±1)×b`, with both factors staying in 1–10.
- If there aren't enough of those, `product ± 1` and `± 2` are used instead.
- Distractors are always distinct, `≥ 0`, and never equal to the correct product.

### Number pad (sprout/flower facts and ×0)
- On-screen keys: `0`–`9`, `⌫` (delete) and `✓` (confirm). Up to 3 digits.
- `✓` is disabled while the field is empty.
- Physical keyboard: digits, `Backspace` and `Enter` work the same way.

## Screens & Behaviour

Routes are lazy-loaded: `''` → garden, `'graj'` → round. Any unknown route redirects to `''`.

### Garden (`''`)
- A semantic `<table>` with column and row headers 1–10 and 100 cells.
- Each cell shows a seed, sprout, flower or covered-soil image through a CSS `background-image` class.
- The cells are **not focusable**; each has a visually hidden name, e.g. "7 × 8, kwiatek" or "7 × 8, zakryte".
- A counter "🌸 12 / 55", with an accessible text equivalent.
- A big **▶ Graj** button that receives initial focus.
- A small ⚙ button that opens the reset dialog.
- The garden fits in a 360 px wide viewport without horizontal scrolling.

### Round (`'graj'`)
- The problem is shown in large digits, e.g. `7 × 8 = ?`.
- Progress is shown as 10 dots (done / current / remaining), with an accessible "Zadanie 3 z 10".
- **Correct answer:** a check mark and "Brawo!", plus a grow animation if the level went up. The game moves on automatically after about 1.2 s.
- **Wrong answer:**
  - "Prawie!" and the equation with the correct answer (`7 × 8 = 56`).
  - A **dot array** of `a` rows of `b` dots, grouped by row. It has `role="img"` and the label "7 rzędów po 8 kropek, razem 56".
  - A **Dalej ➜** button that receives focus. There's no time limit.
- **Focus management:** on each new problem, focus moves to the first bubble, or to the number pad input.
- **Announcements:** an `aria-live="polite"` region announces "Dobrze!" or "Prawie! 7 razy 8 to 56".
- **Leaving:** a small ✕ button leaves the round and returns to the garden. Answers already given are kept; the unlock check is skipped.

### Round summary (inside the round route)
- The plants that grew in this round, as icons and counts (e.g. "+3 🌸", "+2 🌿"). When nothing grew, a short encouragement instead: "🌱 Próbuj dalej!".
- If a stage unlocked: "Nowe grządki!" with the new tables (e.g. "×3 ×4").
- Buttons: **▶ Jeszcze raz** (a new round, focused by default) and **🌱 Ogród**.

### Reset dialog
- A native `<dialog>` that asks "Wyczyścić cały ogród?".
- **Wyczyść** is enabled only after the parent types `USUŃ` into a text field (case-insensitive). This works as a gate a weak reader can't pass by accident, and it's fully keyboard and screen-reader accessible.
- **Anuluj** and `Esc` close the dialog, and focus returns to ⚙.

### Persistence
- `localStorage` key `ogrod-tabliczki:v1`, holding JSON in this shape:
  ```ts
  { version: 1, facts: Record<FactKey, { level: 'seed' | 'sprout' | 'flower'; streak: number; attempts: number }>,
    unlockedStage: 1 | 2 | 3 | 4, zeroRuleCorrect: number }
  ```
- Progress is saved after **every answer**, so closing the tab mid-round loses nothing.
- If the stored value is missing, malformed or has an unknown version, the game starts fresh without crashing.
- If `localStorage` is unavailable, the game runs in memory and doesn't crash.

### Copy (complete MVP list)
`Graj`, `Jeszcze raz`, `Ogród`, `Dalej`, `Brawo!`, `Prawie!`, `Nowe grządki!`, `Próbuj dalej!`, `Zadanie N z 10`, `Wyczyścić cały ogród?`, `Wpisz USUŃ, aby potwierdzić`, `Wyczyść`, `Anuluj`, the accessible names `Wyczyść ogród` (⚙), `Wróć do ogrodu`, `Twoja odpowiedź`, `Usuń`, `Sprawdź`, plus the cell labels `nasionko` / `kiełek` / `kwiatek` / `zakryte`. Every child-facing button pairs its word with an icon.

## Non-Functional Requirements
- **Accessibility:**
  - 0 AXE violations on every screen; WCAG 2.2 AA.
  - Contrast: text ≥ 4.5:1 (≥ 3:1 for large text); plant graphics and UI component boundaries ≥ 3:1 against their background.
  - The plant states differ in **shape**, not only colour.
  - Visible focus on every interactive element; `lang="pl"`.
  - Animations are disabled under `prefers-reduced-motion: reduce`.
- **Touch:** interactive targets ≥ 48×48 CSS px; answer bubbles and number pad keys ≥ 64×64 CSS px.
- **Layout:** works from 360 px (phone portrait) up to desktop; usable on tablet in both portrait and landscape.
- **Responsive scale:** the UI grows with the screen. The root font size scales with the viewport (100% of the browser default on phones, up to 175% on large desktops) and all sizes are in `rem`. On wide landscape screens (≥ 48rem) the garden shows the title, counter and Graj next to the grid, and a wrong answer shows the dot array next to the solution. The garden (grid + Graj) and every round screen fit without vertical scrolling at 1024×768 and larger.
- **Centred stage:** every screen is centred horizontally and vertically in the window, with a fluid margin (about 16 px on phones up to about 48 px on desktops) plus the device safe-area insets (`viewport-fit=cover`). Screens taller than the window start at the top and scroll, and are never cut off. On the round screen the question line doesn't move between the question, pad, correct and wrong states. See [docs/ideas/centred-stage.md](docs/ideas/centred-stage.md).
- **Offline:** after one online visit to a production build, the app loads and plays fully offline.
- **Privacy:** no network requests except the app's own static assets; no analytics, third-party fonts or CDNs.
- **Performance:** the production initial bundle stays within the existing budget (warning at 500 kB); each SVG plant is ≤ 4 kB.

## Hosting
- Published as a static site on **GitHub Pages** (HTTPS), so the tablet can install it and play offline after the first visit.
- Built with the repository path as the base href; a `404.html` copy of `index.html` lets deep links (e.g. `/graj`) work on Pages.
- Publishing happens only from an explicit, confirmed push; nothing is deployed automatically without the owner's approval.

## Tech Stack
- Angular 22.2: standalone components, signals, zoneless/OnPush defaults, native control flow, lazy routes. Conventions follow [CLAUDE.md](CLAUDE.md).
- TypeScript ~6.0 with `"strict": true` and `strictTemplates` turned on (currently missing from the scaffold).
- `@angular/service-worker` added via `ng add @angular/pwa`.
- Vitest 5 + jsdom through `@angular/build:unit-test`.
- Prettier 3 (existing `.prettierrc`).
- Removed: `@angular/ssr`, `@angular/platform-server`, `express`, `@types/express`, together with the server entry files and the `angular.json` SSR options.

## Commands
```
Dev server:        npm start                         # ng serve, http://localhost:4200
Build (prod):      npm run build                     # dist/tabliczka-mnozenia-game/browser
Unit tests:        npx ng test --watch=false
Unit + coverage:   npx ng test --watch=false --coverage
Format check:      npx prettier --check .
Format fix:        npx prettier --write .
Offline/PWA check: serve dist/tabliczka-mnozenia-game/browser with a static server, then
                   reload with the network disabled in DevTools (static server: see Open Questions)
```

## Project Structure
```
src/app/
  game/                     → pure domain logic, no Angular imports
    facts.ts                → FactKey, all 55 facts, stages, constants (threshold, weights)
    growth.ts               → applyAnswer(state, correct) transition
    round-builder.ts        → buildRound(progress, random), retry insertion, ×0 rule
    distractors.ts          → distractors(a, b, random)
    *.spec.ts               → unit tests next to each file
  progress/
    progress-store.ts       → @Service: progress signal + localStorage load/save/reset
  garden/
    garden-page.ts          → route '' (lazy)
    garden-grid.ts          → 10×10 table
    reset-dialog.ts
  round/
    round-page.ts           → route 'graj' (lazy), round state signals
    answer-bubbles.ts
    number-pad.ts
    dot-array.ts
    round-summary.ts
  random.ts                 → RANDOM injection token (defaults to Math.random)
src/plants/                 → seed.svg, sprout.svg, flower.svg, soil-covered.svg, referenced by
                              relative CSS url()s so the build bundles and hashes them (works under
                              the GitHub Pages sub-path)
public/
  manifest.webmanifest, icons/ (generated by ng add @angular/pwa, recoloured)
docs/ideas/                 → idea one-pagers
SPEC.md                     → this file
tasks/                      → plan.md, todo.md (next phase)
```

## Code Style
Domain logic is pure, typed and free of Angular dependencies. Components are small, use signals, and keep inline templates when they're short.

```ts
// game/growth.ts
export type Level = 'seed' | 'sprout' | 'flower';
export interface FactProgress {
  readonly level: Level;
  readonly streak: number;
  readonly attempts: number;
}

const DOWN: Record<Level, Level> = { flower: 'sprout', sprout: 'seed', seed: 'seed' };

export function applyAnswer(p: FactProgress, correct: boolean): FactProgress {
  const attempts = p.attempts + 1;
  if (!correct) return { level: DOWN[p.level], streak: 0, attempts };
  const streak = p.streak + 1;
  const level = streak >= 2 ? 'flower' : p.level === 'seed' ? 'sprout' : p.level;
  return { level, streak, attempts };
}
```

```ts
// round/answer-bubbles.ts
@Component({
  selector: 'app-answer-bubbles',
  template: `
    @for (option of options(); track option) {
      <button type="button" class="bubble" (click)="picked.emit(option)">{{ option }}</button>
    }
  `,
  styleUrl: './answer-bubbles.css',
})
export class AnswerBubbles {
  readonly options = input.required<readonly number[]>();
  readonly picked = output<number>();
}
```

**Conventions:**
- Files use kebab-case and classes use PascalCase, with no `Component` suffix (as in the scaffold's `App`).
- No `any`; prefer `readonly` data and `computed()` for derived state.
- `update`/`set` only, never `mutate`.
- No `ngClass`/`ngStyle`, `CommonModule`, `@HostBinding` or `@HostListener`.
- `NgOptimizedImage` doesn't apply: all images are CSS backgrounds.

## Testing Strategy
- **Domain logic (`src/app/game/`):** Vitest unit tests. Coverage target: **≥ 90% lines and branches**.
  - `growth`: every transition in the growth table.
  - `facts`: 55 facts and the stage counts 19/15/11/10.
  - `round-builder`: 10 problems, only unlocked facts, ≤ 3 new facts, no back-to-back repeats, ≤ 2 per fact, retry placement, ×0 frequency, unlock threshold. Uses a seeded fake `random`.
  - `distractors`: distinct values, ≥ 0, never correct, always 2. Checked for all 55 facts.
- **Store:** load/save round trip; corrupt JSON, wrong version and missing `localStorage` all fall back safely; reset.
- **Components (TestBed + Vitest):**
  - number pad: digits, max 3, delete, empty confirm disabled, keyboard Enter/Backspace.
  - bubbles: emit the picked value.
  - round page: correct leads to auto-advance; wrong shows the dot array and moves focus to Dalej; the summary appears after 10 problems.
  - garden: 100 cells, labels, locked cells.
  - reset dialog: the `USUŃ` gate.
- **Accessibility:**
  - Automated: axe-core run against each screen (see Open Questions).
  - At runtime: a Lighthouse accessibility audit through the Chrome DevTools MCP (target 100).
  - Manual: keyboard-only pass and a 360 px viewport check.
- **Runtime/e2e:** for each slice, use the Playwright or Chrome DevTools MCP to play one full round, take screenshots of the garden and the round, and check the console has no errors.
- **Offline:** production build, load once, switch to offline, reload, and play a round.

## Boundaries
- **Always:**
  - Follow CLAUDE.md conventions.
  - Keep game rules in `src/app/game/` as pure functions with tests.
  - Run `npx ng test --watch=false` and `npm run build` before declaring a task done.
  - Verify each UI slice in a real browser.
  - Keep copy in Polish.
- **Ask first:**
  - Adding any dependency not listed in Tech Stack.
  - Changing the growth, stage or round rules, or any tuning constant.
  - Changing the storage format (a migration may be needed).
  - Adding new screens or features.
- **Never:**
  - Send data off the device, or add analytics, tracking or third-party requests.
  - Add timers, time pressure, lives, decay or leaderboards.
  - Weaken tests or accessibility checks to get to green.
  - Commit secrets.

## Success Criteria
1. After a reset, the garden shows 100 cells: 36 cells for the 19 stage-1 facts as seeds, and every other cell as covered soil. The counter reads "🌸 0 / 55".
2. A round always has exactly 10 problems, built according to the round composition rules (this is checked by unit tests).
3. A seed fact is answered with 3 bubbles. A sprout or flower fact is answered on the number pad, and both the on-screen keys and the physical keyboard work.
4. The growth rules match the growth table exactly. A flower is reached only through 2 correct answers in a row.
5. A wrong answer shows the correct dot array and equation, and the game waits for **Dalej**. A correct answer moves on automatically.
6. The next stage unlocks at the end of a round once ≥ 80% of the unlocked facts are sprout or better, and the summary announces it.
7. Progress survives a reload and closing the tab mid-round. Corrupt storage doesn't crash the app.
8. Reset works only after typing `USUŃ`.
9. With the production build, the app loads and plays fully offline after the first visit. The network panel shows no third-party requests.
10. AXE reports 0 violations on the garden, round (question, correct and wrong states), summary and reset dialog. Lighthouse accessibility is 100. Everything can be done with the keyboard alone.
11. There's no horizontal scrolling at 360 px. Answer bubbles and number pad keys are ≥ 64 px. On desktop (e.g. 1440×900) the UI is visibly larger than on a phone, and the garden and round screens fit without scrolling at 1024×768 and larger.
12. `npx ng test --watch=false` passes, `src/app/game/` has ≥ 90% coverage, and `npm run build` succeeds within the budgets.

## Open Questions
1. **Dependencies to approve** (all dev-only, none shipped to the child's device):
   - `axe-core` for automated AXE checks in component tests. *Recommended.*
   - A static server for testing the offline/PWA build, e.g. `http-server` run via `npx` (nothing is installed). *Recommended.*
   - `angular-eslint` for linting, including its template accessibility rules. *Optional; my recommendation is to add it.*
   - `@playwright/test` for committed e2e tests. *Optional: browser checks through the Playwright MCP may be enough for this MVP.*
2. **Tuning defaults:** are the round weights (3/3/1), the ≤ 3 new facts per round, the ×0 frequency and the ~1.2 s auto-advance OK as starting values? They're all constants and easy to change after watching your child play.
