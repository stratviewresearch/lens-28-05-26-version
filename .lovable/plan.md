## Plan

Change the PDF viewer default from "fit width" to "fit whole page" so each slide is fully visible at the largest size that fits the viewport, and stays correct across all device sizes (desktop, tablet, mobile, on rotation/resize).

Single file: `src/pages/PdfViewer.tsx`.

### What changes
- Default the viewer to fit-page (entire slide visible) instead of fit-width.
- Compute both container width and height; scale each page so it fits inside the viewport on both axes (whichever dimension is the limiter wins). Works for landscape PPT-style slides and portrait pages alike.
- Recompute fit on every viewport change: window resize, device rotation, toolbar height change, browser UI showing/hiding on mobile. No layout jumps or clipped slides.
- The "Fit" toolbar button toggles between fit-page and manual zoom, same UX as today.
- Manual zoom (+/-) still overrides fit mode.
- Toolbar shows `Fit` in fit mode, otherwise current `%`.

### Responsive behavior
- Use `ResizeObserver` on the scroll container to track both width and height continuously, so the page rescales smoothly when the device is rotated or the window resized.
- Apply small responsive padding (less padding on mobile, more on desktop) so the slide uses the available space well on small screens without touching the edges.
- Account for the toolbar height implicitly by measuring the actual scroll container (not the window), so any header changes are absorbed automatically.
- Cap minimum scale so very small phones still show a readable page; allow scrolling only if the page truly cannot fit (rare).

### Technical details
- Track `containerWidth` and `containerHeight` via one `ResizeObserver` on the scroll container ref.
- Read the page's natural size from `Page`'s `onLoadSuccess` (`{ width, height }` at scale 1) and store `pageNatural`. Reset on page change so different-sized slides each fit.
- When in fit mode, compute `scale = min((containerWidth - padX) / pageNatural.width, (containerHeight - padY) / pageNatural.height)` and pass `scale` to `<Page>` (drop the `width=` prop so height is also respected).
- `padX`/`padY` chosen via a simple breakpoint (e.g. 8px under 640px wide, 24px above).
- Rename internal `fitWidth` state to `fitPage` (local only).

### Out of scope
- No other files, no new dependencies, no toolbar redesign, no changes to keyboard/swipe/download/progress/error logic.