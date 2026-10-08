# Ogród Tabliczki — multiplication-table garden

## Problem Statement

How might we help a 7–9-year-old who is a weak reader practise the multiplication table up to 100, on their own and happily, so that they _want_ to come back every day?

## Recommended Direction

The game is a **garden**. The home screen is the multiplication table **1–10 × 1–10** as a garden bed: 100 cells, each one a plant that grows **🌱 seed → 🌿 sprout → 🌸 flower** as the child masters that fact. Progress is visible at a glance, without any reading, and the table itself becomes the thing the child collects. Commutative facts share one plant (7×8 = 8×7), giving **55 unique facts**.

The child taps **"Graj"** (a big icon button) to play a round of **10 problems**. A hidden smart order picks the problems: easy groups first (×1, ×10, ×2, ×5), then ×3, ×4 and ×9, then the hard core (×6, ×7, ×8). Facts answered wrong come back more often, and flowers come back occasionally for review. **×0 is not on the grid.** It's practised as a rule ("anything × 0 = 0") through an occasional ×0 problem in a round, which becomes rare once the child gets it right a few times.

New facts are answered by tapping **one of 3 big answer bubbles** with close wrong options (for 7×8: 54 / 56 / 63). Once a fact is a sprout, the answer is typed on the **number pad** (on-screen or keyboard), so guessing can't produce a flower. After a mistake, the game shows **a dot array** (7 rows of 8) so the child can see _why_, then the correct answer, gently. **No timers, lives, decay or leaderboards.**

Technically it's a client-only Angular 22 app: SSR removed, PWA added for offline use, progress for one child in `localStorage` on the device. Nothing leaves the device.

### Growth rules

| State     | Reached when                                         | Answer input                   |
| --------- | ---------------------------------------------------- | ------------------------------ |
| 🌱 Seed   | Starting state                                       | 3 answer bubbles               |
| 🌿 Sprout | 1 correct answer                                     | Number pad                     |
| 🌸 Flower | 2 correct answers in a row (the second always typed) | Number pad (occasional review) |

- A wrong answer resets the streak and moves the plant **back one step** (🌸 → 🌿, 🌿 → 🌱).
- Plants never wilt because the child didn't play.
- **Unlocking is automatic:** the next group of tables opens when most facts in the unlocked groups (default threshold ~80%, to be tuned) are 🌿 or higher. Locked cells are shown as covered soil.

### Art

Three flat SVG plants (`seed`, `sprout`, `flower`) drawn for this project, stored as files and applied through **CSS `background-image`** on each cell according to a state class. A short CSS transition plays when a plant grows. The plants differ in **shape**, not only colour, and have at least 3:1 contrast against the soil. The images are decorative, and each cell carries an accessible name (e.g. "7 × 8, kwiatek").

## Key Assumptions to Validate

- [ ] **The child is motivated by filling in a grid.** Test: draw the grid on paper and colour a cell for each correct answer during a 5-minute session. Watch whether they ask to continue.
- [ ] **The child can use it with icons and digits only, without reading.** Test: hand over the first prototype without explaining anything and watch silently.
- [ ] **Answer bubbles followed by the number pad keep progress honest.** Test: check whether flowers appear only for facts the child can answer on paper.
- [ ] **10 problems per round is the right length.** Test: watch for fatigue or "one more!" at the end of a round.
- [ ] **No audio is acceptable.** Test: see whether the child gets stuck on any screen. If so, reconsider pre-recorded audio.

## MVP Scope

**In:**

- Garden grid home screen (1–10 × 1–10), 3 growth states, commutative pairs share state, locked groups shown as covered soil
- Rounds of 10 problems: smart order, repetition of mistakes, occasional review and ×0 rule problems
- Answer bubbles for seeds, number pad (on-screen + keyboard) for sprouts and flowers
- Dot-array explanation after a mistake
- End-of-round screen ("+3 kwiatki!"), visual only
- Automatic unlocking of the next group of tables
- Progress in `localStorage` for one child, plus a reset behind a parent-only gesture
- PWA offline support, SSR removed
- Polish UI, minimal text, large touch targets, keyboard support, AXE-clean, WCAG AA

**Build order:** engine + plain coloured grid → test with the child → SVG garden art and polish.

## Not Doing (and Why)

- **Pet / character (Jeżyk):** a second reward metaphor splits focus and doubles the art work. The garden is the world.
- **Timers, speed mode, leaderboards:** maths anxiety at this age works against "enjoys practising".
- **Plants wilting when the child doesn't play:** guilt-driven motivation isn't appropriate for a child.
- **×0 on the grid:** it's a rule, not a fact to memorise. It's practised as quick rule problems instead.
- **Audio / speech:** the Polish voice is unreliable offline on many devices, and recordings are costly. Revisit if testing shows reading is a blocker.
- **Accounts, server, sync, analytics:** no children's data off the device. Progress per device is accepted.
- **Multiple profiles:** one child for now.
- **Division, larger ranges, worksheets:** out of scope for learning the table.
- **SSR:** no benefit for an offline, client-only game.

## Open Questions

None blocking. Tuning defaults to set in the spec (all adjustable):

- Unlock threshold (default ~80% of unlocked facts at 🌿 or higher)
- How often review (🌸) and ×0 problems appear in a round
- Exact grouping of tables into unlock stages
