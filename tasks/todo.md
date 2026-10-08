# Tasks: Ogród Tabliczki

Plan: [plan.md](plan.md) · Spec: [SPEC.md](../SPEC.md)

Every task also meets the Definition of Done: tests pass, no regressions, behaviour verified at runtime, docs updated.
Standard verification commands:

- `npx ng test --watch=false`
- `npx ng lint` (from Task 2 onwards)
- `npm run build`

---

## Phase 1: Foundation

## Task 1: Clean client-only base

**Description:** Remove SSR, Express and hydration from the scaffold. Turn on strict TypeScript. Set `lang="pl"` and a Polish title. Replace the placeholder template with a minimal shell (`<main>` + router outlet). Add lazy routes: `''` → a placeholder garden page, and `**` → redirect to `''`.

**Acceptance criteria:**

- [x] No SSR remains: `src/server.ts`, `main.server.ts`, `app.config.server.ts` and `app.routes.server.ts` are deleted; the `server`, `ssr` and `outputMode` options are gone from `angular.json`; `@angular/ssr`, `@angular/platform-server`, `express` and `@types/express` are removed from `package.json`; `provideClientHydration` is removed.
- [x] `tsconfig.json` has `"strict": true`, and `angularCompilerOptions` has `"strictTemplates": true`.
- [x] `index.html` has `lang="pl"` and `<title>Ogród Tabliczki</title>`. The app shows the placeholder garden route.

**Verification:**

- [x] `npm install`, `npm run build` (output is in `dist/tabliczka-mnozenia-game/browser`) and `npx ng test --watch=false` all succeed
- [x] Manual: `npm start`, then open http://localhost:4200. The placeholder renders and the console shows no errors.

**Dependencies:** None
**Files:** `angular.json`, `package.json`, `tsconfig.json`, `src/index.html`, `src/app/app.{ts,html,css,config.ts,routes.ts,spec.ts}`, `src/app/garden/garden-page.ts` (placeholder); 4 server files deleted
**Scope:** M (mostly deletions)

## Task 2: Lint and axe tooling

**Description:** Run `ng add angular-eslint`, which includes the template accessibility rules. Add `axe-core` as a dev dependency, plus a small test helper `expectNoAxeViolations(element)` for component specs.

**Acceptance criteria:**

- [x] `npx ng lint` runs and passes, with the template accessibility rules enabled
- [x] `src/testing/axe.ts` exports a helper that fails the test and lists any violations. The contrast rule is turned off here, because jsdom can't evaluate it; contrast is checked in the browser instead.
- [x] The `App` spec uses the helper and passes

**Verification:**

- [x] `npx ng lint` and `npx ng test --watch=false` pass
- [x] Temporarily add an `<img>` without `alt`: the helper test fails and lint flags it. Then revert.

**Dependencies:** T1
**Files:** `package.json`, `eslint.config.js`, `angular.json`, `src/testing/axe.ts`, `src/app/app.spec.ts`
**Scope:** S

## Task 3: Facts, stages and growth rules

**Description:** Create the pure domain core:

- `facts.ts`: `FactKey`, the 55 facts, the stage table, and the tuning constants (unlock threshold, weights, number of new facts per round, ×0 frequency, auto-advance delay).
- `growth.ts`: `applyAnswer`.
- `random.ts`: a `RANDOM` injection token that defaults to `Math.random`.

**Acceptance criteria:**

- [x] There are exactly 55 facts with keys `a×b`, `a ≤ b`. `factKey(8, 7) === '7×8'`.
- [x] Stage assignment gives 19/15/11/10 facts for stages 1–4.
- [x] `applyAnswer` matches every row of the spec's growth table, including flower → wrong → sprout → correct (stays a sprout) → correct (becomes a flower).

**Verification:**

- [x] `npx ng test --watch=false`: the specs in `game/` pass, with ≥ 90% coverage for these files

**Dependencies:** T1
**Files:** `src/app/game/facts.ts`, `facts.spec.ts`, `growth.ts`, `growth.spec.ts`, `src/app/random.ts`
**Scope:** S

### ◆ Checkpoint A: Foundation

- [x] Tests, lint and build are green; the app loads with no console errors
- [ ] Human review

---

## Phase 2: Playable Loop

## Task 4: Progress store with persistence

**Description:** Create `ProgressStore` (`@Service`) with:

- a `progress` signal: per-fact state, `unlockedStage` and `zeroRuleCorrect`
- computed views: fact state by key, unlocked facts, flower count
- `recordAnswer(key, correct)`, `recordZeroRule(correct)`, `unlockNextStageIfReady()` and `reset()`

