## Goal
Make page navigation in the PDF viewer feel natural: keyboard arrows on laptop, swipe gestures on touchpad/touchscreen, plus keep the existing toolbar controls.

## Yes, all of this is possible
`react-pdf` renders pages as standard DOM, so we can layer keyboard and pointer/touch handlers on top without changing how pages are drawn.

## Changes (all inside `src/pages/PdfViewer.tsx`)

### 1. Keyboard navigation
Add a `useEffect` that listens on `window` for `keydown`:
- `ArrowRight` / `PageDown` / `Space` → next page
- `ArrowLeft` / `PageUp` → previous page
- `Home` → first page, `End` → last page
- `+` / `-` → zoom in/out (nice-to-have, matches toolbar)
- Ignore events when focus is inside an `input`, `textarea`, or `[contenteditable]` so typing in the page-number field still works.

### 2. Swipe / trackpad gestures
Wrap the page canvas in a container with gesture handlers:
- **Touchscreens & touch-capable laptops:** `touchstart` / `touchend` — if horizontal delta > 50px and greater than vertical delta, flip page. (Lightweight, no new dependency.)
- **Trackpad two-finger horizontal swipe:** listen for `wheel` events where `Math.abs(deltaX) > Math.abs(deltaY)` and `deltaX` crosses a threshold (~40px accumulated). Debounce so one swipe = one page turn, not a burst.
- **Mouse drag (optional, low cost):** `pointerdown` + `pointermove` + `pointerup` for click-and-drag horizontal swipe.

Vertical scroll keeps working untouched (we only act on clearly horizontal intent).

### 3. Small UX polish
- Add a subtle visual cue: a brief opacity/translate animation on page change so swipes feel responsive.
- Add `tabIndex={0}` and `autoFocus` on the viewer container so keyboard works immediately after the tab opens, without the user clicking first.
- Keep all existing toolbar buttons; nothing is removed.

## Out of scope
- Pinch-to-zoom (can be a follow-up; needs more gesture logic).
- Tier/download behavior — unchanged.
- No new npm dependencies; everything uses native DOM events.

## Acceptance
- Arrow keys flip pages on desktop.
- Two-finger horizontal swipe on a Mac/Windows trackpad flips one page per gesture.
- Touch swipe flips pages on touch laptops/tablets.
- Typing in the page-number input is unaffected.
- Toolbar still works as before.
