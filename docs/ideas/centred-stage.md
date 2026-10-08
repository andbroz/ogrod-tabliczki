# Centred Stage: game in the middle, with breathing room

## Problem Statement

How might we keep every screen of the game centred in any window, with a comfortable margin that grows with the screen, so nothing sits against the browser or device edges?

## Recommended Direction

`<main>` becomes a single **stage**: it fills the window, centres its content in both directions, and gets a fluid padding (about 16 px on phones up to about 48 px on desktops). That padding also includes the device's **safe-area insets** (notch, rounded corners, home bar). The page opts in with `viewport-fit=cover`, so the background reaches the edges while the content stays safe. Centring is **"safe"**: when a screen is taller than the window, it starts at the top and scrolls, instead of being cut off.

The padding is one CSS variable (`--stage-pad`). The garden size formulas from the responsive change subtract it, so the garden still fits the window height. The round screen is centred as a block, but its answer/feedback area keeps a stable minimum height, so the **question line doesn't move** between bubbles, pad, wrong-answer feedback and the next problem. The per-page centring and padding rules that become redundant are removed.

## Key Assumptions to Validate

- [ ] Content is centred in both directions on every screen. Test: measure the left/right and top/bottom gaps around the content at 360×780, 768×1024, 1024×768, 1440×900 and 1920×1080; each pair should be equal within a few px.
- [ ] No interactive element is closer than the stage padding (≥ 16 px) to the window edge. Test: measure the bounding boxes of every button and link at all sizes.
- [ ] The question line doesn't move between round states. Test: record its top position in the question, correct, wrong and pad states; it should change by less than 2 px.
- [ ] Tall screens aren't cut off. Test: at 740×360 (phone in landscape), the top of each screen is reachable (no content above scroll position 0).
- [ ] Nothing new scrolls. Test: re-run the responsive checks: no scrolling at ≥ 1024×768, no horizontal scroll at 360 px.

## MVP Scope

**In:**

- the stage rule on `<main>`
- `--stage-pad` (fluid, plus safe-area insets)
- `viewport-fit=cover`
- safe vertical centring
- garden formulas updated to use `--stage-pad`
- a stable answer-area height on the round screen
- removal of the redundant per-page centring
- spec updated (layout requirement), browser verification at all sizes

**Out:** everything in Not Doing.

## Not Doing (and Why)

- **A visible frame or panel ("garden bed" card):** it belongs with the SVG art (Task 12). Doing it now means redoing it.
- **A fixed-aspect, scaled game canvas:** it would undo the responsive scaling and make phone portrait tiny.
- **Edge-to-edge layout:** it's the opposite of the request. The safe-area background reaching the edges already gives the "full screen" feel without crowding the controls.
- **Per-device breakpoints for padding:** one fluid formula covers every size, so no list of devices to maintain.

## Open Questions

- None blocking. The padding range (16 → 48 px) is a starting value and easy to tune after a visual check.