The store saves to `localStorage` key `ogrod-tabliczki:v1` after every change.

**Acceptance criteria:**

- [x] Load → change → reload round-trips the state exactly
- [x] Corrupt JSON, an unknown `version`, or `localStorage` throwing all fall back to a fresh state without an exception
- [x] `unlockNextStageIfReady()` unlocks at most one stage, only when ≥ 80% of the unlocked facts are sprout or flower, and returns the newly unlocked tables (or `null`)

**Verification:**

- [x] `npx ng test --watch=false`: the store spec passes

**Dependencies:** T3
**Files:** `src/app/progress/progress-store.ts`, `progress-store.spec.ts`
**Scope:** S

## Task 5: Garden screen (plain grid)

**Description:** Build `GardenPage` and `GardenGrid`:

- a semantic `<table>` with 1–10 row and column headers and 100 cells
- a CSS state class for each cell (`seed`, `sprout`, `flower` or `locked`), shown as plain colours plus a simple shape (CSS) so colour is never the only signal
- visually hidden labels (e.g. "7 × 8, kwiatek")
- the counter "🌸 N / 55"
- a **▶ Graj** button, with initial focus, that links to `/graj`

**Acceptance criteria:**

- [x] With a fresh state: 36 seed cells and 64 locked cells; the counter reads 0 / 55. Mirrored cells (3×7 and 7×3) share the same state.
- [x] The cells are not focusable. Screen-reader labels match the spec. The Graj button is focused on load.
- [x] axe helper: 0 violations

**Verification:**

- [x] `npx ng test --watch=false`: the garden specs pass
- [x] Manual (browser MCP): screenshot at 360 px and at desktop width; no horizontal scroll

**Dependencies:** T4
**Files:** `src/app/garden/garden-page.ts`, `garden-grid.ts`, `garden-grid.css`, `garden-grid.spec.ts`, `src/styles.css`
**Scope:** M

## Task 6: Round builder and distractors

**Description:** Create:

- `distractors(a, b, random)`
- `buildRound(progress, random)`, which returns 10 problem slots, including the ×0 rule slot
- `insertRetry(round, index)`, which re-queues a wrongly answered fact 2–3 slots later

**Acceptance criteria:**

- [x] Distractors: for all 55 facts there are always exactly 2, distinct, ≥ 0 and never equal to the correct product
- [x] The round invariants hold over 1000 seeded runs:
  - exactly 10 problems, all from unlocked facts
  - ≤ 3 never-attempted facts while other candidates exist (soft limit); a fresh garden still gets 10 problems
  - no fact twice in a row, and ≤ 2 appearances per fact
  - a ×0 slot whenever `zeroRuleCorrect < 3`, and about 1/3 of rounds after that
- [x] The retry lands 2–3 slots later only if room remains, at most once per fact, never replaces ×0, never back to back, respects ≤ 2 per fact, and the round stays at 10 problems

**Verification:**

- [x] `npx ng test --watch=false`: the specs pass; `game/` coverage is ≥ 90%

**Dependencies:** T3
**Files:** `src/app/game/distractors.ts`, `distractors.spec.ts`, `round-builder.ts`, `round-builder.spec.ts`
**Scope:** S

## Task 7: Round with answer bubbles

**Description:** Build `RoundPage` (lazy route `graj`) and `AnswerBubbles`. Create a round with the round builder and show one problem at a time in large digits, in random order (a × b or b × a). Add the 10-dot progress indicator with "Zadanie N z 10".

For this task, **every** problem is answered with bubbles. Answers are recorded through the store. A correct answer shows "Brawo!" and moves on automatically after the delay constant. A wrong answer shows the correct answer and a **Dalej** button; the dot array comes in T9. After problem 10 the page goes back to the garden; the summary comes in T10. The ✕ button returns to the garden at any time.

**Acceptance criteria:**

- [x] Tapping the correct bubble records the answer, announces "Dobrze!" (live region) and advances after the delay. Tapping a wrong one records it and waits for Dalej.
- [x] Focus moves to the first bubble on each new problem. The bubbles are ≥ 64 px.
- [x] Progress persists after each answer: reloading mid-round keeps the earlier answers.

**Verification:**

- [x] `npx ng test --watch=false`: the round page and bubbles specs pass (fake timers), and the axe helper reports 0 violations
- [x] Manual (browser MCP): play a full round; the garden updates; no console errors

**Dependencies:** T4, T5, T6
**Files:** `src/app/round/round-page.ts`, `round-page.spec.ts`, `answer-bubbles.ts`, `answer-bubbles.spec.ts`, `src/app/app.routes.ts`
**Scope:** M

