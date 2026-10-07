# Implementation Plan: Ogród Tabliczki

Spec: [SPEC.md](../SPEC.md) · Idea: [docs/ideas/ogrod-tabliczki.md](../docs/ideas/ogrod-tabliczki.md) · Tasks: [todo.md](todo.md)

## Overview
This plan builds the garden multiplication game as a client-only Angular 22 PWA. The order is:

1. Strip the scaffold down to a clean, strict, client-only base.
2. Build the pure game rules with tests.
3. Deliver the playable loop in vertical slices, using a plain coloured grid.
4. Stop and **test with the child**.
5. Add reset, offline, the SVG garden art and the final accessibility pass.

## Architecture Decisions
- **Pure domain core:** the game rules live in `src/app/game/` (facts, growth, distractors, round builder) as Angular-free pure functions that take an injected `random`. This makes the rules deterministic and easy to test, and the UI stays thin.
- **One state owner:** `ProgressStore` (`@Service`) holds progress in a signal and writes it to `localStorage` after every answer. Components read `computed()` views of it, and nothing else touches storage.
- **Round state is local:** `RoundPage` holds the current round's problems, index and feedback in signals. It isn't persisted, because only per-fact progress needs to survive a reload.
- **Garden before art:** the first garden uses coloured CSS classes per state. The SVG art (Task 12) only swaps the `background-image` per class, so the art can't block the playable loop.
- **Remove SSR first:** `localStorage`, `<dialog>` and the service worker are all browser-only. Removing SSR up front avoids platform guards everywhere.
- **Tooling decisions:** from the spec's open questions, resolved with the recommended defaults.
  - Added: `angular-eslint`, plus `axe-core` as a dev dependency for automated AXE checks in component tests.
  - Offline checks use `npx http-server`, so nothing gets installed.
  - `@playwright/test` is not added. Runtime checks go through the Playwright and Chrome DevTools MCP tools.
- **Accessibility checks need a real browser:** jsdom can't check colour contrast or layout, so axe in Vitest catches structure and ARIA issues. Contrast and the 360 px layout are verified with Lighthouse and screenshots in a real browser.

## Dependency Graph
```
T1 Clean base (no SSR, strict TS, lang=pl, routes)
 ├── T2 Tooling (eslint, axe helper)
 ├── T3 Facts + growth (pure) ──┬── T4 ProgressStore ──┬── T5 Garden (plain grid)
 │                              └── T6 Round builder + distractors ─┐
 │                                                     └────────────┴── T7 Round: bubbles flow
 │                                                                        ├── T8 Number pad
 │                                                                        ├── T9 Wrong-answer feedback
 │                                                                        └── T10 Summary + unlock
 │                                                        ◆ Checkpoint B: child playtest
 ├── T11 Reset dialog (needs T4, T5)
 ├── T12 SVG garden art (needs T5)
 ├── T13 PWA offline (needs T1)
 └── T14 Final a11y + responsive pass (needs all)
```

## Task List

### Phase 1: Foundation
- [x] Task 1: Clean client-only base
- [x] Task 2: Lint and axe tooling
- [ ] Task 3: Facts, stages and growth rules

### Checkpoint A: Foundation
- [ ] `npx ng test --watch=false`, `npx ng lint` and `npm run build` are all green
- [ ] The app loads in the browser with no console errors
- [ ] Human review

### Phase 2: Playable Loop
- [ ] Task 4: Progress store with persistence
- [ ] Task 5: Garden screen (plain grid)
- [ ] Task 6: Round builder and distractors
- [ ] Task 7: Round with answer bubbles
- [ ] Task 8: Number pad
- [ ] Task 9: Wrong-answer feedback (dot array, Dalej)
- [ ] Task 10: Round summary and stage unlock

### Checkpoint B: Playable MVP and child playtest
- [ ] A full loop works in the browser: garden → round → summary → garden. Progress survives a reload.
- [ ] Success criteria 1–7 from the spec are met
- [ ] **Child playtest:** hand over without explaining anything and observe (assumptions from the idea doc)
- [ ] Human review: adjust the tuning constants or rules before polishing

### Phase 3: Polish and Ship-Readiness
- [ ] Task 11: Reset dialog
- [ ] Task 12: SVG garden art and grow animation
- [ ] Task 13: PWA offline support
- [ ] Task 14: Final accessibility and responsive pass

### Checkpoint C: Complete
- [ ] All 12 success criteria in the spec are met
- [ ] Human review

## Parallelization
- After T1: **T2** and **T3** can run in parallel.
- After T3: **T4** and **T6** can run in parallel.
- T8, T9 and T10 all touch `round-page.ts`, so they run **sequentially**.
- In Phase 3, **T11, T12 and T13** are independent and can run in parallel. T14 runs last.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| SSR removal leaves stale config (angular.json, providers) and the build breaks | Med | T1 is first and is verified by both build and browser before anything else |
| Turning on `strict` reveals errors in scaffold code | Low | Done in T1, while the codebase is almost empty |
| Weighted-random round tests are flaky | Med | Seeded deterministic `random` in all domain tests; assert invariants, not exact sequences |
| Auto-advance timer is hard to test (zoneless) | Low | Vitest fake timers; the delay is a constant |
| jsdom's `<dialog>`/`showModal` support is partial | Low | Stub `showModal`/`close` in tests if needed; verify the real behaviour in the browser |
| axe in jsdom misses contrast and layout issues | Med | Lighthouse and screenshots in a real browser (T12, T14) |
| A cached service worker serves a stale version after an update | Med | Use the Angular SW defaults and check for an update on load; document "reload twice" for the parent |
| The child isn't motivated by the grid (the core bet) | High | Checkpoint B playtest before investing in art and polish |
| The child's tablet can't reach the app | High | See Open Question 1; must be decided before Checkpoint B |

## Open Questions
1. **How will the child's tablet open the app?** The spec doesn't cover this, and it's needed for the playtest at Checkpoint B. Options:
   - (a) `ng serve --host 0.0.0.0` on your laptop, opened on the tablet over home Wi-Fi. This is enough for the playtest, but there's no offline support and it only works on the same network.
   - (b) Static hosting (e.g. GitHub Pages or Netlify). This gives a real HTTPS install, so PWA and offline work on the tablet. It's a separate deployment step outside this plan, and it publishes the app. It may also need approval under company policy for personal projects on corporate accounts.

   Recommendation: (a) for Checkpoint B, then decide on (b) before Task 13.