## Task 8: Number pad

**Description:** Build `NumberPad`: an output field plus keys 0–9, ⌫ and ✓, limited to 3 digits, with ✓ disabled while empty. The physical keys (digits, Backspace, Enter) are handled through the component's `host` bindings. `RoundPage` shows the number pad for sprout and flower facts and for the ×0 rule, and bubbles for seeds.

**Acceptance criteria:**

- [x] Digits are added up to 3; ⌫ deletes; ✓ emits the number and clears the field. Confirming an empty field is impossible.
- [x] The physical keyboard gives the same results as the on-screen keys. The keys are ≥ 64 px.
- [x] The round uses the correct input mode for each level. ×0 problems update `zeroRuleCorrect` and not the garden.

**Verification:**

- [x] `npx ng test --watch=false`: the number pad and round specs pass; axe reports 0 violations
- [x] Manual: answer one problem by touch (emulated) and one by keyboard only

**Dependencies:** T7
**Files:** `src/app/round/number-pad.ts`, `number-pad.spec.ts`, `round-page.ts`, `round-page.spec.ts`
**Scope:** S

## Task 9: Wrong-answer feedback

**Description:** Build `DotArray` and wire it into the wrong-answer state in `RoundPage`:

- "Prawie!", the equation with the correct answer, and the dot array (`a` rows of `b`, `role="img"`, Polish label)
- focus on **Dalej**
- the live region announcement
- the retry inserted through `insertRetry`

For ×0, the dot array shows `n` empty rows and the label "0 kropek".

**Acceptance criteria:**

- [x] A wrong answer shows `a × b = product` plus a dot array with exactly a·b dots and the label from the spec. Focus is on Dalej, and there's no automatic advance.
- [x] The wrongly answered fact reappears 2–3 problems later (once), and the round still has 10 problems
- [x] axe reports 0 violations in the wrong-answer state

**Verification:**

- [x] `npx ng test --watch=false` passes
- [x] Manual: answer wrong on purpose; check the dots, the focus and the retry

**Dependencies:** T8
**Files:** `src/app/round/dot-array.ts`, `dot-array.spec.ts`, `round-page.ts`, `round-page.spec.ts`
**Scope:** S

## Task 10: Round summary and stage unlock

**Description:** Build `RoundSummary`, shown after problem 10. It shows the plants that grew ("+N 🌸", "+N 🌿"). The unlock check `unlockNextStageIfReady()` runs at the end of the round (not when the round is left with ✕), and "Nowe grządki!" appears with the new tables. **▶ Jeszcze raz** is focused by default; **🌱 Ogród** goes back to the garden.

**Acceptance criteria:**

- [x] The growth counts in the summary match the changes in the round
- [x] The unlock happens only at the end of a full round, at most one stage, at ≥ 80%. The new beds then appear as seeds in the garden.
- [x] Jeszcze raz starts a new round; Ogród goes to the garden; axe reports 0 violations

**Verification:**

- [x] `npx ng test --watch=false` passes
- [x] Manual: seed the progress so stage 1 is at 79% and then 80%; play a round; check that the unlock happens and the garden updates

**Dependencies:** T9
**Files:** `src/app/round/round-summary.ts`, `round-summary.spec.ts`, `round-page.ts`, `round-page.spec.ts`
**Scope:** S

## Task 10a: Responsive scale (from the playtest)

**Description:** Make the UI grow with the screen: a fluid root font size limited by viewport width and height, and a garden grid sized to the viewport height.

**Acceptance criteria:**

- [x] Root font size: 100% on phones, up to 175% on large desktops; respects the browser's default font size
- [x] Garden (grid + Graj) and every round screen fit without vertical scrolling at 1024×768, 1280×800, 1440×900 and 1920×1080
- [x] No horizontal scrolling at 360 px; bubbles and keys stay ≥ 64 px

**Verification:**

- [x] `npx ng test --watch=false`, `npx ng lint`, `npm run build`
- [x] Manual (browser MCP): measure scroll sizes and take screenshots at 360×780, 768×1024, 1024×768, 1440×900, 1920×1080

**Dependencies:** T10
**Files:** `src/styles.css`, `src/app/garden/garden-grid.css`, `src/app/garden/garden-page.css`, `src/app/round/round-page.css`
**Scope:** S (side-by-side layouts on wide landscape screens were needed: a stacked garden is height-limited)

## Task 10b: Centred stage

**Description:** Make `<main>` a centred stage with fluid, safe-area-aware padding (`--stage-pad`) and safe vertical centring. Update the garden size formulas to subtract the stage padding, keep the round's answer area at a stable height, and remove the per-page centring and padding that this makes redundant. Idea: [docs/ideas/centred-stage.md](../docs/ideas/centred-stage.md).

**Acceptance criteria:**

- [x] Content is centred in both directions at 360×780, 768×1024, 1024×768, 1440×900 and 1920×1080, and every interactive element is ≥ 16 px from the window edge
- [x] The question line moves by less than 2 px between the question, pad, correct and wrong states
- [x] At 740×360 the top of every screen is reachable; no new scrolling at ≥ 1024×768 and no horizontal scroll at 360 px

**Verification:**

- [x] `npx ng test --watch=false`, `npx ng lint`, `npm run build`
- [x] Manual (browser MCP): measure the gaps around the content and the question position at every size, plus screenshots

**Dependencies:** T10a
**Files:** `src/index.html`, `src/styles.css`, `src/app/garden/garden-grid.css`, `src/app/garden/garden-page.css`, `src/app/round/round-page.{ts,css}`
**Scope:** S

### ◆ Checkpoint B: Playable MVP and child playtest

- [x] Tests, lint and build are green; success criteria 1–7 are met
- [x] Decide how the tablet opens the app (plan.md, Open Question 1): installed from GitHub Pages to the home screen (Task 15)
- [x] Child playtest: no explanation, observe silently, note where they get stuck
  - 2026-10-07: the kids played without questions and chose **Jeszcze raz** on their own. Feedback: the desktop view is too small → responsive scaling (Task 10a).
- [ ] Human review: adjust the constants or rules (spec update first) before Phase 3

---

## Phase 3: Polish and Ship-Readiness

## Task 10c: Encouragement when nothing grew

**Description:** When a round grows nothing, the summary shows "🌱 Próbuj dalej!" instead of an empty list.

**Acceptance criteria:**

- [x] With 0 sprouts and 0 flowers the summary shows "Próbuj dalej!" (icon hidden from screen readers); otherwise it doesn't
- [x] axe reports 0 violations

**Verification:**

- [x] `npx ng test --watch=false`, `npx ng lint`, `npm run build`

**Dependencies:** T10
**Files:** `src/app/round/round-summary.{ts,css,spec.ts}`
**Scope:** XS

## Task 11: Reset dialog

**Description:** Build `ResetDialog` as a native `<dialog>`, opened by the ⚙ button on the garden. It asks "Wyczyścić cały ogród?". **Wyczyść** is enabled only after the parent types `USUŃ` (case-insensitive). **Anuluj** and Esc close the dialog, and focus returns to ⚙.

**Acceptance criteria:**

- [x] Wyczyść stays disabled until the input matches `usuń`/`USUŃ`. Confirming resets the store, and the garden shows the fresh state.
- [x] Closing in any way returns focus to ⚙. The dialog has an accessible name.
- [x] axe reports 0 violations with the dialog open

**Verification:**

- [x] `npx ng test --watch=false` passes
- [x] Manual: keyboard only — open the dialog, type the word, reset; and open, then Esc

**Dependencies:** T4, T5
**Files:** `src/app/garden/reset-dialog.ts`, `reset-dialog.spec.ts`, `garden-page.ts`
**Scope:** S

## Task 12: SVG garden art and grow animation

**Description:** Draw `seed.svg`, `sprout.svg`, `flower.svg` and `soil-covered.svg` in `src/plants/` (relative CSS `url()`s, so the build bundles and hashes them and they work under the GitHub Pages sub-path): flat style, each ≤ 4 kB, each state a clearly different shape. Apply them through the garden CSS classes as background images (replacing the plain colours). Style the round screens to match the garden, and show the newly grown plant with a short grow animation in the round's correct-answer feedback when the level goes up (spec: Round screen), turned off under `prefers-reduced-motion`.

**Acceptance criteria:**

- [x] The 4 SVGs are each ≤ 4 kB and use no external references. The plants have ≥ 3:1 contrast against the soil, and the states are distinguishable in greyscale.
- [x] The garden and round screens use the art; the grow animation plays only when motion is allowed
- [x] Lighthouse accessibility is 100 on the garden and the round

**Verification:**

- [x] `npm run build` stays within the budgets
- [x] Manual (browser MCP): screenshots in colour and in a greyscale emulation, plus emulated reduced motion; Lighthouse audit

**Dependencies:** T5 (best after Checkpoint B)
**Files:** `src/plants/*.svg`, `src/plants/plants.spec.ts`, `src/app/garden/garden-grid.css`, `src/app/round/round-page.{ts,css,spec.ts}`
**Scope:** M

## Task 13: PWA offline support

**Description:** Run `ng add @angular/pwa`. Set the manifest to Polish (name "Ogród Tabliczki", short name, theme colours that match the art) and replace the default icons with a flower icon. The service worker should cache the whole app shell, including the plant SVGs, and check for updates on load.

**Acceptance criteria:**

- [x] A production build registers the service worker. The manifest is valid and the app is installable.
- [x] After one online load, the app loads and plays a full round with the network disabled
- [x] The network panel shows only same-origin requests

**Verification:**

- [x] `npm run build`, then `npx http-server dist/tabliczka-mnozenia-game/browser -p 8080`
- [x] Manual (Chrome DevTools MCP): load the app, switch to offline, reload, play; run the Lighthouse PWA/installability check

**Dependencies:** T1 (best after T12, so the icons match the art)
**Files:** `angular.json`, `package.json`, `ngsw-config.json`, `public/manifest.webmanifest`, `public/icons/*`, `src/app/app.config.ts`, `src/index.html`
**Scope:** M

## Task 14: Final accessibility and responsive pass

**Description:** Verify every success criterion in the spec end-to-end, and fix any gaps that turn up.

**Acceptance criteria:**

- [x] AXE (in the browser) reports 0 violations on the garden, the round (question, correct and wrong states), the summary and the reset dialog. Lighthouse accessibility is 100.
- [x] A keyboard-only playthrough of a full loop works. No horizontal scroll at 360 px. Tablet portrait and landscape are usable.
- [x] All 12 success criteria in the spec are checked off, and `game/` coverage is ≥ 90%
- [x] Focus isn't lost while the "Brawo!" feedback is shown (noticed in T7: the bubbles are removed, so focus falls to `body` for ~1.2 s)

**Verification:**

- [x] `npx ng test --watch=false --coverage`, `npx ng lint` and `npm run build`
- [x] Manual (browser MCP): screenshots at 360 px, 768 px portrait and landscape, and desktop

**Dependencies:** T1–T13
**Files:** fixes only, as needed
**Scope:** S–M
**Outcome (2026-10-07):**

- Fixed: after a correct answer, focus now rests on the "Brawo!" feedback (`tabindex="-1"`) instead of falling to `body`. Reproduction test added.
- axe-core in Chrome, all rules including colour contrast: 0 violations on the garden, question (bubbles and pad), correct, wrong, summary and reset dialog. Lighthouse accessibility 100 on `/` (mobile) and `/graj` (desktop).
- Keyboard only: Graj → bubbles by Tab/Enter, pad by typing, Dalej by Enter, summary → Ogród, ⚙ → type USUŃ → Enter. Focus is never on `body`, and returns to ⚙ after the reset.
- Sizes 360×780, 768×1024, 1024×768, 1280×800, 1440×900, 1920×1080, with a stage-4 garden and a wrong answer on an 8–10 row fact (the tallest dot array): no horizontal or vertical scroll, at least 16 px from every edge. Phone landscape (740×360, not a target) scrolls vertically with nothing cut off.
- Coverage: `app/game` 97.9% statements, 96.8% branches; 141 tests; lint and build clean.

## Task 15: Publish on GitHub Pages

**Description:** Create the GitHub repository (name, visibility and account confirmed by the owner first), push the branch, and publish the production build to GitHub Pages with the repository base href and a `404.html` fallback.

**Acceptance criteria:**

- [x] The live HTTPS URL loads the garden; `/<repo>/graj` deep link works (https://andbroz.github.io/ogrod-tabliczki/)
- [x] After one online visit on the tablet, the app installs and plays a full round offline (desktop Chrome and the real tablet)
- [x] Only same-origin requests on the live site

**Verification:**

- [x] Manual (browser MCP) on the live URL: load, deep link, offline reload, network panel
- [x] On the real tablet: add to home screen, go offline, play (2026-10-07: installs, all SVGs render, playable in airplane mode)

**Dependencies:** T13 (and T14)
**Note:** `<meta name="description">` added (the only failing Lighthouse SEO audit, found in T12).
**Outcome (2026-10-07):** public repo `andbroz/ogrod-tabliczki`, Pages source = GitHub Actions. The first run had to be started manually because Actions wasn't enabled on the new repo yet.
**Files:** `angular.json` or build script, `.github/workflows/*` (if a Pages workflow is used), `README.md`
**Scope:** S

### ◆ Checkpoint C: Complete

- [x] All spec success criteria are met (verified in Task 14; offline on the real tablet in Task 15)
- [x] Human review (2026-10-07: approved by the owner)
